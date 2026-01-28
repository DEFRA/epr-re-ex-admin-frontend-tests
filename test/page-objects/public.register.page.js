import { Page } from 'page-objects/page'
import { $ } from '@wdio/globals'

class PublicRegisterPage extends Page {
  open() {
    return super.open('/public-register')
  }

  async downloadPublicRegister() {
    return await $('#main-content > div > div > div > form > button').click()
  }
}

export default new PublicRegisterPage()
