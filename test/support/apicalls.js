import {
  Accreditation,
  Organisation,
  Registration
} from '../support/generator.js'

import { BaseAPI } from '../apis/base-api.js'
import { expect } from '@wdio/globals'

// Examples
// dataRows = [{ material: 'Paper or board (R3)', wasteProcessingType: 'Reprocessor'}, { material: 'Steel (R4)', wasteProcessingType: 'Exporter'}]
export async function createLinkedOrganisation(dataRows) {
  const baseAPI = new BaseAPI()

  const organisation = new Organisation()
  let payload = ''
  if (dataRows[0].wasteProcessingType === 'Reprocessor') {
    payload = organisation.toNonRegisteredUKSoleTraderPayload()
  } else {
    payload = organisation.toPayload()
  }

  let response = await baseAPI.post(
    '/v1/apply/organisation',
    JSON.stringify(payload)
  )
  expect(response.statusCode).toBe(200)

  const orgResponseData = await response.body.json()

  const orgId = orgResponseData?.orgId
  const refNo = orgResponseData?.referenceNumber

  for (const dataRow of dataRows) {
    let material = 'Paper or board (R3)'
    const glassRecyclingProcess = dataRow.glassRecyclingProcess?.trim()
    if (dataRow.material !== '') {
      material = dataRow.material
    }
    const registration = new Registration(orgId, refNo)
    payload =
      dataRow.wasteProcessingType === 'Reprocessor'
        ? registration.toAllMaterialsPayload(material, glassRecyclingProcess)
        : registration.toExporterPayload(material, glassRecyclingProcess)
    response = await baseAPI.post(
      '/v1/apply/registration',
      JSON.stringify(payload)
    )
    expect(response.statusCode).toBe(201)

    const accreditation = new Accreditation(orgId, refNo)
    accreditation.postcode = registration.postcode
    payload =
      dataRow.wasteProcessingType === 'Reprocessor'
        ? accreditation.toReprocessorPayload(material, glassRecyclingProcess)
        : accreditation.toExporterPayload(material, glassRecyclingProcess)

    response = await baseAPI.post(
      '/v1/apply/accreditation',
      JSON.stringify(payload)
    )
    expect(response.statusCode).toBe(201)
  }

  response = await baseAPI.post(`/v1/dev/form-submissions/${refNo}/migrate`, '')
  expect(response.statusCode).toBe(200)

  return { orgId, refNo, organisation }
}
