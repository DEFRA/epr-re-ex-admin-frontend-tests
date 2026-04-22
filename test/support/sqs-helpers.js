import { request } from 'undici'

const sqsEndpoint = process.env.SQS_ENDPOINT ?? 'http://localhost:4566'
const dlqUrl = `${sqsEndpoint}/000000000000/epr_backend_commands_dlq`

/**
 * Sends a message directly to the DLQ for test seeding.
 * @param {object} messageBody - The message body to send
 */
export async function sendMessageToDlq(messageBody) {
  const body = new URLSearchParams({
    Action: 'SendMessage',
    MessageBody: JSON.stringify(messageBody)
  })

  const response = await request(dlqUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  })

  if (response.statusCode !== 200) {
    const text = await response.body.text()
    throw new Error(
      `Failed to send message to DLQ: ${response.statusCode} ${text}`
    )
  }
}

/**
 * Purges all messages from the DLQ to ensure a clean state.
 */
export async function purgeDlq() {
  const body = new URLSearchParams({ Action: 'PurgeQueue' })

  await request(dlqUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  })
}
