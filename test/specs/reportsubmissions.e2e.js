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
    expect(csv.status).toEqual(200)
    expect(csv.contentType).toContain('text/csv')
    expect(csv.contentDisposition).toContain('attachment')
    expect(csv.body).toContain(
      '"Organisation name","Registration submitter contact number","Registration approved person contact number","Registration submitter email address","Registration approved person email address","Material","Registration No","Accreditation No","Report Type","Reporting Period","Due Date","Submitted Date","Submitted By"'
    )
    const rows = csv.body.split('\n').filter((line) => line.trim().length > 0)
    expect(rows.length).toBeGreaterThan(3)
  })
})
