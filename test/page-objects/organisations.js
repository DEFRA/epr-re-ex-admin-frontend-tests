import { Page } from 'page-objects/page'
import { $, $$ } from '@wdio/globals'

class OrganisationsPage extends Page {
  open() {
    return super.open('/organisations')
  }

  async getTableData() {
    return $$('table.govuk-table tbody tr').map(async (row) => {
      const header = await row.$('th.govuk-table__header')
      const orgId = await row.$('td:nth-child(2)')
      const regNo = await row.$('td:nth-child(3)')
      const regulator = await row.$('td:nth-child(4)')
      const status = await row.$('td:nth-child(5)')
      return {
        header: await header.getText(),
        orgId: await orgId.getText(),
        regNo: await regNo.getText(),
        regulator: await regulator.getText(),
        status: await status.getText()
      }
    })
  }

  async editLink(row) {
    await $(
      `#main-content > div > div > div > table > tbody > tr:nth-child(${row}) > td:nth-child(6) > a`
    ).click()
  }

  async searchFor(orgName) {
    await $('#search').setValue(orgName)
    await $('button[type=submit]').click()
  }

  async searchResult() {
    const elem = await $('#main-content > div:nth-child(2) > div > div > h2')
    return elem.getText()
  }

  async getSuccessMessage() {
    const successElem = await $('#organisation-success-message')
    return successElem.getText()
  }

  async clearSearch() {
    await $(
      '#main-content > div:nth-child(1) > div > form > div.govuk-button-group > a'
    ).click()
  }
}

export default new OrganisationsPage()
