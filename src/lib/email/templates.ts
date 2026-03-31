interface OfficeInfo {
  name: string;
  email: string;
  office_number: string;
}

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #00213B; padding: 24px 32px; }
    .header h1 { color: #ffffff; font-size: 18px; margin: 0; }
    .body { padding: 32px; }
    .footer { background: #f1f5f9; padding: 16px 32px; text-align: center; }
    .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
    .btn { display: inline-block; background: #E31B23; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; }
    .urgent { border-left: 4px solid #E31B23; padding-left: 16px; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Daniel Ahart Tax Services</h1>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Daniel Ahart Tax Services. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

export function reminderFirstEmail(office: OfficeInfo) {
  const subject = `Monthly Revenue Report Due — ${office.name}`;
  const html = baseTemplate(`
    <h2 style="color: #00213B; margin-top: 0;">Monthly Report Reminder</h2>
    <p>Hello <strong>${office.name}</strong>,</p>
    <p>This is a friendly reminder that your monthly revenue report is due by the <strong>5th of this month</strong>.</p>
    <p>Please log in to the Franchisee Portal and submit your report at your earliest convenience.</p>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/office/dashboard" class="btn">Submit Report</a>
    </p>
    <p style="color: #64748b; font-size: 14px;">If you have already submitted your report, please disregard this email.</p>
  `);
  return { subject, html, to: office.email };
}

export function reminderFinalEmail(office: OfficeInfo) {
  const subject = `URGENT: Revenue Report Overdue — ${office.name}`;
  const html = baseTemplate(`
    <h2 style="color: #E31B23; margin-top: 0;">Urgent: Report Overdue</h2>
    <p>Hello <strong>${office.name}</strong>,</p>
    <div class="urgent">
      <p><strong>Your monthly revenue report has not been submitted.</strong> The deadline was the 5th of this month.</p>
    </div>
    <p>Please submit your report immediately to avoid any penalties or service disruptions.</p>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/office/dashboard" class="btn">Submit Report Now</a>
    </p>
    <p style="color: #64748b; font-size: 14px;">If you need assistance, please contact the corporate team.</p>
  `);
  return { subject, html, to: office.email };
}

interface ReportInfo {
  report_month: string;
  total_gross: number;
  total_fees_due: number;
}

export function adminNotificationEmail(
  report: ReportInfo,
  office: OfficeInfo,
  adminEmail: string
) {
  const date = new Date(report.report_month + "T00:00:00");
  const monthLabel = date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const subject = `Report Submitted: ${office.name} — ${monthLabel}`;
  const html = baseTemplate(`
    <h2 style="color: #00213B; margin-top: 0;">New Report Submission</h2>
    <p><strong>${office.name}</strong> (Franchisee #${office.office_number}) has submitted their monthly revenue report for <strong>${monthLabel}</strong>.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Total Gross Revenue</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">$${report.total_gross.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Total Fees Due</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">$${report.total_fees_due.toFixed(2)}</td>
      </tr>
    </table>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/admin/dashboard" class="btn">View in Admin Portal</a>
    </p>
  `);
  return { subject, html, to: adminEmail };
}
