import { browser, expect } from '@wdio/globals'

import LoginPage from 'page-objects/login.js'
import Navigation from 'page-objects/navigation.js'
import TonnageMonitoringPage from 'page-objects/tonnage.monitoring.page.js'

describe('Tonnage Monitoring page', () => {
  it('Should be able to view Tonnage Monitoring if logged in @tonnagemonitoring', async () => {
    await LoginPage.open()
    await expect(browser).toHaveTitle(expect.stringContaining('Login'))
    await LoginPage.enterCredentials('ea@test.gov.uk', 'pass')
    await LoginPage.submitCredentials()

    await Navigation.clickOnLink('Tonnage monitoring')

    const materialTableData =
      await TonnageMonitoringPage.tonnageMaterialTableData()

    // Validate table structure has Material, Type, and month columns
    await expect(materialTableData.length).toBeGreaterThan(0)
    const firstRow = materialTableData[0]
    await expect(firstRow).toHaveProperty('Material')
    await expect(firstRow).toHaveProperty('Type')

    const monthColumns = Object.keys(firstRow).filter(key => key !== 'Material' && key !== 'Type' && key !== '')
    await expect(monthColumns.length).toBeGreaterThan(0)

    // Validate key materials are present for both Reprocessor and Exporter types
    const materials = ['Aluminium', 'Fibre based composite', 'Paper and board', 'Plastic', 'Steel', 'Wood', 'Glass re-melt', 'Glass other']
    const types = ['Reprocessor', 'Exporter']

    for (const material of materials) {
      for (const type of types) {
        const row = materialTableData.find(r => r.Material === material && r.Type === type)
        await expect(row).toBeDefined()
        for (const month of monthColumns) {
          await expect(row).toHaveProperty(month)
          const tonnageValue = row[month]
          await expect(tonnageValue).toBeDefined()
        }
      }
    }

    await TonnageMonitoringPage.downloadCsv()
  })
})
