import { browser, $ } from '@wdio/globals'

class Page {
  get pageHeading() {
    return $('h1')
  }

  async open(path) {
    await browser.url(path)
  }
}

export { Page }
