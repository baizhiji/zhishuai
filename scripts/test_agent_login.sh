#!/bin/bash
# Test agent login separately (isolated from rate limits)
curl -s -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"13900000099","password":"123456","loginType":"user"}'
echo ""
