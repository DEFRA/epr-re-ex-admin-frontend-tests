import { clickWhenReady } from 'page-objects/actions'

class Navigation {
  async clickOnLink(linkText) {
    await clickWhenReady(
      `#navigation a=${linkText}`,
      `Navigation link "${linkText}" not clickable`
    )
  }
}

export default new Navigation()
