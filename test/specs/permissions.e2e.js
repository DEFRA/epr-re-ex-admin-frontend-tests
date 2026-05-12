import { createLinkedOrganisation } from '~/test/support/apicalls.js'
import OrganisationsPage from 'page-objects/organisations.js'
import { expect } from '@wdio/globals'
import HomePage from 'page-objects/home.page.js'
import Navigation from 'page-objects/navigation.js'
import LoginPage from 'page-objects/login.js'
import JsonEditor from 'page-objects/jsoneditor.js'

describe('Permissions flow', () => {
  it('Should not be able to update an organisation when a user without write permissions is logged in @permissions', async () => {
    await LoginPage.open()
    await LoginPage.enterCredentials('niea@test.gov.uk', 'pass')
    await LoginPage.submitCredentials()

    const linkedOrganisation = await createLinkedOrganisation([
      { material: 'Paper or board (R3)', wasteProcessingType: 'Reprocessor' }
    ])

    const organisation = linkedOrganisation.organisation

    await Navigation.clickOnLink('Organisations')

    await OrganisationsPage.searchFor(organisation.companyName)
    const searchResult = await OrganisationsPage.searchResult()
    expect(searchResult).toEqual('1 result found')

    await OrganisationsPage.editLink(1)

    const permissionsText = await OrganisationsPage.getPermissionText()
    expect(permissionsText).toContain(
      'You do not have permission to edit this organisation.'
    )

    const saveButtonExists = await JsonEditor.saveButtonExists()
    expect(saveButtonExists).toBeFalsy()

    await HomePage.signOut()
  })
})
