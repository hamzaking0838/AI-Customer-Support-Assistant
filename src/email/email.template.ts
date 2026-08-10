export function getSupportEmailHtml(customerName: string, originalMessage: string, aiResponse: string): string {
  // We'll design a modern, sleek premium customer support email template
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Customer Support Reply</title>
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
            border: 1px solid #e2e8f0;
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
            color: #ffffff;
            padding: 32px 24px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.025em;
          }
          .header p {
            margin: 8px 0 0 0;
            font-size: 14px;
            color: #e0e7ff;
          }
          .content {
            padding: 32px 24px;
          }
          .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #0f172a;
          }
          .card {
            background-color: #f1f5f9;
            border-left: 4px solid #94a3b8;
            padding: 16px;
            border-radius: 0 8px 8px 0;
            margin: 24px 0;
          }
          .card-title {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            margin-bottom: 8px;
          }
          .card-content {
            font-size: 14px;
            line-height: 1.6;
            color: #334155;
            white-space: pre-wrap;
          }
          .response-card {
            border-left-color: #4f46e5;
            background-color: #e0e7ff;
            color: #1e1b4b;
          }
          .response-card .card-title {
            color: #4f46e5;
          }
          .footer {
            background-color: #f8fafc;
            padding: 24px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 12px;
            color: #64748b;
          }
          .footer p {
            margin: 4px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Support Assistant</h1>
            <p>We're here to help you</p>
          </div>
          <div class="content">
            <div class="greeting">Hello ${customerName},</div>
            <p>Thank you for reaching out to our support team. Here is the response to your inquiry:</p>
            
            <div class="card">
              <div class="card-title">Your Message</div>
              <div class="card-content">${originalMessage}</div>
            </div>

            <div class="card response-card">
              <div class="card-title">Our Response</div>
              <div class="card-content">${aiResponse}</div>
            </div>

            <p style="margin-top: 24px; font-size: 14px; line-height: 1.6; color: #475569;">
              If you have any further questions or if this response did not fully address your request, please reply directly to this email or submit a new inquiry.
            </p>
          </div>
          <div class="footer">
            <p>This is an automated support response powered by AI.</p>
            <p>&copy; ${new Date().getFullYear()} Customer Support Assistant. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
