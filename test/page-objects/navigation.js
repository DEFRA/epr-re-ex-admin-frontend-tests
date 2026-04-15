import { $ } from '@wdio/globals'

import { clickAndWaitForNavigation } from 'page-objects/actions'

class Navigation {
  async clickOnLink(linkText) {
    await clickAndWaitForNavigation(
      $('#navigation').$(`=${linkText}`),
      `Navigation link "${linkText}" not clickable`
    )
  }
}

export default new Navigation()
