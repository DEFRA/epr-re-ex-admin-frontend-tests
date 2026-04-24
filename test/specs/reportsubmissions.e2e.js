import { browser, expect } from '@wdio/globals'

import LoginPage from 'page-objects/login.js'
import Navigation from 'page-objects/navigation.js'
import ReportSubmissionsPage from 'page-objects/report.submissions.page.js'

describe('Report Submissions page', () => {
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
    await expect(csv.body).toContain(
      '"Organisation name","Organisation registered approver contact number","Organisation registered approver person email address","Organisation registered submitter contact number","Organisation registered submitter email address","Material","Accreditation No","Registered No","Report Type","Report Period","Due Date","Submitted Date","Submitted By"'
    )
    const lines = csv.body
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
    const headerIndex = lines.findIndex((line) =>
      line.startsWith('"Organisation name"')
    )
    const dataRows = lines.slice(headerIndex + 1)
    await expect(dataRows.length).toBeGreaterThan(0)
  })
})
