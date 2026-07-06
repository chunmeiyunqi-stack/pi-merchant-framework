#!/bin/bash
# ============================================================
# Pioneer AI Framework — RSA Key Generator
# Generates 2048-bit private and public key pairs for license signing/verification.
# ============================================================

set -e

# Define directories
KEYS_DIR="$(dirname "$0")/../keys"
mkdir -p "$KEYS_DIR"

PRIVATE_KEY_PATH="$KEYS_DIR/private_key.pem"
PUBLIC_KEY_PATH="$KEYS_DIR/public_key.pem"

echo "Generating 2048-bit RSA Private Key..."
# Generate private key
openssl genrsa -out "$PRIVATE_KEY_PATH" 2048

echo "Extracting RSA Public Key..."
# Extra public key
openssl rsa -pubout -in "$PRIVATE_KEY_PATH" -out "$PUBLIC_KEY_PATH"

echo "=========================================="
echo "✅ Keys generated successfully!"
echo "Private Key Path: $PRIVATE_KEY_PATH"
echo "Public Key Path:  $PUBLIC_KEY_PATH"
echo "=========================================="
echo "Instruction:"
echo "1. Set the private key content or path in your license signer config."
echo "2. Encode the contents of public_key.pem to base64, or use the PEM block directly in your LICENSE_PUBLIC_KEY env variable."
echo "=========================================="
