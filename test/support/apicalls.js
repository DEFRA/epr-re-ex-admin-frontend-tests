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
import { readFile } from 'node:fs/promises'

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
  /**
   * @typedef {Object} AuthResponse
   * @property {string} access_token
   * @property {string} token_type
   * @property {number} expires_in
   */
  const data = /** @type {AuthResponse} */ (await response.body.json())
  return data.access_token
}

// Registers a throwaway user with the Defra ID stub and returns a Bearer token
// with standardUser scope for the given defraOrgId.
// The Host header is spoofed on every request so the stub embeds
// http://defra-id-stub:3200/cdp-defra-id-stub as the JWT issuer — which is
// what the backend is configured to trust.
async function getDefraUserToken(email, orgId = randomUUID()) {
  const stubUrl = 'http://localhost:3200'
  const stubHost = 'defra-id-stub:3200'
  const userId = randomUUID()
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
    organisationId: orgId,
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

  const headers = await authResponse.headers
  const headersLocation = String(headers.location)
  const sessionId = headersLocation.split('sessionId=')[1]

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

  /**
   * @typedef {Object} AuthResponse
   * @property {string} access_token
   * @property {string} token_type
   * @property {number} expires_in
   */
  const tokenData = /** @type {AuthResponse} */ (
    await tokenResponse.body.json()
  )
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
  const orgData = await assertSuccessResponse(
    orgResponse,
    `/v1/organisations/${refNo}`
  )

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

  const email = orgData.submitterContactDetails.email

  const payload = {
    version: Number(orgData.version),
    updateFragment: orgData
  }
  const updateResponse = await baseAPI.put(
    `/v1/organisations/${refNo}`,
    JSON.stringify(payload),
    entraAuthHeader
  )

  await assertSuccessResponse(updateResponse, `PUT /v1/organisations/${refNo}`)

  const defraToken = await getDefraUserToken(email)
  const defraAuthHeader = { Authorization: `Bearer ${defraToken}` }
  const jsonHeaders = { ...defraAuthHeader, 'content-type': 'application/json' }

  const linkResponse = await baseAPI.post(
    `/v1/organisations/${refNo}/link`,
    '',
    defraAuthHeader
  )

  await assertSuccessResponse(
    linkResponse,
    `POST /v1/organisations/${refNo}/link`
  )

  const basePath = `/v1/organisations/${refNo}/registrations/${registrationId}/reports/${year}/${cadence}/${period}/submissions/1`

  const createResponse = await baseAPI.post(basePath, '', defraAuthHeader)

  await assertSuccessResponse(createResponse, `POST ${basePath}`)

  let version

  let patchResponse = await baseAPI.patch(
    basePath,
    JSON.stringify({
      tonnageRecycled: 10,
      tonnageNotRecycled: 0,
      prnRevenue: 0,
      freeTonnage: 0
    }),
    jsonHeaders
  )

  patchResponse = await assertSuccessResponse(
    patchResponse,
    `PATCH ${basePath}`
  )

  version = patchResponse.version

  const readyResponse = await baseAPI.post(
    `${basePath}/status`,
    JSON.stringify({ status: 'ready_to_submit', version }),
    jsonHeaders
  )

  await assertSuccessResponse(readyResponse, `POST ${basePath}/status`)
  version += 1

  const submitResponse = await baseAPI.post(
    `${basePath}/status`,
    JSON.stringify({
      status: 'submitted',
      version,
      submissionDeclaredBy: 'Test User'
    }),
    jsonHeaders
  )

  await assertSuccessResponse(submitResponse, `POST ${basePath}/status`)

  return { organisationId: refNo, registrationId, year, cadence, period }
}

// Registers a throwaway Defra ID user for the organisation's submitter email
// and links it, returning the bearer header the operator-facing report and
// summary-log endpoints require (the service maintainer token 403s on them).
export async function linkDefraUser(refNo) {
  const baseAPI = new BaseAPI()
  const orgData = await getOrganisation(refNo)
  const email = orgData.submitterContactDetails.email

  const defraToken = await getDefraUserToken(email)
  const defraAuthHeader = { Authorization: `Bearer ${defraToken}` }

  const linkResponse = await baseAPI.post(
    `/v1/organisations/${refNo}/link`,
    '',
    defraAuthHeader
  )
  await assertSuccessResponse(
    linkResponse,
    `POST /v1/organisations/${refNo}/link`
  )

  return { defraAuthHeader, email }
}

// Creates and submits a specific report submission for a period, driving the
// create → patch → ready_to_submit → submitted state machine. Unlike
// createSubmittedReport this targets an explicit year/cadence/period, so it
// can seed a period matching a summary log fixture, and an explicit
// submissionNumber. Submission numbers above 1 are resubmissions: the backend
// only permits them once the period's latest submitted report is marked as
// requiring resubmission (see uploadAndSubmitSummaryLog).
export async function seedReportSubmission(
  refNo,
  registrationId,
  defraAuthHeader,
  { year, cadence, period, submissionNumber },
  patchFields = { tonnageRecycled: 100, tonnageNotRecycled: 0 }
) {
  const baseAPI = new BaseAPI()
  const jsonHeaders = { ...defraAuthHeader, 'content-type': 'application/json' }
  const basePath = `/v1/organisations/${refNo}/registrations/${registrationId}/reports/${year}/${cadence}/${period}/submissions/${submissionNumber}`

  const createResponse = await baseAPI.post(basePath, '', defraAuthHeader)
  await assertSuccessResponse(createResponse, `POST ${basePath}`)

  let patchResponse = await baseAPI.patch(
    basePath,
    JSON.stringify(patchFields),
    jsonHeaders
  )
  patchResponse = await assertSuccessResponse(
    patchResponse,
    `PATCH ${basePath}`
  )

  let version = patchResponse.version

  const readyResponse = await baseAPI.post(
    `${basePath}/status`,
    JSON.stringify({ status: 'ready_to_submit', version }),
    jsonHeaders
  )
  await assertSuccessResponse(readyResponse, `POST ${basePath}/status`)
  version += 1

  const submitResponse = await baseAPI.post(
    `${basePath}/status`,
    JSON.stringify({
      status: 'submitted',
      version,
      submissionDeclaredBy: 'Test User'
    }),
    jsonHeaders
  )
  await assertSuccessResponse(submitResponse, `POST ${basePath}/status`)
}

const SUMMARY_LOG_FAILURE_STATUSES = [
  'invalid',
  'rejected',
  'validation_failed',
  'submission_failed'
]

async function waitForSummaryLogStatus(
  baseAPI,
  summaryLogPath,
  defraAuthHeader,
  targetStatus
) {
  const timeoutMs = 90000
  const startTime = Date.now()
  let status

  while (Date.now() - startTime < timeoutMs) {
    const response = await baseAPI.get(summaryLogPath, defraAuthHeader)
    ;({ status } = await assertSuccessResponse(
      response,
      `GET ${summaryLogPath}`
    ))
    if (status === targetStatus) {
      return
    }
    if (SUMMARY_LOG_FAILURE_STATUSES.includes(status)) {
      throw new Error(
        `Summary log reached '${status}' while waiting for '${targetStatus}'`
      )
    }
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  throw new Error(
    `Timed out waiting for summary log status '${targetStatus}' (last seen: '${status}')`
  )
}

// Drives the full summary-log pipeline over HTTP without the operator
// frontend: initiate (backend) → multipart file POST (cdp-uploader) → poll
// until validated → submit → poll until submitted. On submit the backend
// flags any restated closed periods as requiring resubmission, which is what
// unlocks creating submission 2 for those periods.
export async function uploadAndSubmitSummaryLog(
  refNo,
  registrationId,
  defraAuthHeader,
  filePath
) {
  const baseAPI = new BaseAPI()
  const jsonHeaders = { ...defraAuthHeader, 'content-type': 'application/json' }
  const summaryLogsPath = `/v1/organisations/${refNo}/registrations/${registrationId}/summary-logs`

  const initiateResponse = await baseAPI.post(
    summaryLogsPath,
    JSON.stringify({ redirectUrl: '/' }),
    jsonHeaders
  )
  const { summaryLogId, uploadUrl } = await assertSuccessResponse(
    initiateResponse,
    `POST ${summaryLogsPath}`
  )

  // The backend addresses cdp-uploader by its container hostname; from the
  // test host the same service is published on localhost:7337.
  const hostUploadUrl = new URL(
    new URL(uploadUrl).pathname,
    'http://localhost:7337'
  )

  // The field name must be summaryLogUpload: cdp-uploader echoes the form
  // shape back to the backend callback, whose schema requires that key.
  const form = new FormData()
  form.append(
    'summaryLogUpload',
    new Blob([await readFile(filePath)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }),
    'summary-log.xlsx'
  )
  const uploadResponse = await fetch(hostUploadUrl, {
    method: 'POST',
    body: form,
    redirect: 'manual'
  })
  if (uploadResponse.status >= 400) {
    throw new Error(
      `POST ${hostUploadUrl}: expected redirect but got ${uploadResponse.status}`
    )
  }

  const summaryLogPath = `${summaryLogsPath}/${summaryLogId}`
  await waitForSummaryLogStatus(
    baseAPI,
    summaryLogPath,
    defraAuthHeader,
    'validated'
  )

  const submitResponse = await baseAPI.post(
    `${summaryLogPath}/submit`,
    '',
    defraAuthHeader
  )
  await assertSuccessResponse(submitResponse, `POST ${summaryLogPath}/submit`)

  await waitForSummaryLogStatus(
    baseAPI,
    summaryLogPath,
    defraAuthHeader,
    'submitted'
  )

  return summaryLogId
}

// Polls the reports calendar until some reporting period carries the given
// periodStatus. The resubmission flag is written by the backend's summary-log
// submit worker, so it can land shortly after the log reaches 'submitted'.
export async function waitForReportingPeriodStatus(
  refNo,
  registrationId,
  defraAuthHeader,
  periodStatus
) {
  const baseAPI = new BaseAPI()
  const calendarPath = `/v1/organisations/${refNo}/registrations/${registrationId}/reports/calendar`
  const timeoutMs = 30000
  const startTime = Date.now()

  while (Date.now() - startTime < timeoutMs) {
    const response = await baseAPI.get(calendarPath, defraAuthHeader)
    const { reportingPeriods } = await assertSuccessResponse(
      response,
      `GET ${calendarPath}`
    )
    if (reportingPeriods.some((rp) => rp.periodStatus === periodStatus)) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  throw new Error(
    `Timed out waiting for a reporting period with status '${periodStatus}'`
  )
}

export async function updateMigratedOrganisation(refNo, updateDataRows) {
  const baseAPI = new BaseAPI()
  const token = await getEntraToken()
  const authHeader = { Authorization: `Bearer ${token}` }

  const response = await baseAPI.get(`/v1/organisations/${refNo}`, authHeader)
  const data = await assertSuccessResponse(
    response,
    `GET /v1/organisations/${refNo}`
  )

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

  const payload = {
    version: Number(data.version),
    updateFragment: data
  }
  const putResponse = await baseAPI.put(
    `/v1/organisations/${refNo}`,
    JSON.stringify(payload),
    authHeader
  )

  await assertSuccessResponse(putResponse, `PUT /v1/organisations/${refNo}`)
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
  const orgResponseData = await assertSuccessResponse(
    response,
    `POST /v1/apply/organisations`
  )

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

    if (!dataRow.withoutAccreditation) {
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
  }

  response = await baseAPI.post(`/v1/dev/form-submissions/${refNo}/migrate`, '')
  await assertSuccessResponse(
    response,
    `POST /v1/dev/form-submissions/${refNo}/migrate`
  )

  return { orgId, refNo, organisation, registrations }
}

export async function getOrganisation(refNo) {
  const baseAPI = new BaseAPI()
  const entraToken = await getEntraToken()
  const orgResponse = await baseAPI.get(`/v1/organisations/${refNo}`, {
    Authorization: `Bearer ${entraToken}`
  })
  return await assertSuccessResponse(orgResponse, `/v1/organisations/${refNo}`)
}

export async function linkOrganisationToDefraId(refNo, email) {
  const baseAPI = new BaseAPI()

  const orgId = randomUUID()
  const defraToken = await getDefraUserToken(email, orgId)
  const defraAuthHeader = { Authorization: `Bearer ${defraToken}` }

  const linkResponse = await baseAPI.post(
    `/v1/organisations/${refNo}/link`,
    '',
    defraAuthHeader
  )

  await assertSuccessResponse(
    linkResponse,
    `POST /v1/organisations/${refNo}/link`
  )
  return { defraOrgId: orgId, defraOrgName: 'Test Organisation' }
}

async function assertSuccessResponse(response, context) {
  const text = await response.body.text()
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(
      `${context}: expected 2xx but got ${response.statusCode}\n${text}`
    )
  }
  try {
    return JSON.parse(text)
  } catch (err) {
    throw new Error(`${context}: failed to parse JSON response\n${text}`)
  }
}
