import { $, expect } from '@wdio/globals'

import JsonEditor from 'page-objects/jsoneditor.js'
import LoginPage from 'page-objects/login.js'
import Navigation from 'page-objects/navigation.js'
import OrganisationsPage from 'page-objects/organisations.js'
import SystemLogsPage from 'page-objects/system.logs.page.js'
import { createLinkedOrganisation } from '../support/apicalls.js'

describe('System logs search @searchsystemlogs', () => {
  let linkedOrganisation

  before(async () => {
    linkedOrganisation = await createLinkedOrganisation([
      { material: 'Paper or board (R3)', wasteProcessingType: 'Reprocessor' }
    ])

    await LoginPage.open()
    await LoginPage.enterCredentials('ea@test.gov.uk', 'pass')
    await LoginPage.submitCredentials()

    const headerText = await $('main h1').getText()
    expect(headerText).toEqual('Welcome EA Regulator!')

    await Navigation.clickOnLink('Organisations')
    await OrganisationsPage.searchFor(
      linkedOrganisation.organisation.companyName
    )
    expect(await OrganisationsPage.searchResult()).toEqual('1 result found')
    await OrganisationsPage.editLink(1)
    await JsonEditor.switchToTreeEditor()
    await JsonEditor.updateOrgId(Number(linkedOrganisation.orgId) + 100000)
    await JsonEditor.saveChanges()

    const successMessage = await OrganisationsPage.getSuccessMessage()
    expect(successMessage).toEqual('Organisation record updated')
  })

  it('finds system logs by organisation reference number', async () => {
    await Navigation.clickOnLink('System logs')

    await SystemLogsPage.searchFor(linkedOrganisation.refNo)
    await expect(
      $$('#main-content div.govuk-summary-card')
    ).toBeElementsArrayOfSize({ gte: 1 })
  })

  it('finds system logs by email address', async () => {
    await Navigation.clickOnLink('System logs')

    await SystemLogsPage.searchByEmail('ea@test.gov.uk')
    await expect(
      $$('#main-content div.govuk-summary-card')
    ).toBeElementsArrayOfSize({ gte: 1 })
  })

  it('shows no results when email matches no logs', async () => {
    await Navigation.clickOnLink('System logs')

    await SystemLogsPage.searchByEmail('nobody-real@example.com')
    await expect(
      $$('#main-content div.govuk-summary-card')
    ).toBeElementsArrayOfSize(0)
  })

  it('filters by event type alongside email', async () => {
    await Navigation.clickOnLink('System logs')

    await SystemLogsPage.searchByEmailAndEventType(
      'ea@test.gov.uk',
      'epr-organisations'
    )
    await expect(
      $$('#main-content div.govuk-summary-card')
    ).toBeElementsArrayOfSize({ gte: 1 })
  })

  it('clears search and resets the form', async () => {
    await Navigation.clickOnLink('System logs')

    await SystemLogsPage.searchByAllFilters(
      linkedOrganisation.refNo,
      'ea@test.gov.uk',
      'epr-organisations'
    )
    await expect(
      $$('#main-content div.govuk-summary-card')
    ).toBeElementsArrayOfSize({ gte: 1 })

    await SystemLogsPage.clearSearch()

    expect(await SystemLogsPage.referenceNumberValue()).toBe('')
    expect(await SystemLogsPage.emailValue()).toBe('')
    expect(await SystemLogsPage.eventTypeValue()).toBe('')
    await expect(
      $$('#main-content div.govuk-summary-card')
    ).toBeElementsArrayOfSize(0)
  })

  it('shows error when submitting with no filters', async () => {
    await Navigation.clickOnLink('System logs')
    await SystemLogsPage.submitSearch()

    await expect($('.govuk-error-summary')).toHaveText(
      expect.stringContaining(
        'Enter an organisation reference number or email address'
      )
    )
  })
})
