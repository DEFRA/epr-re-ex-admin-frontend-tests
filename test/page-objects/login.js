import { Page } from 'page-objects/page'
import { $ } from '@wdio/globals'

class LoginPage extends Page {
  open() {
    return super.open('/auth/sign-in')
  }

  async enterCredentials(username, password) {
    await $('#username').setValue(username)
    await $('#password').setValue(password)
  }

  async submitCredentials() {
    await $('button[type=submit]').click()
  }
}

export default new LoginPage()
