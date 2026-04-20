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
    await ReportSubmissionsPage.downloadReportSubmissions()
  })
})
