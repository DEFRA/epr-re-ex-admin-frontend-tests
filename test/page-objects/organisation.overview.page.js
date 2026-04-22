import { Page } from 'page-objects/page'
import { $, $$ } from '@wdio/globals'

class OrganisationOverviewPage extends Page {
  open() {
    return super.open('/organisations')
  }

  async getHeaderText() {
    return await $('#main-content h1.govuk-heading-xl').getText()
  }

  async getRegistrationsTableData() {
    return await $$('table.govuk-table tbody tr').map(async (row) => {
      const registrationNumber = await row.$('td:nth-child(1)')
      const registrationStatus = await row.$('td:nth-child(2)')
      const processingType = await row.$('td:nth-child(3)')
      const material = await row.$('td:nth-child(4)')
      const site = await row.$('td:nth-child(5)')
      const accreditationNumber = await row.$('td:nth-child(6)')
      const accreditationStatus = await row.$('td:nth-child(7)')
      return {
        registrationNumber: await registrationNumber.getText(),
        registrationStatus: await registrationStatus.getText(),
        processingType: await processingType.getText(),
        material: await material.getText(),
        site: await site.getText(),
        accreditationNumber: await accreditationNumber.getText(),
        accreditationStatus: await accreditationStatus.getText()
      }
    })
  }

  async viewRegistrationLink(row) {
    await $(
      `main table tbody tr:nth-child(${row}) td:nth-child(8) a:nth-of-type(1)`
    ).click()
  }
}

export default new OrganisationOverviewPage()
