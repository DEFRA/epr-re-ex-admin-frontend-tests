/// <reference types="@wdio/globals/types" />
import { Page } from 'page-objects/page'
import { $ } from '@wdio/globals'

class HomePage extends Page {
  open() {
    return super.open('/')
  }

  async signOut() {
    await $('a*=Sign out').click()
  }
}

export default new HomePage()
