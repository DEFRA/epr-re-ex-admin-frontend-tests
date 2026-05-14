import {
  createLinkedOrganisation,
  createSubmittedReport
} from '~/test/support/apicalls.js'
import OrganisationsPage from 'page-objects/organisations.js'
import { expect } from '@wdio/globals'
import HomePage from 'page-objects/home.page.js'
import Navigation from 'page-objects/navigation.js'
import LoginPage from 'page-objects/login.js'
import JsonEditor from 'page-objects/jsoneditor.js'
import OrsUploadPage from 'page-objects/ors.upload.page.js'
import OrganisationOverviewPage from 'page-objects/organisation.overview.page.js'
import RegistrationOverviewPage from 'page-objects/registration.overview.page.js'
import UnsubmitConfirmationPage from 'page-objects/unsubmit.confirmation.page.js'
import PublicRegisterPage from 'page-objects/public.register.page.js'

describe('Permissions flow for a user without write permissions', () => {
  it('Should not be able to update an organisation @permissions @organisationpermissions', async () => {
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

  it('Should not be able to upload ORS file @permissions @orspermissions', async () => {
    await LoginPage.open()
    await LoginPage.enterCredentials('niea@test.gov.uk', 'pass')
    await LoginPage.submitCredentials()

    await Navigation.clickOnLink('Overseas sites')
    await OrsUploadPage.open()

    const permissionsHeader = await OrsUploadPage.permissionsErrorHeading()
    expect(permissionsHeader).toContain('You do not have permission')

    const permissionsText = await OrsUploadPage.permissionsErrorText()
    expect(permissionsText).toContain(
      'Your account does not have permission to use this page. If you think this is wrong, contact your administrator.'
    )

    await HomePage.signOut()
  })

  it('Should be not be able to unsubmit a report @permissions @unsubmitpermissions', async () => {
    await LoginPage.open()
    await LoginPage.enterCredentials('niea@test.gov.uk', 'pass')
    await LoginPage.submitCredentials()

    const linkedOrganisation = await createLinkedOrganisation([
      { material: 'Paper or board (R3)', wasteProcessingType: 'Reprocessor' }
    ])

    const { organisation } = linkedOrganisation

    await createSubmittedReport(linkedOrganisation.refNo)

    await OrganisationsPage.open()
    await OrganisationsPage.searchFor(organisation.companyName)
    await OrganisationsPage.viewLink(1)

    await OrganisationOverviewPage.viewRegistrationLink(1)

    await RegistrationOverviewPage.unsubmitReportLink(1)
    const permissionsHeader =
      await UnsubmitConfirmationPage.permissionsErrorHeading()
    expect(permissionsHeader).toContain('You do not have permission')

    const permissionsText =
      await UnsubmitConfirmationPage.permissionsErrorText()
    expect(permissionsText).toContain(
      'Your account does not have permission to use this page. If you think this is wrong, contact your administrator.'
    )

    await HomePage.signOut()
  })

  it('Should not be able to download the public register @permissions @publicregisterpermissions', async () => {
    await LoginPage.open()
    await LoginPage.enterCredentials('niea@test.gov.uk', 'pass')
    await LoginPage.submitCredentials()

    await PublicRegisterPage.open()
    const publicRegisterButtonExistence =
      await PublicRegisterPage.downloadPublicRegisterButtonExistence()
    expect(publicRegisterButtonExistence).toBeFalsy()

    await HomePage.signOut()
  })
})
