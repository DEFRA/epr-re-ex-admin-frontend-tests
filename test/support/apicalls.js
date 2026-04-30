import {
  Accreditation,
  Organisation,
  Registration
} from '../support/generator.js'

import { BaseAPI } from '../apis/base-api.js'
import { trackCreatedOrgId } from './cleanup-tracker.js'
import { expect } from '@wdio/globals'
import { request } from 'undici'
import { randomUUID } from 'crypto'

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

// Registers a throwaway user with the Defra ID stub and returns a Bearer token
// with standardUser scope for the given defraOrgId.
// The Host header is spoofed on every request so the stub embeds
// http://defra-id-stub:3200/cdp-defra-id-stub as the JWT issuer — which is
// what the backend is configured to trust.
async function getDefraUserToken(defraOrgId) {
  const stubUrl = 'http://localhost:3200'
  const stubHost = 'defra-id-stub:3200'
  const userId = randomUUID()
  const email = `test-${userId}@example.com`
  const clientId = '63983fc2-cfff-45bb-8ec2-959e21062b9a'

  await request(`${stubUrl}/cdp-defra-id-stub/API/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', host: stubHost },
    body: JSON.stringify({
      userId,
      email,
      firstName: 'Test',
      lastName: 'User',
      loa: '1',
      aal: '1',
      enrolmentCount: 1,
      enrolmentRequestCount: 1
    })
  })

  const relParams = new URLSearchParams({
    csrfToken: randomUUID(),
    userId,
    relationshipId: 'relId1',
    organisationId: defraOrgId,
    organisationName: 'Test Organisation',
    relationshipRole: 'role',
    roleName: 'User',
    roleStatus: 'Status',
    // eslint-disable-next-line camelcase
    redirect_uri: 'http://localhost:3000/'
  })
  await request(
    `${stubUrl}/cdp-defra-id-stub/register/${userId}/relationship`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        host: stubHost
      },
      body: relParams.toString()
    }
  )

  const authParams = new URLSearchParams({
    user: email,
    // eslint-disable-next-line camelcase
    client_id: clientId,
    // eslint-disable-next-line camelcase
    response_type: 'code',
    // eslint-disable-next-line camelcase
    redirect_uri: 'http://0.0.0.0:3001/health',
    state: 'state',
    scope: 'email'
  })
  const authResponse = await request(
    `${stubUrl}/cdp-defra-id-stub/authorize?${authParams.toString()}`,
    { method: 'GET', headers: { host: stubHost } }
  )
  if (authResponse.statusCode !== 302) {
    const body = await authResponse.body.text()
    throw new Error(
      `Defra ID authorize returned ${authResponse.statusCode}: ${body}`
    )
  }
  const sessionId = authResponse.headers.location.split('sessionId=')[1]

  const tokenResponse = await request(`${stubUrl}/cdp-defra-id-stub/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', host: stubHost },
    body: JSON.stringify({
      // eslint-disable-next-line camelcase
      client_id: clientId,
      // eslint-disable-next-line camelcase
      client_secret: 'test_value',
      // eslint-disable-next-line camelcase
      grant_type: 'authorization_code',
      code: sessionId
    })
  })
  const tokenData = await tokenResponse.body.json()
  return tokenData.access_token
}

// Returns the most recently completed reporting period for the given cadence.
// Quarterly: periods 1–4 map to Q1–Q4. Monthly: periods 1–12 map to Jan–Dec.
function lastCompletedPeriod(cadence) {
  const now = new Date()
  const month = now.getUTCMonth() + 1
  const year = now.getUTCFullYear()

  if (cadence === 'monthly') {
    return month === 1
      ? { year: year - 1, period: 12 }
      : { year, period: month - 1 }
  }

  const currentQuarter = Math.ceil(month / 3)
  return currentQuarter === 1
    ? { year: year - 1, period: 4 }
    : { year, period: currentQuarter - 1 }
}

// Creates and submits a report for a registration, transitioning it through
// in_progress → ready_to_submit → submitted.
// Cadence is determined by matching the CSV generator's logic: monthly only
// when the linked accreditation is approved/suspended with an accreditationNumber.
// validFrom is set to the period start so the CSV generates exactly one row for
// this registration regardless of when the test runs.
export async function createSubmittedReport(refNo, registrationIndex = 0) {
  const baseAPI = new BaseAPI()
  const entraToken = await getEntraToken()
  const entraAuthHeader = { Authorization: `Bearer ${entraToken}` }

  const orgResponse = await baseAPI.get(
    `/v1/organisations/${refNo}`,
    entraAuthHeader
  )
  expect(orgResponse.statusCode).toBe(200)
  const orgData = await orgResponse.body.json()

  const registration = orgData.registrations[registrationIndex]
  const registrationId = registration.id

  const linkedAccreditation = registration.accreditationId
    ? orgData.accreditations.find(
        (a) =>
          a.id === registration.accreditationId &&
          (a.status === 'approved' || a.status === 'suspended') &&
          a.accreditationNumber
      )
    : null
  const cadence = linkedAccreditation ? 'monthly' : 'quarterly'
  const { year, period } = lastCompletedPeriod(cadence)

  const periodStartMonth = cadence === 'monthly' ? period : (period - 1) * 3 + 1
  orgData.registrations[registrationIndex].validFrom =
    `${year}-${String(periodStartMonth).padStart(2, '0')}-01`

  // When the accreditation isn't approved the CSV generator treats this as quarterly,
  // but the backend uses accreditationId presence to enforce monthly cadence.
  // Delete the key (not null) so JSON omits it — schema only allows absent, not explicit null.
  if (!linkedAccreditation) {
    delete orgData.registrations[registrationIndex].accreditationId
  }

  const defraOrgId = randomUUID()
  orgData.status = 'active'
  orgData.statusHistory = [
    ...(orgData.statusHistory || []),
    { status: 'active', updatedAt: new Date().toISOString() }
  ]
  orgData.linkedDefraOrganisation = {
    orgId: defraOrgId,
    orgName: 'Test Organisation',
    linkedAt: new Date().toISOString(),
    linkedBy: { email: 'test@example.com', id: randomUUID() }
  }

  const activateResponse = await baseAPI.put(
    `/v1/dev/organisations/${refNo}`,
    JSON.stringify({ organisation: orgData }),
    entraAuthHeader
  )
  if (activateResponse.statusCode !== 200) {
    const body = await activateResponse.body.text()
    throw new Error(
      `activate PUT returned ${activateResponse.statusCode}: ${body}`
    )
  }

  const defraToken = await getDefraUserToken(defraOrgId)
  const defraAuthHeader = { Authorization: `Bearer ${defraToken}` }
  const jsonHeaders = { ...defraAuthHeader, 'content-type': 'application/json' }

  const basePath = `/v1/organisations/${refNo}/registrations/${registrationId}/reports/${year}/${cadence}/${period}`

  const createResponse = await baseAPI.post(basePath, '', defraAuthHeader)
  if (createResponse.statusCode !== 201) {
    const body = await createResponse.body.text()
    throw new Error(
      `POST ${basePath} returned ${createResponse.statusCode}: ${body}`
    )
  }
  let version = (await createResponse.body.json()).version

  const patchResponse = await baseAPI.patch(
    basePath,
    JSON.stringify({ tonnageRecycled: 10, tonnageNotRecycled: 0 }),
    jsonHeaders
  )
  expect(patchResponse.statusCode).toBe(200)
  version = (await patchResponse.body.json()).version

  const readyResponse = await baseAPI.post(
    `${basePath}/status`,
    JSON.stringify({ status: 'ready_to_submit', version }),
    jsonHeaders
  )
  expect(readyResponse.statusCode).toBe(200)
  version += 1

  const submitResponse = await baseAPI.post(
    `${basePath}/status`,
    JSON.stringify({ status: 'submitted', version }),
    jsonHeaders
  )
  expect(submitResponse.statusCode).toBe(200)

  return { organisationId: refNo, registrationId, year, cadence, period }
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

  const registrations = []
  for (const dataRow of dataRows) {
    let material = 'Paper or board (R3)'
    const glassRecyclingProcess = dataRow.glassRecyclingProcess?.trim()
    if (dataRow.material !== '') {
      material = dataRow.material
    }
    const registration = new Registration(orgId, refNo)
    registrations.push(registration)
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

  return { orgId, refNo, organisation, registrations }
}
