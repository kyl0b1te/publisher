#!/bin/bash

# Create build folder
mkdir /tmp/build && cd /app

# Copy sources except node_modules folder
cp -r `ls -A | grep -v "node_modules"` /tmp/build/ && cd /tmp/build

# Install production deps
npm ci --only=production

# Compile typescript and zip files
zip -r /tmp/lambda.blog-publisher.zip .env lambda.js dist/ bin/ node_modules/ -x "dist/cmd/*"

# Clean up
rm -rf /tmp/build
