import { $, browser } from '@wdio/globals'

class Navigation {
  async clickOnLink(linkText) {
    const link = await $('#navigation').$(`=${linkText}`)
    await link.waitForClickable({ timeout: 5000 })
    const before = await browser.getUrl()
    const focus = await browser.execute(() => document.hasFocus())
    await link.click()
    await browser.pause(800)
    console.log(
      `NAVDBG want=${linkText} hasFocus=${focus} before=${before.replace('http://localhost:3002', '')} after=${(await browser.getUrl()).replace('http://localhost:3002', '')}`
    )
  }
}

export default new Navigation()
