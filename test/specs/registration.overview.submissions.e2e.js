import { browser, expect } from '@wdio/globals'

import LoginPage from 'page-objects/login.js'
import OrganisationsPage from 'page-objects/organisations.js'
import OrganisationOverviewPage from 'page-objects/organisation.overview.page.js'
import RegistrationOverviewPage from 'page-objects/registration.overview.page.js'
import ReportViewPage from 'page-objects/report.view.page.js'
import UnsubmitConfirmationPage from 'page-objects/unsubmit.confirmation.page.js'
import {
  createLinkedOrganisation,
  updateMigratedOrganisation,
  linkDefraUser,
  seedReportSubmission,
  uploadAndSubmitSummaryLog,
  waitForReportingPeriodStatus
} from '../support/apicalls.js'

// Must match the REGISTRATION_NUMBER meta cell inside the fixture spreadsheet.
const REGISTRATION_NUMBER = 'R25SR500040912PA'
// The fixture restates Q1 2026, so the seeded submitted report must be for
// that period (registered-only registrations report quarterly).
const CMA_FIXTURE = 'test/fixtures/reprocessor-output-regonly-cma.xlsx'
const PERIOD = { year: 2026, cadence: 'quarterly', period: 1 }

const isQuarterOne2026 = (row) =>
  row.period === 'Quarter 1' && row.due.startsWith('2026')

// .find() with a not-found guard, so assertions on the result type-check.
const findOrThrow = (items, predicate, description) => {
  const item = items.find(predicate)
  if (!item) {
    throw new Error(`Not found: ${description}`)
  }
  return item
}

// Function (not arrow) so this.timeout is reachable: the summary-log pipeline
// (upload, scan, async validation and submission) needs longer than the
// default per-test minute.
describe('Registration overview - multiple submissions per period', function () {
  this.timeout(3 * 60 * 1000)

  before(async () => {
    // login as service maintainer
    await browser.deleteCookies()
    await LoginPage.open()
    await LoginPage.enterCredentials('ea@test.gov.uk', 'pass')
    await LoginPage.submitCredentials()
  })

  it('lists every submission for a period as its own reachable row, with submission numbers on view and unsubmit pages @organisations @multipleSubmissions', async () => {
    // Registered-only reprocessor whose registration matches the fixture.
    const linkedOrganisation = await createLinkedOrganisation([
      {
        material: 'Paper or board (R3)',
        wasteProcessingType: 'Reprocessor',
        withoutAccreditation: true
      }
    ])
    const migrated = await updateMigratedOrganisation(
      linkedOrganisation.refNo,
      [
        {
          regNumber: REGISTRATION_NUMBER,
          status: 'approved',
          reprocessingType: 'output'
        }
      ]
    )
    const registrationId = migrated.registrations[0].id
    const { defraAuthHeader } = await linkDefraUser(linkedOrganisation.refNo)

    // Close Q1 2026 with a submitted report, then restate it via a summary
    // log so the backend flags the period as requiring resubmission.
    await seedReportSubmission(
      linkedOrganisation.refNo,
      registrationId,
      defraAuthHeader,
      { ...PERIOD, submissionNumber: 1 }
    )
    await uploadAndSubmitSummaryLog(
      linkedOrganisation.refNo,
      registrationId,
      defraAuthHeader,
      CMA_FIXTURE
    )
    await waitForReportingPeriodStatus(
      linkedOrganisation.refNo,
      registrationId,
      defraAuthHeader,
      'requires_resubmission'
    )

    await OrganisationsPage.open()
    await OrganisationsPage.searchFor(
      linkedOrganisation.organisation.companyName
    )
    await OrganisationsPage.viewLink(1)
    await OrganisationOverviewPage.viewRegistrationLink(1)

    // The restated period renders two rows: the submitted first submission
    // and a requires_resubmission skeleton with nothing to view yet.
    let reportsData = await RegistrationOverviewPage.getReportsTableData()
    let quarterOneRows = reportsData.filter(isQuarterOne2026)
    expect(quarterOneRows).toHaveLength(2)

    const submittedRow = findOrThrow(
      quarterOneRows,
      (row) => row.submission === '1',
      'Quarter 1 row for submission 1'
    )
    expect(submittedRow.status).toEqual('submitted')
    expect(submittedRow.links.map((link) => link.text)).toEqual([
      'View',
      'Unsubmit'
    ])

    const skeletonRow = findOrThrow(
      quarterOneRows,
      (row) => row.submission === '',
      'Quarter 1 skeleton row'
    )
    expect(skeletonRow.status).toEqual('requires_resubmission')
    expect(skeletonRow.links).toHaveLength(0)

    // Statuses come from the backend periodStatus: an ended period with no
    // report shows due/overdue (the calendar omits periods still in
    // progress), with nothing to view and no submission number.
    const outstandingRows = reportsData.filter((row) =>
      ['due', 'overdue'].includes(row.status)
    )
    expect(outstandingRows.length).toBeGreaterThanOrEqual(1)
    for (const row of outstandingRows) {
      expect(row.submission).toEqual('')
      expect(row.links).toHaveLength(0)
    }

    // Resubmit via the API: the period now holds two submitted submissions,
    // each with its own row and its own View link.
    await seedReportSubmission(
      linkedOrganisation.refNo,
      registrationId,
      defraAuthHeader,
      { ...PERIOD, submissionNumber: 2 }
    )
    await browser.refresh()

    reportsData = await RegistrationOverviewPage.getReportsTableData()
    quarterOneRows = reportsData.filter(isQuarterOne2026)
    // Row order relies on the backend calendar sorting items within a period
    // by submissionNumber ascending (build-all-submission-periods.js), which
    // the frontend renders as-is.
    expect(quarterOneRows.map((row) => row.submission)).toEqual(['1', '2'])
    for (const [index, row] of quarterOneRows.entries()) {
      expect(row.status).toEqual('submitted')
      const viewLink = findOrThrow(
        row.links,
        (link) => link.text === 'View',
        `View link on Quarter 1 row ${index + 1}`
      )
      expect(viewLink.href).toContain(
        `/reports/2026/quarterly/1/submissions/${index + 1}`
      )
    }

    // Submission 1 is now superseded by the later submitted submission 2, so
    // its row offers View only: Unsubmit is hidden on a superseded submission
    // (PAE-1657, admin-frontend #472). Submission 2, the current submission,
    // still offers Unsubmit.
    const supersededRow = findOrThrow(
      quarterOneRows,
      (row) => row.submission === '1',
      'Quarter 1 superseded submission 1 row'
    )
    expect(supersededRow.links.map((link) => link.text)).toEqual(['View'])

    const currentRow = findOrThrow(
      quarterOneRows,
      (row) => row.submission === '2',
      'Quarter 1 current submission 2 row'
    )
    expect(currentRow.links.map((link) => link.text)).toEqual([
      'View',
      'Unsubmit'
    ])

    // Opening a prior submission resolves that submission: the report view
    // heading names it.
    const firstSubmissionRowNumber =
      reportsData.findIndex(
        (row) => isQuarterOne2026(row) && row.submission === '1'
      ) + 1
    await RegistrationOverviewPage.clickOnViewReportLink(
      firstSubmissionRowNumber
    )
    expect(await ReportViewPage.getHeaderText()).toEqual(
      'Report – 2026 quarterly period 1 submission 1'
    )
    await browser.back()

    // Unsubmit the second submission: the confirm and result pages both name
    // the affected submission.
    const secondSubmissionRowNumber =
      reportsData.findIndex(
        (row) => isQuarterOne2026(row) && row.submission === '2'
      ) + 1
    await RegistrationOverviewPage.clickOnUnsubmitReportLink(
      secondSubmissionRowNumber
    )
    expect(await UnsubmitConfirmationPage.getDetailsText()).toContain(
      'Submission: 2'
    )
    await UnsubmitConfirmationPage.confirmUnsubmit()
    expect(await UnsubmitConfirmationPage.getSuccessMessage()).toEqual(
      'Report unsubmitted'
    )
    expect(await UnsubmitConfirmationPage.getDetailsText()).toContain(
      'Submission: 2'
    )
  })
})
