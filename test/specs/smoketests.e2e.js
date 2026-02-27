import { browser, expect } from '@wdio/globals'

import HomePage from 'page-objects/home.page'
import LoginPage from 'page-objects/login.js'
import Navigation from 'page-objects/navigation.js'
import OrganisationsPage from 'page-objects/organisations.js'
import PublicRegisterPage from 'page-objects/public.register.page.js'
import SystemLogsPage from 'page-objects/system.logs.page.js'
import config from '../config/config.js'
import TonnageMonitoringPage from 'page-objects/tonnage.monitoring.page.js'

describe('Smoke tests @smoketest', () => {
  it('Should be to login and view Home Page and Organisations Page', async () => {
    // Increase timeout for Smoke tests for slow loading pages like Organisation page
    await browser.setTimeout({ pageLoad: 60000 })

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
    const orgTableHeader = await OrganisationsPage.getHeaderText()
    expect(orgTableHeader).toBe('All organisations')

    await Navigation.clickOnLink('System logs')
    const actualNoSystemLogsFoundText = await SystemLogsPage.noSystemLogsFound()
    expect(actualNoSystemLogsFoundText).toEqual('No system logs found')

    await Navigation.clickOnLink('Public register')
    await PublicRegisterPage.downloadPublicRegister()

    await Navigation.clickOnLink('Tonnage monitoring')
    await TonnageMonitoringPage.downloadCsv()
  })

  it('Should be redirected to the orginially requested page and not redirected to the home page', async () => {
    await browser.setTimeout({ pageLoad: 60000 })

    await OrganisationsPage.open()
    await expect(browser).toHaveTitle(expect.stringContaining('Organisations'))

    await $('=Sign in').click()

    await LoginPage.enterCredentials('ea@test.gov.uk', 'pass')
    await LoginPage.submitCredentials()

    const orgTableHeader = await OrganisationsPage.getHeaderText()
    expect(orgTableHeader).toBe('All organisations')

    await expect($('body')).not.toHaveText(expect.stringContaining('This is the home page.'))
  })
})
