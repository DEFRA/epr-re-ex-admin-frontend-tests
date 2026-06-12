import { Page } from 'page-objects/page'
import { $ } from '@wdio/globals'

class HomePage extends Page {
  async open() {
    await super.open('/')
  }

  async signOut() {
    await $('a*=Sign out').click()
  }
}

export default new HomePage()
