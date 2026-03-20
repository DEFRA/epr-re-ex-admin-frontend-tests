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

    await LoginPage.open()
    await LoginPage.enterCredentials('ea@test.gov.uk', 'pass')
    await LoginPage.submitCredentials()

    await OrsUploadPage.open()
    await expect(browser).toHaveTitle(
      expect.stringContaining('Upload ORS workbooks')
    )

    await OrsUploadPage.expectUploadFormVisible()
    await OrsUploadPage.uploadWorkbook(workbookPath)
    await OrsUploadPage.clickStartUpload()

    await OrsUploadPage.waitForStatusPage()
    const finalStatus = await OrsUploadPage.waitForCompletedOrFailedImport()

    expect(finalStatus).toEqual('Import completed')

    const statusSummary = await OrsUploadPage.getStatusSummaryText()
    expect(statusSummary).toContain('Files processed: 1')
    expect(statusSummary).toContain('Successful: 1')
    expect(statusSummary).toContain('Failed: 0')

    const fileResults = await OrsUploadPage.getUploadedFileResults()
    expect(fileResults).toHaveLength(1)
    expect(fileResults[0].fileName).toContain(`ors-test-${orgId}`)
    expect(fileResults[0].result).toEqual('success')

    const uploadMoreLink = await $('a[href="/overseas-sites/imports"]')
    await expect(uploadMoreLink).toBeDisplayed()

    await OrsUploadPage.openList()
    await expect(browser).toHaveTitle(
      expect.stringContaining('Overseas reprocessing sites')
    )

    const expectedHeaders = [
      'ORS ID',
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
    expect(rows).toContainEqual([
      '001',
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
  })
})
