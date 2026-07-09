import { Page } from 'page-objects/page'
import { $ } from '@wdio/globals'

class UnsubmitConfirmationPage extends Page {
  async getWarningText() {
    return await $('.govuk-warning-text__text').getText()
  }

  async getDetailsText() {
    return await $('#main-content').getText()
  }

  async confirmUnsubmit() {
    await $('button=Yes, unsubmit this report').click()
  }

  async getSuccessMessage() {
    return await $('.govuk-panel__title').getText()
  }

  async returnToRegistrationOverview() {
    await $('a=Back to registration overview').click()
  }
}

export default new UnsubmitConfirmationPage()
