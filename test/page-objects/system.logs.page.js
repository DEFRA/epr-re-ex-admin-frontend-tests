import { Page } from 'page-objects/page'
import { $ } from '@wdio/globals'

class SystemLogsPage extends Page {
  open() {
    return super.open('/system-logs')
  }

  async searchFor(orgName) {
    await $('#referenceNumber').setValue(orgName)
    await $('button[type=submit]').click()
  }

  async searchResults() {
    return await $('#main-content > div.govuk-summary-card')
  }

  async jsonDifference() {
    const difference = await $(
      '#main-content > div > div > div > div > div.govuk-summary-card__content > dl > div:nth-child(7) > dd > code'
    )
    return difference.getText()
  }

  async noSystemLogsFound() {
    return await $('#main-content div.govuk-inset-text').getText()
  }
}

export default new SystemLogsPage()
