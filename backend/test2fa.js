const { generateSync } = require('otplib');

async function runTest() {
  const BASE_URL = 'http://localhost:5000/api';
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'password123';

  console.log(`[1] Registering dummy user: ${email}...`);
  let res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fullName: 'Test User', phone: '08123456789' })
  });
  let data = await res.json();
  if (!data.success) throw new Error('Registration failed');

  console.log(`[2] Logging in to get token...`);
  res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  data = await res.json();
  const token = data.token;

  console.log(`[3] Generating 2FA QR & Secret...`);
  res = await fetch(`${BASE_URL}/auth/2fa/generate`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  data = await res.json();
  const secret = data.secret;
  
  if (!secret) {
    console.error(data);
    throw new Error('Failed to generate 2FA');
  }

  console.log(`[4] Verifying 2FA Setup with correct OTP...`);
  const correctSetupOtp = generateSync({ strategy: 'totp', secret });
  res = await fetch(`${BASE_URL}/auth/2fa/verify-setup`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({ otp: correctSetupOtp })
  });
  data = await res.json();
  if (!data.success) throw new Error('Verification setup failed');
  const backupCodes = data.backupCodes;
  console.log('-> Backup codes generated:', backupCodes);

  console.log(`[5] Trying to re-generate QR Code (Should Fail)...`);
  res = await fetch(`${BASE_URL}/auth/2fa/generate`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  data = await res.json();
  if (data.success) throw new Error('BUG: Was able to generate QR again after it was enabled!');
  console.log('-> Success: Server rejected QR generation (2FA already enabled).');

  console.log(`[6] Logging in again... expecting tempToken`);
  res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  data = await res.json();
  if (!data.requires2FA) throw new Error('Did not receive requires2FA flag');
  const tempToken = data.tempToken;

  console.log(`[7] Testing /auth/login-2fa with RANDOM OTP (111111)...`);
  res = await fetch(`${BASE_URL}/auth/login-2fa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tempToken, otp: '111111' })
  });
  data = await res.json();
  if (res.status !== 401 || data.success) {
    throw new Error('BUG: Random OTP was accepted!');
  }
  console.log('-> Success: Random OTP rejected with 401.');

  console.log(`[8] Testing /auth/login-2fa with CORRECT OTP...`);
  const correctLoginOtp = generateSync({ strategy: 'totp', secret });
  res = await fetch(`${BASE_URL}/auth/login-2fa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tempToken, otp: correctLoginOtp })
  });
  data = await res.json();
  if (!data.success || !data.token) {
    console.error(data);
    throw new Error('BUG: Correct OTP was rejected!');
  }
  console.log('-> Success: Correct OTP accepted. Received JWT token.');

  console.log(`[9] Testing /auth/login-2fa with BACKUP CODE...`);
  const backupCode = backupCodes[0];
  res = await fetch(`${BASE_URL}/auth/login-2fa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tempToken, otp: backupCode })
  });
  data = await res.json();
  if (!data.success || !data.token) {
    console.error(data);
    throw new Error('BUG: Backup Code was rejected!');
  }
  console.log('-> Success: Backup Code accepted.');

  console.log('====================================');
  console.log('ALL TESTS PASSED: OTP validation is fully secure.');
}

runTest().catch(console.error);
