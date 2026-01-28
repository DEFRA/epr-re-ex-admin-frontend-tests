import { browser, expect } from '@wdio/globals'

import HomePage from 'page-objects/home.page'
import LoginPage from 'page-objects/login.js'

describe('Smoke tests @smoketest', () => {
  it('Should be to login and view Home Page and Organisations Page', async () => {
    await HomePage.open()
    await expect(browser).toHaveTitle(expect.stringContaining('Home'))

    await LoginPage.open()
  })
})
