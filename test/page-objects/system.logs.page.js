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

  async searchByEmail(email) {
    await $('#email').setValue(email)
    await $('button[type=submit]').click()
  }

  async searchByEmailAndEventType(email, subCategory) {
    await $('#email').setValue(email)
    await $('#subCategory').selectByAttribute('value', subCategory)
    await $('button[type=submit]').click()
  }

  async searchByAllFilters(referenceNumber, email, subCategory) {
    await $('#referenceNumber').setValue(referenceNumber)
    await $('#email').setValue(email)
    await $('#subCategory').selectByAttribute('value', subCategory)
    await $('button[type=submit]').click()
  }

  async searchResults() {
    return $('#main-content > div.govuk-summary-card')
  }

  async submitSearch() {
    await $('button[type=submit]').click()
  }

  async clearSearch() {
    await $('a.govuk-button--inverse').click()
  }

  async referenceNumberValue() {
    return await $('#referenceNumber').getValue()
  }

  async emailValue() {
    return await $('#email').getValue()
  }

  async eventTypeValue() {
    return await $('#subCategory').getValue()
  }

  async jsonDifference() {
    const difference = await $(
      '#main-content > div > div > div > div > div.govuk-summary-card__content > dl > div:nth-child(8) > dd > code'
    )
    return difference.getText()
  }

  async noSystemLogsFound() {
    return await $('#main-content div.govuk-inset-text').getText()
  }
}

export default new SystemLogsPage()
