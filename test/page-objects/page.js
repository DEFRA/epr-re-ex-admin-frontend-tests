import { browser, $ } from '@wdio/globals'

class Page {
  get pageHeading() {
    return $('h1')
  }

  async open(path) {
    await browser.url(path)
    await browser.waitUntil(
      async () =>
        (await browser.execute(() => document.readyState)) === 'complete',
      { timeout: 10000, timeoutMsg: 'Page did not reach readyState complete' }
    )
  }
}

export { Page }
