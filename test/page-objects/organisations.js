import { Page } from 'page-objects/page'
import { $$ } from '@wdio/globals'

class OrganisationsPage extends Page {
  open() {
    return super.open('/organisations')
  }

  async getTableData() {
    return $$('table.govuk-table tbody tr').map(async (row) => {
      const header = await row.$('th.govuk-table__header')
      // #main-content > div > div > div > table > tbody > tr:nth-child(1) > td:nth-child(2)
      const orgId = await row.$('td:nth-child(2)')
      const regNo = await row.$('td:nth-child(3)')
      const status = await row.$('td:nth-child(4)')
      return {
        header: await header.getText(),
        orgId: await orgId.getText(),
        regNo: await regNo.getText(),
        status: await status.getText()
      }
    })
  }
}

export default new OrganisationsPage()
