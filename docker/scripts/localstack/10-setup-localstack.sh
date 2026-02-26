#!/bin/bash

# This is an example of how to setup localstack resources on startup.
# Uncomment the below to create a localstack S3 bucket called 'example-bucket'

echo "[INIT SCRIPT] Starting LocalStack setup" >&2

export AWS_REGION=eu-west-2
export AWS_DEFAULT_REGION=eu-west-2
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test


echo "[INIT SCRIPT] Creating buckets" >&2

aws --endpoint-url=http://localhost:4566 s3 mb s3://re-ex-public-register

echo "[INIT SCRIPT] Creating queues" >&2

aws --endpoint-url=http://localhost:4566 sqs create-queue --queue-name epr_backend_commands
