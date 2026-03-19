import path from 'node:path'

import { $, $$, browser, expect } from '@wdio/globals'
import { Page } from 'page-objects/page'

class OrsUploadPage extends Page {
  open() {
    return super.open('/overseas-sites/imports')
  }

  async capturePageState() {
    const url = await browser.getUrl()
    const heading = await $('main h1')
      .getText()
      .catch(() => '(no h1 found)')
    const body = await $('[data-testid="app-page-body"]')
      .getText()
      .catch(() => '(no page body found)')

    return `URL: ${url}\nHeading: ${heading}\nBody: ${body}`
  }

  async uploadWorkbook(localFilePath) {
    const remotePath = await browser.uploadFile(localFilePath)
    const uploadInput = await $('#ors-upload')
    await uploadInput.waitForDisplayed({
      timeout: 5000,
      timeoutMsg: 'Upload file input not displayed'
    })
    await uploadInput.setValue(remotePath)
  }

  async clickStartUpload() {
    const startUploadButton = await $('button[type="submit"]')
    await startUploadButton.waitForClickable({
      timeout: 5000,
      timeoutMsg: 'Start upload button not clickable'
    })
    await startUploadButton.click()
  }

  async waitForStatusPage() {
    await browser.waitUntil(
      async () => {
        const url = await browser.getUrl()
        return /\/overseas-sites\/imports\/[^/]+$/u.test(url)
      },
      {
        timeout: 15000,
        interval: 500,
        timeoutMsg: `Not redirected to status page. ${await this.capturePageState()}`
      }
    )
  }

  async waitForCompletedOrFailedImport() {
    await browser.waitUntil(
      async () => {
        const heading = await $('main h1').getText()
        return heading === 'Import completed' || heading === 'Import failed'
      },
      {
        timeout: 30000,
        interval: 3000,
        timeoutMsg: `Import did not reach terminal state. ${await this.capturePageState()}`
      }
    )

    return $('main h1').getText()
  }

  async getStatusSummaryText() {
    return $('#main-content').getText()
  }

  async getUploadedFileResults() {
    const rows = await $$('table.govuk-table tbody tr')
    const results = []

    for (const row of rows) {
      const fileName = await row.$('td:nth-child(1)').getText()
      const result = await row.$('td:nth-child(2)').getText()
      const details = await row.$('td:nth-child(3)').getText()

      results.push({ fileName, result, details })
    }

    return results
  }

  async expectUploadFormVisible() {
    const uploadInput = await $('#ors-upload')
    const startButton = await $('button[type="submit"]')

    await expect(uploadInput).toBeDisplayed()
    await expect(startButton).toBeDisplayed()
  }

  workbookFileName(filePath) {
    return path.basename(filePath)
  }
}

export default new OrsUploadPage()
