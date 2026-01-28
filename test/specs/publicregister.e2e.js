import { browser, expect } from '@wdio/globals'

import LoginPage from 'page-objects/login.js'
import Navigation from 'page-objects/navigation.js'
import PublicRegisterPage from 'page-objects/public.register.page.js'
import path from 'path'
import fs from 'fs'

describe('Public Register page', () => {
  it('Should be able to download Public Register if logged in @publicregister', async () => {
    const downloadDir = path.join(process.cwd(), 'downloads')

    await LoginPage.open()
    await expect(browser).toHaveTitle(expect.stringContaining('Login'))
    await LoginPage.enterCredentials('ea@test.gov.uk', 'pass')
    await LoginPage.submitCredentials()

    await Navigation.clickOnLink('Public register')
    await PublicRegisterPage.downloadPublicRegister()

    let downloadedFile
    await browser.waitUntil(
      () => {
        const filesDownloaded = fs.readdirSync(downloadDir)
        const newFiles = filesDownloaded.filter((f) => f.endsWith('.csv'))

        // Verify file exists and has content
        if (newFiles.length > 0) {
          downloadedFile = newFiles[0]
          const filePath = path.join(downloadDir, downloadedFile)
          return fs.statSync(filePath).size > 0
        }
        return false
      },
      {
        timeout: 10000,
        timeoutMsg: 'Public Register file was not downloaded'
      }
    )
    expect(downloadedFile).toContain('.csv')
  })
})
