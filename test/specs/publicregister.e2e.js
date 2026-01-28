import { browser, expect } from '@wdio/globals'

import LoginPage from 'page-objects/login.js'
import Navigation from 'page-objects/navigation.js'
import PublicRegisterPage from 'page-objects/public.register.page.js'

describe('Public Register page', () => {
  it('Should be able to view Public Register if logged in @publicregister', async () => {
    await LoginPage.open()
    await expect(browser).toHaveTitle(expect.stringContaining('Login'))
    await LoginPage.enterCredentials('ea@test.gov.uk', 'pass')
    await LoginPage.submitCredentials()

    await Navigation.clickOnLink('Public register')
    await PublicRegisterPage.downloadPublicRegister()
  })
})
