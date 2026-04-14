import { Page } from 'page-objects/page'
import { clickWhenReady } from 'page-objects/actions'
import { $ } from '@wdio/globals'

class PublicRegisterPage extends Page {
  open() {
    return super.open('/public-register')
  }

  async downloadPublicRegister() {
    return clickWhenReady(
      await $('main form button[type="submit"]'),
      'Public register download button not clickable'
    )
  }
}

export default new PublicRegisterPage()
