import { Page } from 'page-objects/page'
import { $ } from '@wdio/globals'

class PublicRegisterPage extends Page {
  async open() {
    await super.open('/public-register')
  }

  async downloadPublicRegister() {
    return await $('#main-content > div > div > div > form > button').click()
  }

  async downloadPublicRegisterButtonExistence() {
    return await $(
      '#main-content > div > div > div > form > button'
    ).isExisting()
  }
}

export default new PublicRegisterPage()
