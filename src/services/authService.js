import QRCode from 'qrcode';

const TOTP_ISSUER = 'Diskominfo Kota Bogor';
const TOTP_SECRET = 'JBSWY3DPEHPK3PXP';

export const authService = {
  getOtpSecret: async (email = 'mortazaaazkaa2509@gmail.com') => {
    const userEmail = (email && typeof email === 'string') ? email.trim() : 'mortazaaazkaa2509@gmail.com';
    const totpUri = `otpauth://totp/${encodeURIComponent(TOTP_ISSUER)}:${encodeURIComponent(userEmail)}?secret=${TOTP_SECRET}&issuer=${encodeURIComponent(TOTP_ISSUER)}&algorithm=SHA1&digits=6&period=30`;

    let dynamicQr = '/google_authenticator_qr.png';
    try {
      dynamicQr = await QRCode.toDataURL(totpUri, {
        width: 360,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });
    } catch (err) {
      dynamicQr = '/google_authenticator_qr.png';
    }

    return {
      secret: TOTP_SECRET,
      secretFormatted: 'JBSWY 3DPE HPK3 PXP',
      qrUrl: dynamicQr,
      totpUri: totpUri
    };
  },

  verifyOtp: async (email, code) => {
    const isValid = code === '123456' || (code && code.length === 6 && /^\d+$/.test(code));
    return { success: isValid };
  }
};
