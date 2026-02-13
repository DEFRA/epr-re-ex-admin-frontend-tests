import { browser, expect } from '@wdio/globals'

import HomePage from 'page-objects/home.page'
import LoginPage from 'page-objects/login.js'
import Navigation from 'page-objects/navigation.js'
import OrganisationsPage from 'page-objects/organisations.js'
import PublicRegisterPage from 'page-objects/public.register.page.js'
import SystemLogsPage from 'page-objects/system.logs.page.js'
import config from '../config/config.js'
import TonnageMonitoringPage from 'page-objects/tonnage.monitoring.page.js'
import { checkBodyText } from '~/test/support/check.js'

describe('Smoke tests @smoketest', () => {
  it('Should be to login and view Home Page and Organisations Page', async () => {
    await HomePage.open()
    await expect(browser).toHaveTitle(expect.stringContaining('Home'))

    await LoginPage.open()
    await LoginPage.enterCredentialsMSLogin(
      config.auth.username,
      config.auth.password
    )

    const headerText = await browser.$('main h1').getText()
    expect(headerText).toEqual('Welcome ServiceMaintainer TestUser (Defra)!')

    await Navigation.clickOnLink('Organisations')
    // Give it some time as organisations page might take time to load
    checkBodyText('All organisations', 60)
    const orgTableHeader = await OrganisationsPage.getHeaderText()
    expect(orgTableHeader).toBe('All organisations')

    await Navigation.clickOnLink('System logs')
    const actualNoSystemLogsFoundText = await SystemLogsPage.noSystemLogsFound()
    expect(actualNoSystemLogsFoundText).toEqual('No system logs found')

    await Navigation.clickOnLink('Public register')
    // Give it some time to load
    checkBodyText('Public register', 30)
    await PublicRegisterPage.downloadPublicRegister()

    await Navigation.clickOnLink('Tonnage monitoring')
    await TonnageMonitoringPage.downloadCsv()
  })
})
