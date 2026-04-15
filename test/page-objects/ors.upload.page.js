import path from 'node:path'

import { $, $$, browser, expect } from '@wdio/globals'
import { Page } from 'page-objects/page'
import {
  clickAndWaitForNavigation,
  clickWhenReady,
  setValueWhenReady
} from 'page-objects/actions'

class OrsUploadPage extends Page {
  get listTable() {
    return $('table.govuk-table')
  }

  get registrationNumberInput() {
    return $('#registrationNumber')
  }

  get paginationNav() {
    return $('nav.govuk-pagination')
  }

  get downloadCsvForm() {
    return $('form[method="POST"]')
  }

  openList(query = '') {
    const suffix = query ? `?${query}` : ''
    return super.open(`/overseas-sites${suffix}`)
  }

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
    await uploadInput.waitForExist({
      timeout: 5000,
      timeoutMsg: 'Upload file input not found'
    })
    await uploadInput.setValue(remotePath)
  }

  async clickStartUpload() {
    await clickAndWaitForNavigation(
      'button[type="submit"]',
      'Start upload button not clickable'
    )
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

  async getListTableHeaders() {
    const listTable = await this.listTable
    await listTable.waitForDisplayed({
      timeout: 10000,
      timeoutMsg: 'ORS list table not displayed'
    })

    const headerCells = await $$('table.govuk-table thead th')
    const headers = []

    for (const headerCell of headerCells) {
      headers.push((await headerCell.getText()).trim())
    }

    return headers
  }

  async getListTableRows() {
    const listTable = await this.listTable
    await listTable.waitForDisplayed({
      timeout: 10000,
      timeoutMsg: 'ORS list table not displayed'
    })

    await browser.waitUntil(
      async () => (await $$('table.govuk-table tbody tr')).length > 0,
      {
        timeout: 10000,
        interval: 250,
        timeoutMsg: 'ORS list table rows not displayed'
      }
    )

    const rows = await $$('table.govuk-table tbody tr')
    const tableRows = []

    for (const row of rows) {
      const cells = await row.$$('td')
      const rowValues = []

      for (const cell of cells) {
        rowValues.push((await cell.getText()).trim())
      }

      tableRows.push(rowValues)
    }

    return tableRows
  }

  async expectDownloadCsvVisible() {
    const form = await this.downloadCsvForm
    const button = await form.$('button[type="submit"]')

    await expect(form).toBeDisplayed()
    await expect(button).toBeDisplayed()
    await expect(button).toHaveText('Download CSV')
  }

  async fetchListCsv() {
    return browser.execute(async () => {
      const form = document.querySelector('form[method="POST"]')

      if (!form) {
        throw new Error('ORS download form not found')
      }

      const formData = new URLSearchParams()

      for (const input of form.querySelectorAll('input[name]')) {
        formData.set(input.name, input.value)
      }

      const response = await fetch('/overseas-sites', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'content-type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: formData.toString()
      })

      return {
        status: response.status,
        contentDisposition: response.headers.get('content-disposition'),
        contentType: response.headers.get('content-type'),
        body: await response.text()
      }
    })
  }

  async expectPaginationVisible() {
    const paginationNav = await this.paginationNav
    await expect(paginationNav).toBeDisplayed()
  }

  async getPaginationStatusText() {
    const summary = await $('//p[contains(normalize-space(.), "Showing page")]')
    await summary.waitForDisplayed({
      timeout: 10000,
      timeoutMsg: 'Pagination status summary not displayed'
    })

    return summary.getText()
  }

  async clickNextPage() {
    await clickWhenReady(
      'nav.govuk-pagination .govuk-pagination__next a',
      'Next pagination link not clickable'
    )
  }

  async clickPageNumber(pageNumber) {
    await clickWhenReady(
      `nav.govuk-pagination a[href*="page=${pageNumber}&"]`,
      `Pagination link for page ${pageNumber} not clickable`
    )
  }

  async filterByRegistrationNumber(registrationNumber) {
    await setValueWhenReady(
      this.registrationNumberInput,
      registrationNumber,
      'Registration number filter input not displayed'
    )
    await clickWhenReady(
      'form.app-filters button[type="submit"]',
      'Registration number search button not clickable'
    )
  }

  async getRegistrationNumberFilterValue() {
    const input = await this.registrationNumberInput
    await input.waitForDisplayed({
      timeout: 10000,
      timeoutMsg: 'Registration number filter input not displayed'
    })

    return input.getValue()
  }

  async clearRegistrationNumberFilter() {
    await clickWhenReady(
      'form.app-filters a.govuk-button--inverse',
      'Clear registration number filter link not clickable'
    )
  }

  async getInsetText() {
    const insetText = await $('.govuk-inset-text')
    await insetText.waitForDisplayed({
      timeout: 10000,
      timeoutMsg: 'Inset text not displayed'
    })

    return insetText.getText()
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
