import { Page } from 'page-objects/page'
import { $ } from '@wdio/globals'

class ReportViewPage extends Page {
  async getHeaderText() {
    const heading = $('#main-content h1.govuk-heading-xl')
    await heading.waitForExist()
    return heading.getText()
  }
}

export default new ReportViewPage()
