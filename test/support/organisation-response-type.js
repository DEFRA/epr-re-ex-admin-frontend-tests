/**
 * @typedef {Object} Address
 * @property {string} line1
 * @property {string} postcode
 * @property {string} country
 * @property {string} town
 */

/**
 * @typedef {Object} CompanyDetails
 * @property {string} name
 * @property {string} tradingName
 * @property {Address} address
 */

/**
 * @typedef {Object} ContactDetails
 * @property {string} fullName
 * @property {string} email
 * @property {string} phone
 * @property {string} jobTitle
 */

/**
 * @typedef {Object} FormSubmission
 * @property {string} id
 * @property {string} time  - ISO 8601 date string
 */

/**
 * @typedef {Object} StatusHistoryEntry
 * @property {string} status
 * @property {string} updatedAt  - ISO 8601 date string
 */

/**
 * @typedef {Object} WasteManagementPermit
 * @property {string} [permitNumber]
 * @property {string} [type]
 */

/**
 * @typedef {Object} Registration
 * @property {string} id
 * @property {FormSubmission} formSubmission
 * @property {string} submittedToRegulator
 * @property {string} orgName
 * @property {ContactDetails} submitterContactDetails
 * @property {ContactDetails} applicationContactDetails
 * @property {Object} site
 * @property {Address} noticeAddress
 * @property {string} cbduNumber
 * @property {string} material
 * @property {string} suppliers
 * @property {string} plantEquipmentDetails
 * @property {'reprocessor' | 'exporter'} wasteProcessingType
 * @property {WasteManagementPermit[]} wasteManagementPermits
 * @property {Object[]} approvedPersons
 * @property {Object[]} samplingInspectionPlanPart1FileUploads
 * @property {Object[]} yearlyMetrics
 * @property {string} [accreditationId]
 * @property {string} registrationNumber
 * @property {string} validFrom  - ISO 8601 date string
 * @property {string} validTo    - ISO 8601 date string
 * @property {'input' | 'output'} reprocessingType
 * @property {StatusHistoryEntry[]} statusHistory
 * @property {string} status
 * @property {Accreditation | null} accreditation
 */

/**
 * @typedef {Object} PrnIssuance
 * @property {string} [type]
 * @property {number} [amount]
 */

/**
 * @typedef {Object} Accreditation
 * @property {string} id
 * @property {FormSubmission} formSubmission
 * @property {string} submittedToRegulator
 * @property {'reprocessor' | 'exporter'} wasteProcessingType
 * @property {string} material
 * @property {Object} site
 * @property {string} orgName
 * @property {PrnIssuance} prnIssuance
 * @property {ContactDetails} submitterContactDetails
 * @property {Object[]} samplingInspectionPlanPart2FileUploads
 * @property {string | null} validFrom
 * @property {string | null} validTo
 * @property {string | null} accreditationNumber
 * @property {string | null} reprocessingType
 * @property {StatusHistoryEntry[]} statusHistory
 * @property {string} status
 */

/**
 * @typedef {Object} User
 * @property {string} fullName
 * @property {string} email
 * @property {string[]} roles
 */

/**
 * @typedef {Object} LinkedBy
 * @property {string} email
 * @property {string} id
 */

/**
 * @typedef {Object} LinkedDefraOrganisation
 * @property {string} orgId
 * @property {string} orgName
 * @property {string | null} linkedAt
 * @property {LinkedBy} linkedBy
 */

/**
 * @typedef {Object} OrgResponse
 * @property {string} id
 * @property {number} schemaVersion
 * @property {StatusHistoryEntry[]} statusHistory
 * @property {number} orgId
 * @property {FormSubmission} formSubmission
 * @property {('reprocessor' | 'exporter')[]} wasteProcessingTypes
 * @property {('england' | 'northern_ireland' | 'scotland' | 'wales')[]} reprocessingNations
 * @property {'individual' | 'company'} businessType
 * @property {CompanyDetails} companyDetails
 * @property {ContactDetails} submitterContactDetails
 * @property {ContactDetails} managementContactDetails
 * @property {string} submittedToRegulator
 * @property {Registration[]} registrations
 * @property {Accreditation[]} accreditations
 * @property {LinkedDefraOrganisation} [linkedDefraOrganisation]
 * @property {User[]} users
 * @property {string} status
 * @property {number} version
 */

/**
 * @typedef {Object} OrgCreatedResponse
 * @property {number} orgId
 * @property {string} orgName
 * @property {string} referenceNumber
 */
