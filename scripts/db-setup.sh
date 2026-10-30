#!/bin/sh
set -e

if [ ! -f .env ]; then
  echo "Error: .env file not found. Copy .env.example to .env and fill in the values."
  exit 1
fi

. ./.env

docker run \
  --name gh-postgres-dev \
  -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  -e POSTGRES_DB=githubclone \
  -p 5433:5432 \
  -d postgres
