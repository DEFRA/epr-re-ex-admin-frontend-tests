import path from 'node:path'
import os from 'node:os'

import { browser, expect } from '@wdio/globals'

import LoginPage from 'page-objects/login.js'
import OrsUploadPage from 'page-objects/ors.upload.page.js'
import {
  createLinkedOrganisation,
  updateMigratedOrganisation
} from '../support/apicalls.js'
import {
  createOrsSpreadsheet,
  validOrsSites
} from '../support/ors-spreadsheet.js'

describe('ORS upload flow @orsupload', () => {
  it('Should upload an ORS workbook and show completed import status', async () => {
    const { orgId, refNo } = await createLinkedOrganisation([
      { material: 'Paper or board (R3)', wasteProcessingType: 'Exporter' }
    ])

    const registrationNumber = `EPR/TEST${orgId}/R1`
    const accreditationNumber = `ACC/TEST${orgId}/A1`

    await updateMigratedOrganisation(refNo, [
      {
        regNumber: registrationNumber,
        accNumber: accreditationNumber,
        status: 'approved'
      }
    ])

    const workbookPath = path.join(os.tmpdir(), `ors-test-${orgId}.xlsx`)

    await createOrsSpreadsheet(workbookPath, {
      metadata: {
        packagingWasteCategory: 'Paper or board',
        orgId: parseInt(orgId),
        registrationNumber,
        accreditationNumber
      },
      sites: validOrsSites
    })

    await LoginPage.open()
    await LoginPage.enterCredentials('ea@test.gov.uk', 'pass')
    await LoginPage.submitCredentials()

    await OrsUploadPage.open()
    await expect(browser).toHaveTitle(
      expect.stringContaining('Upload ORS workbooks')
    )

    await OrsUploadPage.expectUploadFormVisible()
    await OrsUploadPage.uploadWorkbook(workbookPath)
    await OrsUploadPage.clickStartUpload()

    await OrsUploadPage.waitForStatusPage()
    const finalStatus = await OrsUploadPage.waitForCompletedOrFailedImport()

    expect(finalStatus).toEqual('Import completed')

    const statusSummary = await OrsUploadPage.getStatusSummaryText()
    expect(statusSummary).toContain('Files processed:')
    expect(statusSummary).toContain('Successful:')

    expect(statusSummary).toContain('Failed: 0')
  })
})
