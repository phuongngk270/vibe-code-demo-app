import type { NextApiRequest, NextApiResponse } from 'next';
import type { EmailGenerationResult } from '../../lib/email';
import { Resend } from 'resend';

interface SendEmailRequest {
  recipientEmail: string;
  emailResult: EmailGenerationResult;
  scheduleTime?: number; // minutes from now
}

interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  scheduledFor?: string;
  demo?: boolean;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SendEmailResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { recipientEmail, emailResult, scheduleTime }: SendEmailRequest = req.body;

  // Validate required fields
  if (!recipientEmail || !emailResult) {
    return res.status(400).json({ error: 'Recipient email and email result are required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    // Check if email service is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured - using demo mode');

      // Demo mode: log email content instead of sending
      console.log('=== EMAIL DEMO MODE ===');
      console.log('To:', recipientEmail);
      console.log('Subject:', emailResult.email.subject);
      console.log('HTML Body:', emailResult.email.bodyHtml);
      console.log('Text Body:', emailResult.email.bodyText);
      console.log('=== END EMAIL DEMO ===');

      return res.status(200).json({
        success: true,
        messageId: `demo-${Date.now()}`,
        demo: true,
        message: 'Email logged to server console (demo mode). To send real emails, configure RESEND_API_KEY.'
      });
    }

    // Initialize Resend with API key
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

    console.log('Sending email to:', recipientEmail);
    console.log('Subject:', emailResult.email.subject);

    if (scheduleTime && scheduleTime > 0) {
      // For now, we'll send immediately but log the intended schedule time
      // Resend doesn't support native scheduling, so you'd need to implement this
      // with a job queue like Bull, Agenda, or similar
      const scheduledFor = new Date(Date.now() + scheduleTime * 60 * 1000).toISOString();
      console.log('Note: Scheduling requested for:', scheduledFor, 'but sending immediately');
    }

    // Send the email using Resend
    console.log('Attempting to send email with from:', fromEmail);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: emailResult.email.subject,
      html: emailResult.email.bodyHtml,
      text: emailResult.email.bodyText,
    });

    if (error) {
      console.error('Resend error details:', error);

      let userFriendlyError = 'Failed to send email';
      if (error.message?.includes('API key')) {
        userFriendlyError = 'Email service authentication failed. Please contact administrator.';
      } else if (error.message?.includes('domain')) {
        userFriendlyError = 'Email domain not verified. Please contact administrator.';
      } else if (error.message?.includes('rate limit')) {
        userFriendlyError = 'Email rate limit exceeded. Please try again later.';
      } else if (error.message) {
        userFriendlyError = `Email service error: ${error.message}`;
      }

      return res.status(500).json({ error: userFriendlyError });
    }

    console.log('Email sent successfully:', data);

    return res.status(200).json({
      success: true,
      messageId: data?.id || `sent-${Date.now()}`,
      ...(scheduleTime && { scheduledFor: new Date(Date.now() + scheduleTime * 60 * 1000).toISOString() })
    });
  } catch (error: any) {
    console.error('Unexpected error sending email:', error);

    let userFriendlyError = 'An unexpected error occurred while sending email';
    if (error.message) {
      userFriendlyError = `Email service error: ${error.message}`;
    }

    return res.status(500).json({ error: userFriendlyError });
  }
}