import nodemailer from 'nodemailer';
import type { TenantConfig } from '$lib/types/index.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  attachments?: { filename: string; content: Buffer }[];
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('[email] SMTP not configured, skipping email send to:', options.to);
    console.log('[email] Subject:', options.subject);
    return false;
  }

  try {
    await transporter.sendMail({
      from: options.from || process.env.SMTP_FROM || `"Smart Quote Pro" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: 'application/pdf',
      })),
    });
    console.log('[email] Sent to:', options.to);
    return true;
  } catch (err) {
    console.error('[email] Failed to send:', err);
    return false;
  }
}

export function buildQuoteEmail(firstName: string, total: number, submissionId: string, tenant: TenantConfig): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: ${tenant.primary_color};">${tenant.company_name}</h2>
      <h3>Your Interior Painting Estimate</h3>
      <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <div style="font-size: 14px; color: #6b7280;">Estimated Total</div>
        <div style="font-size: 32px; font-weight: bold; color: #111827;">$${total.toLocaleString()}</div>
      </div>
      <p style="color: #374151;">Hi ${firstName},</p>
      <p style="color: #374151;">Thank you for using our online quote tool! Your estimate is attached as a PDF.</p>
      <p style="color: #374151;">This is a conditional quote based on the information you provided. Final pricing will be confirmed after a brief pre-project review.</p>
      <p style="color: #374151;">Questions? Reply to this email or call us at ${tenant.contact_phone || 'the number on our website'}.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #9ca3af;">
        Reference: ${submissionId.slice(0, 8).toUpperCase()} | ${tenant.company_name}${tenant.contact_phone ? ` | ${tenant.contact_phone}` : ''}
      </p>
    </div>
  `;
}

export function buildMagicLinkEmail(firstName: string, loginUrl: string, brandName?: string, brandColor?: string): string {
  const name = brandName || 'Smart Quote Pro';
  const color = brandColor || '#2563eb';
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: ${color};">${name}</h2>
      <p>Hi ${firstName},</p>
      <p>Click the link below to sign in to your account:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" style="background: ${color}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Sign In
        </a>
      </div>
      <p style="font-size: 13px; color: #6b7280;">This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #9ca3af;">${name}</p>
    </div>
  `;
}

export function buildStatusUpdateEmail(firstName: string, stageName: string, tenant: TenantConfig, portalUrl: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: ${tenant.primary_color};">${tenant.company_name}</h2>
      <p>Hi ${firstName},</p>
      <p>Your project status has been updated to: <strong>${stageName}</strong></p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${portalUrl}" style="background: ${tenant.primary_color}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          View Your Project
        </a>
      </div>
      <p style="font-size: 13px; color: #6b7280;">Questions? Reply to this email or contact us.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #9ca3af;">${tenant.company_name}${tenant.contact_phone ? ` | ${tenant.contact_phone}` : ''}</p>
    </div>
  `;
}

export function buildWelcomeEmail(companyName: string, loginUrl: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2563eb;">Welcome to Smart Quote Pro!</h2>
      <p>Hi there,</p>
      <p>Your account for <strong>${companyName}</strong> has been created. Here's what to do next:</p>
      <ol style="color: #374151;">
        <li>Complete your company profile</li>
        <li>Customize your branding colors</li>
        <li>Set your pricing catalog</li>
        <li>Get your embed code and add it to your website</li>
      </ol>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Go to Dashboard
        </a>
      </div>
      <p style="font-size: 12px; color: #9ca3af;">Smart Quote Pro | Self-service quoting for painting contractors</p>
    </div>
  `;
}
