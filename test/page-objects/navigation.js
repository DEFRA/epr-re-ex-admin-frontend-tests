import { $ } from '@wdio/globals'

import { clickWhenReady } from 'page-objects/actions'

class Navigation {
  async clickOnLink(linkText) {
    await clickWhenReady(
      $('#navigation').$(`=${linkText}`),
      `Navigation link "${linkText}" not clickable`
    )
  }
}

export default new Navigation()
