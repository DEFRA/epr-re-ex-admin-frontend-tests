import { Page } from 'page-objects/page'

class HomePage extends Page {
  open() {
    return super.open('/')
  }

  async signOut() {
    await $('a*=Sign out').click()
  }
}

export default new HomePage()
