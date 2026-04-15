import {
  Accreditation,
  Organisation,
  Registration
} from '../support/generator.js'

import { BaseAPI } from '../apis/base-api.js'
import { trackCreatedOrgId } from './cleanup-tracker.js'
import { expect } from '@wdio/globals'
import { request } from 'undici'

async function getEntraToken() {
  const entraUrl = 'http://localhost:3010/sign'
  const payload = JSON.stringify({
    clientId: 'clientId',
    username: 'ea@test.gov.uk'
  })
  const response = await request(entraUrl, {
    method: 'POST',
    body: payload
  })
  const data = await response.body.json()
  return data.access_token
}

export async function updateMigratedOrganisation(refNo, updateDataRows) {
  const baseAPI = new BaseAPI()
  const token = await getEntraToken()
  const authHeader = { Authorization: `Bearer ${token}` }

  const response = await baseAPI.get(`/v1/organisations/${refNo}`, authHeader)
  expect(response.statusCode).toBe(200)

  const data = await response.body.json()
  const currentYear = new Date().getFullYear()

  for (let i = 0; i < updateDataRows.length; i++) {
    const updateData = updateDataRows[i]
    data.registrations[i].status = updateData.status
    data.registrations[i].validFrom = '2026-01-01'
    data.registrations[i].validTo = `${currentYear + 1}-01-01`
    data.registrations[i].registrationNumber = updateData.regNumber
    if (updateData.reprocessingType) {
      data.registrations[i].reprocessingType = updateData.reprocessingType
    }
    data.registrations[i].statusHistory = [
      ...(data.registrations[i].statusHistory || []),
      { status: updateData.status, updatedAt: '2026-01-01' }
    ]

    if (updateData.accNumber && data.accreditations[i]) {
      data.accreditations[i].status = updateData.status
      data.accreditations[i].validFrom = '2026-01-01'
      data.accreditations[i].validTo = `${currentYear + 1}-01-01`
      data.accreditations[i].accreditationNumber = updateData.accNumber
      if (updateData.reprocessingType) {
        data.accreditations[i].reprocessingType = updateData.reprocessingType
      }
      data.registrations[i].accreditationId = data.accreditations[i].id
    }
  }

  data.status = updateDataRows[0].status

  const putResponse = await baseAPI.put(
    `/v1/dev/organisations/${refNo}`,
    JSON.stringify({ organisation: data }),
    authHeader
  )
  expect(putResponse.statusCode).toBe(200)

  return data
}

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
  trackCreatedOrgId(orgId)
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
