import { Page } from 'page-objects/page'
import { clickWhenReady } from 'page-objects/actions'
import { $, $$ } from '@wdio/globals'

class TonnageMonitoringPage extends Page {
  open() {
    return super.open('/tonnage-monitoring')
  }

  async downloadCsv() {
    return clickWhenReady(
      await $('main form button[type="submit"]'),
      'Tonnage monitoring download button not clickable'
    )
  }

  async tonnageMaterialTableData() {
    const table = await $('table.govuk-table')
    await table.waitForDisplayed({
      timeout: 10000,
      timeoutMsg: 'Tonnage monitoring table not displayed'
    })

    const headerElements = await $$('table.govuk-table thead th')
    const headers = []
    for (const el of headerElements) {
      const text = await el.getText()
      headers.push(text)
    }

    const rows = await $$('table.govuk-table tbody tr')
    const tableData = []

    for (const row of rows) {
      const cells = await row.$$('th, td')
      const rowData = {}

      for (let i = 0; i < headers.length; i++) {
        const cellText = await cells[i].getText()
        rowData[headers[i]] = cellText.trim()
      }

      tableData.push(rowData)
    }

    return tableData
  }
}

export default new TonnageMonitoringPage()
