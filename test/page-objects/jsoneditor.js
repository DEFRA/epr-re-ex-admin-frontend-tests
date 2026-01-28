import { $ } from '@wdio/globals'

class JsonEditor {
  async switchToTextEditor() {
    await $(
      '#jsoneditor > div > div.jsoneditor-menu > div.jsoneditor-modes > button'
    ).click()
    await $(
      '#jsoneditor > div > div.jsoneditor-menu > div.jsoneditor-anchor > div > div > ul > li:nth-child(2) > button > div.jsoneditor-text'
    ).click()
  }

  async switchToTreeEditor() {
    await $(
      '#jsoneditor > div > div.jsoneditor-menu > div.jsoneditor-modes > button'
    ).click()
    await $(
      '#jsoneditor > div > div.jsoneditor-menu > div.jsoneditor-anchor > div > div > ul > li:nth-child(3) > button > div.jsoneditor-text'
    ).click()
  }

  async getEditorTextValue() {
    return $('#jsoneditor-organisation-object').getAttribute('value')
  }

  async updateOrgId(orgId) {
    await $(
      '#jsoneditor > div > div.jsoneditor-outer.has-main-menu-bar.has-nav-bar > div > div > table > tbody > tr:nth-child(6) > td:nth-child(3) > table > tbody > tr > td:nth-child(4) > div'
    ).setValue(orgId)
  }

  async saveChanges() {
    await $('#jsoneditor-save-button').click()
  }
}

export default new JsonEditor()
