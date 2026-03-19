import path from 'node:path'

import { $, $$, browser, expect } from '@wdio/globals'
import { Page } from 'page-objects/page'

class OrsUploadPage extends Page {
  open() {
    return super.open('/overseas-sites/imports')
  }

  async uploadWorkbook(localFilePath) {
    const remotePath = await browser.uploadFile(localFilePath)
    const uploadInput = await $('#ors-upload')
    await uploadInput.waitForDisplayed({ timeout: 10000 })
    await uploadInput.setValue(remotePath)
  }

  async clickStartUpload() {
    const startUploadButton = await $('button[type="submit"]')
    await startUploadButton.waitForClickable({ timeout: 10000 })
    await startUploadButton.click()
  }

  async waitForStatusPage() {
    await browser.waitUntil(
      async () => {
        const url = await browser.getUrl()
        return /\/overseas-sites\/imports\/[^/]+$/u.test(url)
      },
      {
        timeout: 30000,
        interval: 500,
        timeoutMsg: 'Expected to be redirected to ORS upload status page'
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
        timeout: 180000,
        interval: 3000,
        timeoutMsg: 'Expected ORS upload to reach completed or failed status'
      }
    )

    return $('main h1').getText()
  }

  async getStatusSummaryText() {
    return $('#main-content').getText()
  }

  async getUploadedFileResults() {
    const rows = await $$('table.govuk-table tbody tr')

    return Promise.all(
      rows.map(async (row) => {
        const fileName = await row.$('td:nth-child(1)').getText()
        const result = await row.$('td:nth-child(2)').getText()
        const details = await row.$('td:nth-child(3)').getText()

        return {
          fileName,
          result,
          details
        }
      })
    )
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
