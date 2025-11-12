import { browser, expect } from '@wdio/globals'

import LoginPage from 'page-objects/login.js'
import Navigation from 'page-objects/navigation.js'
import OrganisationsPage from 'page-objects/organisations.js'
import JsonEditor from 'page-objects/jsoneditor.js'

//TODO: Enable this test once the backend is ready
describe('Organisations page', () => {
  it.skip('Should be able to view organisations page', async () => {
    await LoginPage.open()
    await expect(browser).toHaveTitle(expect.stringContaining('Login'))
    await LoginPage.enterCredentials('ea@test.gov.uk', 'pass')
    await LoginPage.submitCredentials()

    const headerText = await browser.$('main h1').getText()
    expect(headerText).toEqual('Welcome EA Regulator!')

    await Navigation.clickOnLink('Organisations')

    await OrganisationsPage.editLink(1)

    await JsonEditor.switchToTextEditor()
    const actualOrgValue = await JsonEditor.getEditorTextValue()
    expect(actualOrgValue).toContain('anakin.skywalker@starwars.com')
    await JsonEditor.switchToTreeEditor()
    await JsonEditor.updateOrgId('50006')
    await JsonEditor.saveChanges()

    const successMessage = await OrganisationsPage.getSuccessMessage()
    expect(successMessage).toEqual('Organisation record updated')

    await Navigation.clickOnLink('Organisations')

    const actualOrgTable = await OrganisationsPage.getTableData()
    const expectedOrgTable = [
      {
        header: 'ACME ltd',
        orgId: '50006',
        regNo: 'AC012345',
        status: 'created'
      },
      {
        header: 'Plastic Exporters',
        orgId: '50004',
        regNo: 'PE789012',
        status: 'created'
      },
      {
        header: 'Green Future Trust',
        orgId: '50005',
        regNo: 'GF345678',
        status: 'created'
      },
      {
        header: 'Eco Recycle Ltd',
        orgId: '50003',
        regNo: 'ER123456',
        status: 'created'
      }
    ]
    expect(actualOrgTable).toEqual(expectedOrgTable)
  })
})
