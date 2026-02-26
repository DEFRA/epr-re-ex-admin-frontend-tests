#!/bin/bash

echo "[INIT SCRIPT] Starting LocalStack queue setup" >&2

export AWS_REGION=eu-west-2
export AWS_DEFAULT_REGION=eu-west-2
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test

echo "[INIT SCRIPT] Creating queues" >&2

aws --endpoint-url=http://localhost:4566 sqs create-queue --queue-name epr_backend_commands
