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
      const period = await row.$('td:nth-child(1)')
      const due = await row.$('td:nth-child(2)')
      const status = await row.$('td:nth-child(3)')
      const actions = await row.$('td:nth-child(4)')
      return {
        period: await period.getText(),
        due: await due.getText(),
        status: await status.getText(),
        actions: await actions.getText()
      }
    })
  }

  async clickOnViewORSLink() {
    await $(
      '#main-content > div > div:nth-child(2) > div > dl > div:nth-child(10) > dd > a'
    ).click()
  }

  async clickOnUnsubmitReportLink(row) {
    await $(
      `#reports > table > tbody > tr:nth-child(${row}) > td:nth-child(4) > a:nth-child(3)`
    ).click()
  }

  async unsubmitReportLinkExists(row) {
    const unsubmitElement = $(
      `#reports > table > tbody > tr:nth-child(${row}) > td:nth-child(4) > a:nth-child(3)`
    )
    return await unsubmitElement.isExisting()
  }

  async getSummaryLogsContent() {
    return await $('#summary-logs').getText()
  }
}

export default new RegistrationOverviewPage()
