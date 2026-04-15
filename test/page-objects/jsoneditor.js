import { $ } from '@wdio/globals'

import { clickWhenReady } from 'page-objects/actions'

const modeButton = '#jsoneditor .jsoneditor-modes > button'
const modeOption = (nth) =>
  `#jsoneditor .jsoneditor-anchor ul li:nth-child(${nth}) button .jsoneditor-text`

class JsonEditor {
  async switchToTextEditor() {
    await clickWhenReady(modeButton, 'JSON editor mode button not clickable')
    await clickWhenReady(
      modeOption(2),
      'JSON editor text mode option not clickable'
    )
  }

  async switchToTreeEditor() {
    await clickWhenReady(modeButton, 'JSON editor mode button not clickable')
    await clickWhenReady(
      modeOption(3),
      'JSON editor tree mode option not clickable'
    )
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
    await clickWhenReady(
      '#jsoneditor-save-button',
      'JSON editor save button not clickable'
    )
  }
}

export default new JsonEditor()
