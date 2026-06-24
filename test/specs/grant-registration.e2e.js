import { browser, expect } from '@wdio/globals'

import LoginPage from 'page-objects/login.js'
import OrganisationsPage from 'page-objects/organisations.js'
import OrganisationOverviewPage from 'page-objects/organisation.overview.page.js'
import RegistrationOverviewPage from 'page-objects/registration.overview.page.js'
import GrantRegistrationConfirmationPage from 'page-objects/grant-registration.confirmation.page.js'
import { createLinkedOrganisation } from '../support/apicalls.js'

describe('Grant registration', () => {
  before(async () => {
    await browser.deleteCookies()
    await LoginPage.open()
    await LoginPage.enterCredentials('ea@test.gov.uk', 'pass')
    await LoginPage.submitCredentials()
  })

  it('approves a created registration @grantregistration', async () => {
    // createLinkedOrganisation seeds registrations in `created` status after migration
    const linkedOrganisation = await createLinkedOrganisation([
      { material: 'Paper or board (R3)', wasteProcessingType: 'Reprocessor' }
    ])

    const { organisation } = linkedOrganisation

    await OrganisationsPage.open()

    await OrganisationsPage.searchFor(organisation.companyName)
    const searchResult = await OrganisationsPage.searchResult()
    expect(searchResult).toEqual('1 result found')

    await OrganisationsPage.viewLink(1)

    await OrganisationOverviewPage.viewRegistrationLink(1)

    // Pre-state: registration status is created and the Approve action is present
    expect(await RegistrationOverviewPage.statusTag.getText()).toContain(
      'created'
    )
    await expect(RegistrationOverviewPage.approveLink).toBeDisplayed()

    // Act: navigate to the confirm page, enter a reason and submit
    await RegistrationOverviewPage.clickApprove()
    await GrantRegistrationConfirmationPage.enterReason(
      'Documentation verified'
    )
    await GrantRegistrationConfirmationPage.submit()

    // Outcome: success banner visible, status updated to approved, Approve link gone
    await expect(
      GrantRegistrationConfirmationPage.successBanner
    ).toBeDisplayed()
    expect(await RegistrationOverviewPage.statusTag.getText()).toContain(
      'approved'
    )
    await expect(RegistrationOverviewPage.approveLink).not.toBeDisplayed()
  })
})
