import { sendEmail } from '../utils/mailer.js';

export const sendDeadlineReminderEmail = async (
  learnerEmail: string,
  learnerName: string,
  assignmentTitle: string,
  courseTitle: string,
  dueDate: string,
  assignmentId: string
) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:8081';
  const actionLink = `${clientUrl}`;

  const subject = `⏰ Deadline Reminder: "${assignmentTitle}" is due soon!`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Assignment Deadline Reminder</title>
    </head>
    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FAF2EB; margin: 0; padding: 20px; color: #2B211E;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #E5D5C5; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <!-- Header -->
        <tr>
          <td style="background-color: #8B331A; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: -0.5px;">🎓 SkillConnect</h1>
            <p style="color: #E07A5F; margin: 4px 0 0 0; font-size: 14px; font-weight: bold;">Assignment Deadline Reminder</p>
          </td>
        </tr>
        
        <!-- Content -->
        <tr>
          <td style="padding: 32px 24px;">
            <p style="font-size: 16px; line-height: 24px; margin-top: 0;">Hi <strong>${learnerName}</strong>,</p>
            <p style="font-size: 15px; line-height: 22px; color: #555555;">
              This is a friendly reminder that your assignment for <strong>${courseTitle}</strong> is approaching its deadline. Don't miss out on completing your coursework!
            </p>

            <!-- Assignment Box -->
            <div style="background-color: #FAF2EB; border-left: 4px solid #D95D39; padding: 18px; margin: 20px 0; border-radius: 8px;">
              <h3 style="margin: 0 0 6px 0; color: #8B331A; font-size: 18px;">📝 ${assignmentTitle}</h3>
              <p style="margin: 0; font-size: 14px; color: #D95D39; font-weight: bold;">
                ⏳ Due Date: ${dueDate}
              </p>
            </div>

            <p style="font-size: 14px; color: #666666; margin-bottom: 24px;">
              Submitting your assignment on time ensures your instructor can grade your submission and award your course certificate!
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${actionLink}" style="background-color: #8B331A; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 12px; font-size: 15px; display: inline-block;">
                Submit Assignment Now →
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: #FAF2EB; padding: 16px; text-align: center; border-top: 1px solid #E5D5C5;">
            <p style="font-size: 12px; color: #888888; margin: 0;">
              Sent to <strong>${learnerEmail}</strong> by SkillConnect Learning Platform.<br>
              Stay on track with your learning goals!
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({ to: learnerEmail, subject, html });
};
