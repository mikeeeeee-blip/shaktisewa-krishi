#!/bin/bash
echo "Testing Admin Creation API..."
echo ""
echo "1. Testing GET (should show usage info):"
curl -X GET http://localhost:3000/api/admin/create
echo ""
echo ""
echo "2. Testing POST (create admin):"
curl -X POST http://localhost:3000/api/admin/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@shaktisewa.com",
    "password": "Admin@123",
    "role": "admin",
    "businessName": "ShaktiSewa Admin"
  }'
echo ""
