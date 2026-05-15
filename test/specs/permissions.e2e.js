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
import { purgeDlq, sendMessageToDlq } from '~/test/support/sqs-helpers.js'
import QueueManagementPage from 'page-objects/queue.management.page.js'

const users = [
  {
    username: 'niea@test.gov.uk',
    scopes: ['admin_read', 'admin_purge_queues']
  },
  { username: 'nrw@test.gov.uk', scopes: ['admin_read'] }
]

users.forEach(({ username, scopes }) => {
  describe(`Permissions flow for a user with the following scopes ${scopes}`, () => {
    beforeEach(async () => {
      await LoginPage.open()
      await LoginPage.enterCredentials(username, 'pass')
      await LoginPage.submitCredentials()
    })

    afterEach(async () => {
      await HomePage.signOut()
    })

    it('Should not be able to update an organisation @permissions @organisationpermissions', async () => {
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
    })

    it('Should not be able to upload ORS file @permissions @orspermissions', async () => {
      await Navigation.clickOnLink('Overseas sites')
      await OrsUploadPage.open()

      const permissionsHeader = await OrsUploadPage.permissionsErrorHeading()
      expect(permissionsHeader).toContain('You do not have permission')

      const permissionsText = await OrsUploadPage.permissionsErrorText()
      expect(permissionsText).toContain(
        'Your account does not have permission to use this page. If you think this is wrong, contact your administrator.'
      )
    })

    it('Should be not be able to unsubmit a report @permissions @unsubmitpermissions', async () => {
      const linkedOrganisation = await createLinkedOrganisation([
        { material: 'Paper or board (R3)', wasteProcessingType: 'Reprocessor' }
      ])

      const { organisation } = linkedOrganisation

      await createSubmittedReport(linkedOrganisation.refNo)

      await OrganisationsPage.open()
      await OrganisationsPage.searchFor(organisation.companyName)
      await OrganisationsPage.viewLink(1)

      await OrganisationOverviewPage.viewRegistrationLink(1)

      const unsubmitLinkExists =
        await RegistrationOverviewPage.unsubmitReportLinkExists(1)
      expect(unsubmitLinkExists).toBeFalsy()
    })
  })
})

describe('Permissions flow for a support user only', () => {
  beforeEach(async () => {
    // login as support only service maintainer
    await LoginPage.open()
    await LoginPage.enterCredentials('nrw@test.gov.uk', 'pass')
    await LoginPage.submitCredentials()
  })

  afterEach(async () => {
    await HomePage.signOut()
  })

  const testMessage = {
    type: 'PROCESS_SUMMARY_LOG',
    payload: {
      summaryLogId: 'journey-test-dlq-001',
      description: 'Journey test DLQ message'
    }
  }

  it('Should be not be able to purge the DLQ from the UI @permissions @dlqpermissions', async () => {
    await purgeDlq()
    await sendMessageToDlq(testMessage)

    await Navigation.clickOnLink('Queue management')

    const clearAllMessagesButtonExists =
      await QueueManagementPage.clearAllMessagesButtonExists()
    expect(clearAllMessagesButtonExists).toBeFalsy()
  })
})
