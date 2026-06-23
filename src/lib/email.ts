import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || '587');
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const emailFrom = process.env.EMAIL_FROM || 'no-reply@theatelier.com';

let transporterPromise: Promise<nodemailer.Transporter> | null = null;
let usingTestAccount = false;

async function getTransporter() {
  if (transporterPromise) {
    return transporterPromise;
  }

  transporterPromise = (async () => {
    if (smtpHost && smtpUser && smtpPass) {
      return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP configuration is required in production');
    }

    const testAccount = await nodemailer.createTestAccount();
    usingTestAccount = true;

    const transport = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.info('[email] No SMTP config found. Using Ethereal test email account.');
    return transport;
  })();

  return transporterPromise;
}

export async function sendOrderConfirmationEmail(options: EmailOptions) {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: emailFrom,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });

  if (usingTestAccount) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.info('[email] Preview URL:', previewUrl);
    }
  }
}
