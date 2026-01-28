import { browser, expect } from '@wdio/globals'

import LoginPage from 'page-objects/login.js'
import Navigation from 'page-objects/navigation.js'
import OrganisationsPage from 'page-objects/organisations.js'
import JsonEditor from 'page-objects/jsoneditor.js'
import { createLinkedOrganisation } from '../support/apicalls.js'
import SystemLogsPage from 'page-objects/system.logs.page.js'

describe('Organisations page', () => {
  it('Should be able to update an organisation and view system logs @organisations', async () => {
    const linkedOrganisation = await createLinkedOrganisation([
      { material: 'Paper or board (R3)', wasteProcessingType: 'Reprocessor' },
      { material: 'Paper or board (R3)', wasteProcessingType: 'Exporter' }
    ])

    const organisation = linkedOrganisation.organisation

    await LoginPage.open()
    await expect(browser).toHaveTitle(expect.stringContaining('Login'))
    await LoginPage.enterCredentials('ea@test.gov.uk', 'pass')
    await LoginPage.submitCredentials()

    const headerText = await browser.$('main h1').getText()
    expect(headerText).toEqual('Welcome EA Regulator!')

    await Navigation.clickOnLink('Organisations')

    await OrganisationsPage.searchFor(organisation.companyName)
    const searchResult = await OrganisationsPage.searchResult()
    expect(searchResult).toEqual('1 result found')

    const searchOrgTable = await OrganisationsPage.getTableData()
    const expectedSearchOrgTable = [
      {
        header: organisation.companyName,
        orgId: `${linkedOrganisation.orgId}`,
        regNo: '',
        regulator: 'EA',
        status: 'created'
      }
    ]
    expect(searchOrgTable).toEqual(expectedSearchOrgTable)

    const updatedOrgId = linkedOrganisation.orgId + 100000

    await OrganisationsPage.editLink(1)

    await JsonEditor.switchToTextEditor()
    const actualOrgValue = await JsonEditor.getEditorTextValue()
    expect(actualOrgValue).toContain(organisation.email)
    await JsonEditor.switchToTreeEditor()
    await JsonEditor.updateOrgId(updatedOrgId)
    await JsonEditor.saveChanges()

    const successMessage = await OrganisationsPage.getSuccessMessage()
    expect(successMessage).toEqual('Organisation record updated')

    await Navigation.clickOnLink('Organisations')

    await OrganisationsPage.searchFor(organisation.companyName)
    const updatedSearchResult = await OrganisationsPage.searchResult()
    expect(updatedSearchResult).toEqual('1 result found')

    const updatedSearchOrgTable = await OrganisationsPage.getTableData()
    const expectedUpdatedSearchOrgTable = [
      {
        header: organisation.companyName,
        orgId: `${updatedOrgId}`,
        regNo: '',
        regulator: 'EA',
        status: 'created'
      }
    ]
    expect(updatedSearchOrgTable).toEqual(expectedUpdatedSearchOrgTable)

    await Navigation.clickOnLink('System logs')
    await SystemLogsPage.searchFor(linkedOrganisation.refNo)
    const searchResults = await SystemLogsPage.searchResults()
    expect(searchResults).toExist()

    const actualJsonDifference = await SystemLogsPage.jsonDifference()
    const expectedJsonDifference = {
      version: {
        _changed: '1 -> 2'
      },
      orgId: {
        _changed: `${linkedOrganisation.orgId} -> ${updatedOrgId}`
      },
      users: {
        0: {
          _added: {
            fullName: `${organisation.fullName}`,
            email: `${organisation.email}`,
            roles: ['initial_user', 'standard_user']
          }
        }
      }
    }
    expect(JSON.parse(actualJsonDifference)).toEqual(expectedJsonDifference)
  })
})
