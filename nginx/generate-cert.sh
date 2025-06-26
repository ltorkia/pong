#!/bin/bash

CERT_DIR="/etc/nginx/ssl"
CERT_FILE="$CERT_DIR/transcendence.crt"
KEY_FILE="$CERT_DIR/transcendence.key"

mkdir -p $CERT_DIR

if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
  echo "Génération d'un certificat SSL auto-signé..."
  openssl req -x509 -nodes -days 365 \
    -subj "/C=FR/ST=IDF/L=Paris/O=42/OU=42/CN=localhost" \
    -newkey rsa:2048 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE"
else
  echo "Certificat déjà présent, pas de régénération."
fi
