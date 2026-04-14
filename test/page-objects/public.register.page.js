import { Page } from 'page-objects/page'
import { $ } from '@wdio/globals'

class PublicRegisterPage extends Page {
  open() {
    return super.open('/public-register')
  }

  async downloadPublicRegister() {
    const downloadButton = await $('main form button[type="submit"]')
    await downloadButton.waitForClickable({
      timeout: 10000,
      timeoutMsg: 'Public register download button not clickable'
    })
    return downloadButton.click()
  }
}

export default new PublicRegisterPage()
