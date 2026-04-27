import { Page } from 'page-objects/page'
import { $, $$ } from '@wdio/globals'

class RegistrationOverviewPage extends Page {
  async getHeaderText() {
    const heading = $('#main-content h1.govuk-heading-xl')
    await heading.waitForExist()
    return heading.getText()
  }

  async getReportsTableData() {
    return await $$('#reports table tbody tr').map(async (row) => {
      const start = await row.$('td:nth-child(1)')
      const end = await row.$('td:nth-child(2)')
      const due = await row.$('td:nth-child(3)')
      const status = await row.$('td:nth-child(4)')
      return {
        start: await start.getText(),
        end: await end.getText(),
        due: await due.getText(),
        status: await status.getText()
      }
    })
  }

  async getSummaryLogsContent() {
    return await $('#summary-logs').getText()
  }
}

export default new RegistrationOverviewPage()
