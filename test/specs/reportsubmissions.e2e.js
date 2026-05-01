import { browser, expect } from '@wdio/globals'

import {
  createLinkedOrganisation,
  updateMigratedOrganisation,
  createSubmittedReport
} from '../support/apicalls.js'
import LoginPage from 'page-objects/login.js'
import Navigation from 'page-objects/navigation.js'
import ReportSubmissionsPage from 'page-objects/report.submissions.page'

describe('Report Submissions page', () => {
  let orgName

  before(async () => {
    const { refNo, organisation } = await createLinkedOrganisation([
      { material: 'Paper or board (R3)', wasteProcessingType: 'Reprocessor' }
    ])
    orgName = organisation.companyName

    await updateMigratedOrganisation(refNo, [
      {
        regNumber: 'REPROCESS-001',
        status: 'approved',
        reprocessingType: 'input'
      }
    ])

    await createSubmittedReport(refNo)
  })

  it('Should be able to download Report Submissions if logged in @reportsubmissions', async () => {
    await LoginPage.open()
    await expect(browser).toHaveTitle(expect.stringContaining('Login'))
    await LoginPage.enterCredentials('ea@test.gov.uk', 'pass')
    await LoginPage.submitCredentials()

    await Navigation.clickOnLink('Report submissions')

    const csv = await ReportSubmissionsPage.fetchCsv()
    await expect(csv.status).toEqual(200)
    await expect(csv.contentType).toContain('text/csv')
    await expect(csv.contentDisposition).toContain('attachment')
    await expect(csv.body).toContain('Organisation name')
    await expect(csv.body).toContain('Tonnage received for recycling')
    await expect(csv.body).toContain(orgName)

    const rows = csv.body
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
    const headerIndex = rows.findIndex((row) =>
      row.startsWith('"Organisation name"')
    )
    await expect(headerIndex).toBeGreaterThanOrEqual(0)
    const dataRows = rows.slice(headerIndex + 1)

    const orgRow = dataRows.find((row) => row.includes(orgName))
    await expect(orgRow).toBeDefined()
    const cols = orgRow.split('","')
    await expect(cols[11]).toBeTruthy()
    await expect(cols[12]).toBeTruthy()
    await expect(cols[14]).toBeTruthy()
  })

  it('should include all expected column headers in the CSV download @reportsubmissions', async () => {
    await LoginPage.open()
    await LoginPage.enterCredentials('ea@test.gov.uk', 'pass')
    await LoginPage.submitCredentials()

    await Navigation.clickOnLink('Report submissions')

    const csv = await ReportSubmissionsPage.fetchCsv()
    await expect(csv.status).toEqual(200)

    const rows = csv.body
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
    const headerIndex = rows.findIndex((row) =>
      row.startsWith('"Organisation name"')
    )
    await expect(headerIndex).toBeGreaterThanOrEqual(0)

    const headerRow = rows[headerIndex]
    const expectedHeaders = [
      'Organisation name',
      'Organisation registered approver contact number',
      'Organisation registered approver person email address',
      'Organisation registered submitter contact number',
      'Organisation registered submitter email address',
      'Material',
      'Accreditation No',
      'Registered No',
      'Report Type',
      'Report Period',
      'Due Date',
      'Submitted Date',
      'Submitted By',
      'Tonnage received for recycling',
      'Tonnage recycled',
      'Tonnage exported for recycling',
      'Tonnage sent on, total',
      'Tonnage sent on to a reprocessor',
      'Tonnage sent on to an exporter',
      'Tonnage sent on to other facilities',
      'Tonnage of PRNs/PERNs issued',
      'Total revenue from PRNs/PERNs',
      'Average PRN/PERN price per tonne',
      'Tonnage received but not recycled',
      'Tonnage received but not exported',
      'Tonnage exported that was stopped',
      'Tonnage exported that was refused',
      'Tonnage repatriated',
      'Note to regulator'
    ]

    for (const header of expectedHeaders) {
      await expect(headerRow).toContain(header)
    }
  })
})
