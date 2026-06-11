import { Page } from 'page-objects/page'
import { $ } from '@wdio/globals'

class UnlinkOrganisationConfirmationPage extends Page {
  async getHeaderText() {
    const heading = $('#main-content h1.govuk-heading-xl')
    await heading.waitForExist()
    return heading.getText()
  }

  async getBodyText() {
    return $('#main-content p.govuk-body').getText()
  }

  async getWarningText() {
    return $('#main-content .govuk-warning-text__text').getText()
  }

  async confirmUnlink() {
    await $('#main-content form button').click()
  }

  async cancel() {
    await $('a*=Cancel').click()
  }
}

export default new UnlinkOrganisationConfirmationPage()
