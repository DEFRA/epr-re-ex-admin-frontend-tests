import { Page } from 'page-objects/page'
import { clickWhenReady } from 'page-objects/actions'

class PublicRegisterPage extends Page {
  open() {
    return super.open('/public-register')
  }

  async downloadPublicRegister() {
    return clickWhenReady(
      'main form button[type="submit"]',
      'Public register download button not clickable'
    )
  }
}

export default new PublicRegisterPage()
