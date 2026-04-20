import { Page } from 'page-objects/page'
import { $ } from '@wdio/globals'

class ReportSubmissionsPage extends Page {
  open() {
    return super.open('/report-submissions')
  }

  async downloadReportSubmissions() {
    return await $('#main-content button[type="submit"].govuk-button').click()
  }
}

export default new ReportSubmissionsPage()
