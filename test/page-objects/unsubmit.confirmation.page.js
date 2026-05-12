import { Page } from 'page-objects/page'
import { $ } from '@wdio/globals'

class UnsubmitConfirmationPage extends Page {
  async getWarningText() {
    return await $('#main-content > div > div > div > strong').getText()
  }

  async confirmUnsubmit() {
    await $('#main-content > div > div > form > button').click()
  }

  async getSuccessMessage() {
    return await $('#main-content > div > div > div > div > h1').getText()
  }

  async returnToRegistrationOverview() {
    await $('#main-content > div > div > div > p:nth-child(5) > a').click()
  }

  async permissionsErrorHeading() {
    return await $('#main-content > div > div > h1').getText()
  }

  async permissionsErrorText() {
    return await $('#main-content > div > div > p:nth-child(2)').getText()
  }
}

export default new UnsubmitConfirmationPage()
