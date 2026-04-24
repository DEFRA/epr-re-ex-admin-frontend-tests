import { $ } from '@wdio/globals'

class Navigation {
  async clickOnLink(linkText) {
    await $(`//a[normalize-space()="${linkText}"]`).click()
  }
}

export default new Navigation()
