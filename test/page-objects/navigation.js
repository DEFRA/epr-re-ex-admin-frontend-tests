import { $$, browser } from '@wdio/globals'

class Navigation {
  async clickOnLink(linkText) {
    const selector = '#navigation li a'

    await browser.waitUntil(
      async () => {
        const elements = await $$(selector)
        return (await elements.length) > 0
      },
      { timeout: 10000, timeoutMsg: 'Expected to find navigation items' }
    )

    // Don't re-query — find and click in one waitUntil to avoid staleness
    await browser.waitUntil(
      async () => {
        const links = await $$(selector)
        for (const el of links) {
          const text = await el.getText()
          console.log(
            'Found link:',
            text,
            '| href:',
            await el.getAttribute('href')
          )
          if (text === linkText) {
            console.log('Clicking:', text)
            await el.click()
            console.log('Clicked, current URL now:', await browser.getUrl())
            break
          }
        }
        return false
      },
      {
        timeout: 10000,
        timeoutMsg: `Link "${linkText}" not found or not clickable`
      }
    )
  }
}

export default new Navigation()
