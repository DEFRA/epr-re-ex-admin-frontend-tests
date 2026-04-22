import { Page } from 'page-objects/page'
import { $, $$ } from '@wdio/globals'

class RegistrationOverviewPage extends Page {
  open() {
    return super.open('/organisations')
  }

  async getHeaderText() {
    return $('#main-content h1.govuk-heading-xl').getText()
  }

  async getReportsTableData() {
    return $$('table.govuk-table tbody tr').map(async (row) => {
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
}

export default new RegistrationOverviewPage()
