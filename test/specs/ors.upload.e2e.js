import fs from 'node:fs'
import path from 'node:path'

import { browser, expect } from '@wdio/globals'

import LoginPage from 'page-objects/login.js'
import OrsUploadPage from 'page-objects/ors.upload.page.js'

describe('ORS upload flow @orsupload', () => {
  it('Should upload an ORS workbook and show completed import status', async () => {
    const workbookPath = path.resolve(
      process.cwd(),
      'test/fixtures/ors/ors-id-log-example.xlsx'
    )

    if (!fs.existsSync(workbookPath)) {
      throw new Error(`Expected ORS workbook fixture at ${workbookPath}`)
    }

    await LoginPage.open()
    await expect(browser).toHaveTitle(expect.stringContaining('Login'))
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
    expect(statusSummary).toContain('Failed:')

    const uploadedFileName = OrsUploadPage.workbookFileName(workbookPath)
    const fileResults = await OrsUploadPage.getUploadedFileResults()

    expect(fileResults).toContainEqual(
      expect.objectContaining({
        fileName: uploadedFileName,
        result: 'success'
      })
    )
  })
})
