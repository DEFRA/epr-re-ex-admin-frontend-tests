import { $$ } from '@wdio/globals'

class Navigation {
  async clickOnLink(linkText) {
    const links = await $$('#navigation li a').getElements()
    const targetLink = await links.find(async (el) => {
      const text = await el.getText()
      return text === linkText
    })
    await targetLink.click()
  }
}

export default new Navigation()
