import path from 'node:path'
import os from 'node:os'

import { $, browser, expect } from '@wdio/globals'

import LoginPage from 'page-objects/login.js'
import OrsUploadPage from 'page-objects/ors.upload.page.js'
import {
  createLinkedOrganisation,
  updateMigratedOrganisation
} from '../support/apicalls.js'
import {
  createOrsSpreadsheet,
  validOrsSites
} from '../support/ors-spreadsheet.js'

async function loginAsServiceMaintainer() {
  await browser.deleteCookies()
  await LoginPage.open()
  await LoginPage.enterCredentials('ea@test.gov.uk', 'pass')
  await LoginPage.submitCredentials()
}

async function uploadWorkbookAndWaitForCompletion(workbookPath) {
  await OrsUploadPage.open()
  await expect(browser).toHaveTitle(
    expect.stringContaining('Upload ORS workbooks')
  )

  await OrsUploadPage.expectUploadFormVisible()
  await OrsUploadPage.uploadWorkbook(workbookPath)
  await OrsUploadPage.clickStartUpload()
  await OrsUploadPage.waitForStatusPage()

  return OrsUploadPage.waitForCompletedOrFailedImport()
}

describe('ORS upload flow @orsupload', () => {
  it('Should upload an ORS workbook and show completed import status', async () => {
    const { orgId, refNo } = await createLinkedOrganisation([
      { material: 'Paper or board (R3)', wasteProcessingType: 'Exporter' }
    ])

    const registrationNumber = `FAKE/REG${orgId}/TEST`
    const accreditationNumber = `FAKE/ACC${orgId}/TEST`

    await updateMigratedOrganisation(refNo, [
      {
        regNumber: registrationNumber,
        accNumber: accreditationNumber,
        status: 'approved'
      }
    ])

    const workbookPath = path.join(os.tmpdir(), `ors-test-${orgId}.xlsx`)

    await createOrsSpreadsheet(workbookPath, {
      metadata: {
        packagingWasteCategory: 'Paper or board',
        orgId: parseInt(orgId),
        registrationNumber,
        accreditationNumber
      },
      sites: validOrsSites
    })

    await loginAsServiceMaintainer()

    const finalStatus = await uploadWorkbookAndWaitForCompletion(workbookPath)

    expect(finalStatus).toEqual('Import completed')

    const statusSummary = await OrsUploadPage.getStatusSummaryText()
    expect(statusSummary).toContain('Files processed: 1')
    expect(statusSummary).toContain('Successful: 1')
    expect(statusSummary).toContain('Failed: 0')

    const fileResults = await OrsUploadPage.getUploadedFileResults()
    expect(fileResults).toHaveLength(1)
    expect(fileResults[0].fileName).toContain(`ors-test-${orgId}`)
    expect(fileResults[0].result).toEqual('success')

    const viewRecordsLink = await $('a[href="/overseas-sites"]')
    await expect(viewRecordsLink).toBeDisplayed()

    await OrsUploadPage.openList()
    await expect(browser).toHaveTitle(
      expect.stringContaining('Overseas reprocessing sites')
    )
    await OrsUploadPage.expectDownloadCsvVisible()

    const csvDownload = await OrsUploadPage.fetchListCsv()
    expect(csvDownload.status).toEqual(200)
    expect(csvDownload.contentType).toContain('text/csv')
    expect(csvDownload.contentDisposition).toEqual(
      'attachment; filename="overseas-reprocessing-sites.csv"'
    )
    expect(csvDownload.body).toContain(
      '"Org ID","Registration Number","Accreditation Number","ORS ID"'
    )
    expect(csvDownload.body).toContain(String(orgId))
    expect(csvDownload.body).toContain(registrationNumber)
    expect(csvDownload.body).toContain(accreditationNumber)
    expect(csvDownload.body).toContain('Fake Recycling Co')

    const expectedHeaders = [
      'Org ID',
      'Registration Number',
      'Accreditation Number',
      'ORS ID',
      'Packaging waste category',
      'Destination country',
      'Overseas reprocessor name',
      'Address line 1',
      'Address line 2',
      'City or town',
      'State, province or region',
      'Postcode or similar',
      'Coordinates',
      'Valid from'
    ]

    const actualHeaders = await OrsUploadPage.getListTableHeaders()
    expect(actualHeaders).toEqual(expectedHeaders)

    const rows = await OrsUploadPage.getListTableRows()
    expect(rows.length).toBeGreaterThan(0)

    const uploadedRow = rows.find(
      (row) =>
        row[0] === String(orgId) &&
        row[1] === registrationNumber &&
        row[2] === accreditationNumber &&
        row[3] === '001'
    )
    expect(uploadedRow).toBeDefined()
    expect(uploadedRow).toHaveLength(14)
    expect(uploadedRow[4]).not.toEqual('-')
    expect(uploadedRow.slice(5)).toEqual([
      'Testland',
      'Fake Recycling Co',
      '1 Test Street',
      'Unit 99',
      'Testville',
      'Testshire',
      'TEST 001',
      '0.0000,0.0000',
      '1 January 2025'
    ])

    await OrsUploadPage.openList('page=1&pageSize=2')
    await OrsUploadPage.expectPaginationVisible()

    const pageOneStatus = await OrsUploadPage.getPaginationStatusText()
    expect(pageOneStatus).toContain('Showing page 1 of')

    await OrsUploadPage.clickPageNumber(2)
    await expect(browser).toHaveUrl(
      expect.stringContaining('page=2&pageSize=2')
    )

    const pageTwoStatus = await OrsUploadPage.getPaginationStatusText()
    expect(pageTwoStatus).toContain('Showing page 2 of')

    const pageTwoRows = await OrsUploadPage.getListTableRows()
    expect(pageTwoRows.length).toBeGreaterThan(0)
    expect(pageTwoRows.length).toBeLessThanOrEqual(2)
  })

  describe('Registration number filter @orsupload', () => {
    let alphaRegistrationNumber
    let betaRegistrationNumber

    it('Should upload workbooks for filter tests', async () => {
      const { orgId, refNo } = await createLinkedOrganisation([
        { material: 'Paper or board (R3)', wasteProcessingType: 'Exporter' },
        { material: 'Steel (R4)', wasteProcessingType: 'Exporter' }
      ])

      alphaRegistrationNumber = `FAKE/REG${orgId}/ALPHA`
      betaRegistrationNumber = `FAKE/REG${orgId}/BETA`
      const alphaAccreditationNumber = `FAKE/ACC${orgId}/ALPHA`
      const betaAccreditationNumber = `FAKE/ACC${orgId}/BETA`

      await updateMigratedOrganisation(refNo, [
        {
          regNumber: alphaRegistrationNumber,
          accNumber: alphaAccreditationNumber,
          status: 'approved'
        },
        {
          regNumber: betaRegistrationNumber,
          accNumber: betaAccreditationNumber,
          status: 'approved'
        }
      ])

      const alphaWorkbookPath = path.join(
        os.tmpdir(),
        `ors-alpha-${orgId}.xlsx`
      )
      const betaWorkbookPath = path.join(os.tmpdir(), `ors-beta-${orgId}.xlsx`)

      await createOrsSpreadsheet(alphaWorkbookPath, {
        metadata: {
          packagingWasteCategory: 'Paper or board',
          orgId: parseInt(orgId),
          registrationNumber: alphaRegistrationNumber,
          accreditationNumber: alphaAccreditationNumber
        },
        sites: validOrsSites
      })

      await createOrsSpreadsheet(betaWorkbookPath, {
        metadata: {
          packagingWasteCategory: 'Steel',
          orgId: parseInt(orgId),
          registrationNumber: betaRegistrationNumber,
          accreditationNumber: betaAccreditationNumber
        },
        sites: validOrsSites
      })

      await loginAsServiceMaintainer()

      expect(
        await uploadWorkbookAndWaitForCompletion(alphaWorkbookPath)
      ).toEqual('Import completed')
      expect(
        await uploadWorkbookAndWaitForCompletion(betaWorkbookPath)
      ).toEqual('Import completed')
    })

    it('Should filter list by registration number', async () => {
      await OrsUploadPage.openList()
      await OrsUploadPage.filterByRegistrationNumber(alphaRegistrationNumber)
      await expect(browser).toHaveUrl(
        expect.stringContaining(
          `registrationNumber=${encodeURIComponent(alphaRegistrationNumber)}`
        )
      )
      await expect(await OrsUploadPage.getRegistrationNumberFilterValue()).toBe(
        alphaRegistrationNumber
      )

      const filteredRows = await OrsUploadPage.getListTableRows()
      expect(filteredRows.length).toBe(3)
      expect(
        filteredRows.every((row) => row[1] === alphaRegistrationNumber)
      ).toBe(true)
    })

    it('Should clear the registration number filter', async () => {
      await OrsUploadPage.openList()
      await OrsUploadPage.filterByRegistrationNumber(alphaRegistrationNumber)
      await OrsUploadPage.clearRegistrationNumberFilter()
      await expect(browser).not.toHaveUrl(
        expect.stringContaining(
          `registrationNumber=${encodeURIComponent(alphaRegistrationNumber)}`
        )
      )
    })

    it('Should preserve filter through pagination', async () => {
      await OrsUploadPage.openList(
        new URLSearchParams({
          page: '1',
          pageSize: '2',
          registrationNumber: alphaRegistrationNumber
        }).toString()
      )
      await OrsUploadPage.expectPaginationVisible()

      const pageOneStatus = await OrsUploadPage.getPaginationStatusText()
      expect(pageOneStatus).toContain('Showing page 1 of 2')

      const pageOneRows = await OrsUploadPage.getListTableRows()
      expect(pageOneRows).toHaveLength(2)
      expect(
        pageOneRows.every((row) => row[1] === alphaRegistrationNumber)
      ).toBe(true)

      await OrsUploadPage.clickPageNumber(2)
      await expect(browser).toHaveUrl(
        expect.stringContaining(
          new URLSearchParams({
            page: '2',
            pageSize: '2',
            registrationNumber: alphaRegistrationNumber
          }).toString()
        )
      )

      const pageTwoStatus = await OrsUploadPage.getPaginationStatusText()
      expect(pageTwoStatus).toContain('Showing page 2 of 2')

      const pageTwoRows = await OrsUploadPage.getListTableRows()
      expect(pageTwoRows).toHaveLength(1)
      expect(pageTwoRows[0][1]).toEqual(alphaRegistrationNumber)
    })

    it('Should download CSV with active filter', async () => {
      await OrsUploadPage.openList(
        new URLSearchParams({
          page: '1',
          pageSize: '2',
          registrationNumber: alphaRegistrationNumber
        }).toString()
      )

      const filteredCsvDownload = await OrsUploadPage.fetchListCsv()
      expect(filteredCsvDownload.status).toEqual(200)
      expect(filteredCsvDownload.contentType).toContain('text/csv')
      expect(filteredCsvDownload.contentDisposition).toEqual(
        'attachment; filename="overseas-reprocessing-sites.csv"'
      )
      expect(filteredCsvDownload.body).toContain(
        '"Org ID","Registration Number","Accreditation Number","ORS ID"'
      )
      expect(filteredCsvDownload.body).toContain(alphaRegistrationNumber)
      expect(filteredCsvDownload.body).toContain(betaRegistrationNumber)
    })

    it('Should show empty state for non-matching filter', async () => {
      await OrsUploadPage.openList('registrationNumber=NOT-FOUND')
      expect(await OrsUploadPage.getInsetText()).toContain(
        "No overseas reprocessing site data found matching 'NOT-FOUND'."
      )
    })
  })
})
