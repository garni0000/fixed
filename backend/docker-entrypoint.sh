#!/bin/bash
set -e

echo "=== Running database migrations ==="
npx prisma migrate deploy --schema=./prisma/schema.prisma

echo "=== Starting application ==="
exec npm start
