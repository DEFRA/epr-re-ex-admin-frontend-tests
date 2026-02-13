import { browser } from '@wdio/globals'

export async function checkBodyText(message, timeoutInSeconds) {
  await browser.waitUntil(
    async () =>
      browser.execute((msg) => document.body.innerText.includes(msg), message),
    {
      timeout: timeoutInSeconds * 1000,
      timeoutMsg: `Expected text "${message}" to be present on the page within ${timeoutInSeconds} seconds`
    }
  )
}
