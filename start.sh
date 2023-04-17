#!/bin/bash

if docker ps -a --format "{{.Names}}" | grep -q "spamassassin-app"; then
  echo "Container spamassassin-app already exists, starting..."
  docker start spamassassin-app
else
  echo "Container spamassassin-app does not exist, starting with docker-compose..."
  docker-compose -f ./sa/compose.yml up -d
fi