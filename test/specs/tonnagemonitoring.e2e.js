import { browser, expect } from '@wdio/globals'

import LoginPage from 'page-objects/login.js'
import Navigation from 'page-objects/navigation.js'
import TonnageMonitoringPage from 'page-objects/tonnage.monitoring.page.js'

describe('Tonnage Monitoring page', () => {
  it.skip('Should be able to view Tonnage Monitoring if logged in @tonnagemonitoring', async () => {
    await LoginPage.open()
    await expect(browser).toHaveTitle(expect.stringContaining('Login'))
    await LoginPage.enterCredentials('ea@test.gov.uk', 'pass')
    await LoginPage.submitCredentials()

    await Navigation.clickOnLink('Tonnage monitoring')

    const expectedTable = [
      { Material: 'Aluminium', Tonnage: '0.00' },
      { Material: 'Fibre based composite ', Tonnage: '0.00' },
      { Material: 'Glass other', Tonnage: '0.00' },
      { Material: 'Glass re-melt', Tonnage: '0.00' },
      { Material: 'Paper and board', Tonnage: '0.00' },
      { Material: 'Plastic', Tonnage: '0.00' },
      { Material: 'Steel', Tonnage: '0.00' },
      { Material: 'Wood', Tonnage: '0.00' }
    ]
    const materialTableData =
      await TonnageMonitoringPage.tonnageMaterialTableData()

    await expect(materialTableData).toEqual(expectedTable)

    await TonnageMonitoringPage.downloadCsv()
  })
})
