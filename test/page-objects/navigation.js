import { $ } from '@wdio/globals'

class Navigation {
  async clickOnLink(linkText) {
    const link = await $('#navigation').$(`=${linkText}`)
    await link.waitForClickable({ timeout: 5000 })
    await link.click()
  }
}

export default new Navigation()
