export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
  },
  sentry: {
    dsn: process.env.SENTRY_DSN,
  },
});
