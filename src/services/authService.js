/**
 * Layanan Autentikasi 2FA (Google Authenticator)
 * File service ini dirancang modular dan siap dihubungkan langsung ke API backend.
 */

const TOTP_ISSUER = 'SPBE%20Diskominfo%20Kota%20Bogor';
const TOTP_SECRET = 'JBSWY3DPEHPK3PXP';

const buildQrUrl = (email) => {
  const encoded = encodeURIComponent(email);
  const label = `SPBE%20Diskominfo%3A${encoded}`;
  const params = `secret%3D${TOTP_SECRET}%26issuer%3D${TOTP_ISSUER}`;
  return `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=otpauth%3A%2F%2Ftotp%2F${label}%3F${params}`;
};

export const authService = {
  /**
   * Mengambil QR Code URL & Secret Key untuk pendaftaran Google Authenticator
   * Siap dihubungkan ke: GET /api/auth/2fa/setup?email=...
   */
  getOtpSecret: async (email) => {
    // Saat backend siap, ganti dengan:
    // const response = await fetch(`/api/auth/2fa/setup?email=${encodeURIComponent(email)}`);
    // return await response.json();

    return {
      secret: TOTP_SECRET,
      secretFormatted: 'JBSWY 3DPE HPK3 PXP',
      qrUrl: buildQrUrl(email || 'user@example.com'),
    };
  },

  /**
   * Memvalidasi kode 6-digit TOTP dari Google Authenticator
   * Siap dihubungkan ke: POST /api/auth/2fa/verify
   */
  verifyOtp: async (email, code) => {
    // Saat backend siap, ganti dengan:
    // const response = await fetch('/api/auth/2fa/verify', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, code })
    // });
    // return await response.json();

    const isValid = code === '123456' || (code && code.length === 6 && /^\d+$/.test(code));
    return { success: isValid };
  },
};
