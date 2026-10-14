const nodemailer = require('nodemailer');
const path = require('path');
const dotenv = require('dotenv');

const createTransporter = () => {
  // Muat ulang .env secara dinamis agar perubahan konfigurasi langsung terbaca
  dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

  const user = process.env.SMTP_USER || 'adrianmaull16@gmail.com';
  const pass = process.env.SMTP_PASS || 'dfodkpyxvyscmvjd';

  if (!pass) {
    return null;
  }

  // Gunakan service: 'gmail' agar Nodemailer mengonfigurasi host, TLS, dan connection pool resmi Gmail
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass
    }
  });
};

const sendResetOtpEmail = async ({ to, name, otp }) => {
  dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

  const senderEmail = process.env.SMTP_USER || 'adrianmaull16@gmail.com';
  const senderName = process.env.SMTP_FROM || `"Adrian Maulana" <${senderEmail}>`;

  const textContent = `Halo ${name || 'Pengguna'},

Kode verifikasi akun Anda adalah: ${otp}

Kode ini berlaku selama 10 menit untuk verifikasi pengaturan ulang kata sandi akun Layanan Kominfo Anda.
Jangan berikan kode ini kepada siapa pun demi keamanan akun Anda.

Jika Anda tidak merasa melakukan permintaan ini, silakan abaikan email ini.

Salam,
Layanan Kominfo`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Kode Verifikasi</title>
    </head>
    <body style="margin: 0; padding: 24px 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
        <tr>
          <td style="background-color: #0284c7; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 0.5px;">Layanan Kominfo</h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #e0f2fe;">Verifikasi Keamanan Akun</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 32px 28px;">
            <p style="margin: 0 0 16px 0; font-size: 15px; color: #1e293b; font-weight: 600;">
              Halo, ${name || 'Pengguna'},
            </p>
            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
              Berikut adalah kode verifikasi Anda untuk melanjutkan proses pengaturan ulang kata sandi:
            </p>
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0f9ff; border: 2px dashed #0284c7; border-radius: 10px; margin: 20px 0;">
              <tr>
                <td style="padding: 20px; text-align: center;">
                  <div style="font-size: 11px; font-weight: bold; color: #0369a1; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">KODE VERIFIKASI</div>
                  <div style="font-family: Consolas, 'Courier New', monospace; font-size: 38px; font-weight: bold; color: #0284c7; letter-spacing: 8px;">${otp}</div>
                  <div style="font-size: 12px; color: #64748b; margin-top: 8px;">Berlaku selama 10 menit</div>
                </td>
              </tr>
            </table>
            <p style="margin: 20px 0 0 0; font-size: 13px; line-height: 1.6; color: #64748b;">
              Demi keamanan, jangan pernah membagikan kode ini kepada siapa pun. Jika Anda tidak merasa melakukan permintaan ini, akun Anda tetap aman dan Anda dapat mengabaikan email ini.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color: #f8fafc; padding: 18px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            Pemberitahuan Otomatis &bull; Mohon tidak membalas email ini langsung.
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Log ke konsol untuk inspeksi developer
  console.log('====================================================');
  console.log(`[EMAIL OTP RESET PASSWORD]`);
  console.log(`Tujuan    : ${to}`);
  console.log(`Pengguna  : ${name || 'User'}`);
  console.log(`Kode OTP  : ${otp}`);
  console.log(`Pengirim  : ${senderName}`);
  console.log('====================================================');

  const transporter = createTransporter();

  if (!transporter) {
    console.log('[EMAIL INFO]: SMTP_PASS belum diisi di backend/.env. Menggunakan logging konsol untuk pengujian.');
    return {
      success: true,
      delivered: false,
      message: 'OTP berhasil dibuat (Mode Pengujian: cek konsol server untuk kode OTP).'
    };
  }

  try {
    const info = await transporter.sendMail({
      from: senderName,
      to: to,
      replyTo: senderEmail,
      subject: `Kode verifikasi akun Anda: ${otp}`,
      text: textContent,
      html: htmlContent
    });
    console.log(`[EMAIL SENT]: Berhasil terkirim ke ${to}. MessageId: ${info.messageId}`);
    return { success: true, delivered: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL ERROR]: Gagal mengirim email via SMTP:', error.message);
    return {
      success: true,
      delivered: false,
      error: error.message,
      message: 'OTP dibuat (Cek konsol server jika SMTP mengalami kendala koneksi).'
    };
  }
};

module.exports = {
  sendResetOtpEmail
};
