// Basic Merchant — Pi Merchant Framework Integration Demo
// Run: node src/app.js

const { verifyPaymentSignature } = require("@pi-merchant/pi-sdk");
const crypto = require("crypto");

// ─── Configuration ────────────────────────────────────────
const SECRET = process.env.PI_SESSION_SECRET || "demo-secret-change-me";

// ─── Demo: Verify a Pi Payment Webhook ───────────────────
function demoPaymentVerification() {
  console.log("=== Pi Payment Verification Demo ===\n");

  // Simulated webhook payload (from Pi Network)
  const payload = {
    txid: "demo-tx-001",
    amount: 3.14,
    memo: "Premium Subscription - Monthly",
    from: "GDEMO123456",
    to: "GMERCHANT789",
    timestamp: Date.now(),
  };

  // Simulated signature (in production, from Pi webhook header)
  const payloadStr = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(payloadStr)
    .digest("hex");

  // Verify signature
  const isValid = verifyPaymentSignature(payload, signature, SECRET);

  console.log("Payload:", JSON.stringify(payload, null, 2));
  console.log("Signature:", signature.slice(0, 16) + "...");
  console.log("Valid:", isValid ? "✅ PASS" : "❌ FAIL");

  // Test with tampered payload
  const tamperedPayload = { ...payload, amount: 999 };
  const isValidTampered = verifyPaymentSignature(
    tamperedPayload,
    signature,
    SECRET
  );

  console.log("Tampered Valid:", isValidTampered ? "❌ FAIL" : "✅ REJECTED");
  console.log("\n=== Demo Complete ===");
}

demoPaymentVerification();
