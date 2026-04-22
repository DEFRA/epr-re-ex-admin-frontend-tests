import { Page } from 'page-objects/page'
import { $, $$ } from '@wdio/globals'

class QueueManagementPage extends Page {
  open() {
    return super.open('/queue-management')
  }

  async getHeaderText() {
    const heading = await $('h1')
    return heading.getText()
  }

  async getMessageCount() {
    const text = await $('p').getText()
    const match = text.match(/(\d+) messages?/)
    return match ? Number(match[1]) : null
  }

  async getEmptyStateText() {
    const paragraphs = await $$('#main-content p')
    const texts = await Promise.all(paragraphs.map((p) => p.getText()))
    return texts.find((t) => t.includes('no messages'))
  }

  async getTableHeaders() {
    const headers = await $$('table thead th')
    return Promise.all(headers.map((th) => th.getText()))
  }

  async getFirstRowData() {
    const cells = await $$('table tbody tr:first-child td')
    const texts = await Promise.all(cells.map((td) => td.getText()))
    return {
      commandType: texts[0],
      summaryLogId: texts[1],
      sentTimestamp: texts[2],
      receiveCount: texts[3]
    }
  }

  async expandRawMessage() {
    const details = await $('table tbody details summary')
    await details.click()
  }

  async getRawMessageBody() {
    const pre = await $('table tbody details pre')
    await pre.waitForDisplayed()
    return pre.getText()
  }

  async clickClearAllMessages() {
    const button = await $(
      'a.govuk-button--warning, button.govuk-button--warning'
    )
    await button.click()
  }

  async getConfirmHeading() {
    const heading = await $('h1')
    return heading.getText()
  }

  async confirmClear() {
    const button = await $('button[type=submit]')
    await button.click()
  }

  async getSuccessBannerText() {
    const banner = await $(
      '.govuk-notification-banner--success .govuk-notification-banner__content'
    )
    await banner.waitForDisplayed()
    return banner.getText()
  }
}

export default new QueueManagementPage()
