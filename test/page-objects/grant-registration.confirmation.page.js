import { Page } from 'page-objects/page'
import { $ } from '@wdio/globals'

class GrantRegistrationConfirmationPage extends Page {
  get reasonField() {
    return $('#reason')
  }

  get approveButton() {
    return $('button[type=submit]')
  }

  async enterReason(text) {
    await this.reasonField.setValue(text)
  }

  async submit() {
    await this.approveButton.click()
  }

  get successBanner() {
    return $('.govuk-notification-banner--success')
  }
}

export default new GrantRegistrationConfirmationPage()
