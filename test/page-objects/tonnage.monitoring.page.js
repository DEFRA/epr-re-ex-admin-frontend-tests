import { Page } from 'page-objects/page'
import { $ } from '@wdio/globals'

class TonnageMonitoringPage extends Page {
  open() {
    return super.open('/tonnage-monitoring')
  }

  async downloadCsv() {
    return await $('#main-content > div > div > div > form > button').click()
  }

  async tonnageMaterialTableData() {
    const table = await $('#main-content > div > div > div > table.govuk-table')

    const headerElements = await table.$$('thead th')
    const headers = await headerElements.map(async (el) => {
      return await el.getText()
    })

    const rows = await table.$$('tbody tr')
    const tonnageMaterial = []

    for (const row of rows) {
      const cells = await row.$$('th, td')
      const rowData = {}

      for (let i = 0; i < headers.length; i++) {
        const cellText = await cells[i].getText()
        rowData[headers[i]] = cellText.trim()
      }

      // exclude Total row
      if (rowData[headers[0]] !== 'Total') {
        tonnageMaterial.push(rowData)
      }
    }

    return tonnageMaterial
  }
}

export default new TonnageMonitoringPage()
