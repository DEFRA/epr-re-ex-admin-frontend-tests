import { Agent, ProxyAgent } from 'undici'

const environment = process.env.ENVIRONMENT
const withProxy = process.env.WITH_PROXY
const xApiKey = process.env.X_API_KEY

if (environment === 'prod') {
  throw new Error(
    'The test suite is not meant to be run against the prod Environment!'
  )
}

const api = {
  local: withProxy ? 'http://epr-backend:3001' : 'http://localhost:3001',
  env: `https://epr-backend.${environment}.cdp-int.defra.cloud`,
  envFromLocal: `https://ephemeral-protected.api.${environment}.cdp-int.defra.cloud/epr-backend`,
  headers: xApiKey ? { 'x-api-key': xApiKey } : {}
}

const proxy = process.env.HTTP_PROXY
  ? new ProxyAgent({
      uri: process.env.HTTP_PROXY,
      keepAliveTimeout: 10,
      keepAliveMaxTimeout: 10
    })
  : new ProxyAgent({
      uri: 'http://localhost:7777',
      proxyTunnel: !!environment,
      requestTls: {
        rejectUnauthorized: false
      }
    })

const agent = new Agent({
  connections: 10,
  pipelining: 0,
  headersTimeout: 30000,
  bodyTimeout: 30000
})

const auth = {
  username: process.env.AUTH_USERNAME,
  password: process.env.AUTH_PASSWORD
}

let globalUndiciAgent = agent
if (environment) {
  globalUndiciAgent = proxy
}

let apiUri
let authUri

if (!environment) {
  apiUri = api.local
  authUri = auth.local
} else if (xApiKey) {
  apiUri = api.envFromLocal
  authUri = auth.env
} else {
  apiUri = api.env
  authUri = auth.env
}

export default {
  apiUri,
  authUri,
  auth,
  undiciAgent: globalUndiciAgent,
  apiHeaders: api.headers
}
