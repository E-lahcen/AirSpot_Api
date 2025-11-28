import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Invitation, InvitationType } from '../entities/invitation.entity';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Send invitation email
   */
  async sendInvitationEmail(
    invitation: Invitation,
    tenantName: string,
    inviterName: string,
  ): Promise<void> {
    const template = this.getTemplateForInvitationType(
      invitation.type,
      invitation,
      tenantName,
      inviterName,
    );

    // TODO: Integrate with actual email service (SendGrid, SES, Nodemailer, etc.)
    this.logger.log(
      `Sending ${invitation.type} invitation to ${invitation.email}`,
    );
    this.logger.debug(`Subject: ${template.subject}`);
    this.logger.debug(`Token: ${invitation.token}`);

    // Simulate email sending (replace with actual implementation)
    await this.sendEmail(invitation.email, template);
  }

  /**
   * Get email template based on invitation type
   */
  private getTemplateForInvitationType(
    type: InvitationType,
    invitation: Invitation,
    tenantName: string,
    inviterName: string,
  ): EmailTemplate {
    const baseUrl = this.configService.get<string>(
      'APP_URL',
      'http://localhost:3000',
    );
    const inviteLink = `${baseUrl}/invitations/accept?token=${invitation.token}`;

    switch (type) {
      case InvitationType.TENANT_REGISTRATION:
        return this.getTenantRegistrationTemplate(
          inviteLink,
          tenantName,
          inviterName,
          invitation.role,
        );

      case InvitationType.COLLABORATION:
        return this.getCollaborationTemplate(
          inviteLink,
          tenantName,
          inviterName,
          invitation.metadata,
        );

      case InvitationType.RESOURCE_ACCESS:
        return this.getResourceAccessTemplate(
          inviteLink,
          tenantName,
          inviterName,
          invitation.metadata,
        );

      default:
        return this.getGenericTemplate(
          inviteLink,
          tenantName,
          inviterName,
          type,
        );
    }
  }

  /**
   * Tenant registration invitation template
   */
  private getTenantRegistrationTemplate(
    inviteLink: string,
    tenantName: string,
    inviterName: string,
    role: string,
  ): EmailTemplate {
    return {
      subject: `You're invited to join ${tenantName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .button { background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }
              .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>🎉 You've been invited!</h2>
              <p>Hi there,</p>
              <p><strong>${inviterName}</strong> has invited you to join <strong>${tenantName}</strong> as a <strong>${role}</strong>.</p>
              <p>Click the button below to accept the invitation and create your account:</p>
              <a href="${inviteLink}" class="button">Accept Invitation</a>
              <p>Or copy and paste this link into your browser:</p>
              <p><a href="${inviteLink}">${inviteLink}</a></p>
              <p>This invitation will expire in 7 days.</p>
              <div class="footer">
                <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
You've been invited!

${inviterName} has invited you to join ${tenantName} as a ${role}.

Click the link below to accept the invitation and create your account:
${inviteLink}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.
      `,
    };
  }

  /**
   * Collaboration invitation template
   */
  private getCollaborationTemplate(
    inviteLink: string,
    tenantName: string,
    inviterName: string,
    metadata: Record<string, any>,
  ): EmailTemplate {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const projectName = metadata?.projectName || 'a project';

    return {
      subject: `Collaborate on ${projectName} at ${tenantName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>🤝 Collaboration Invitation</h2>
              <p><strong>${inviterName}</strong> has invited you to collaborate on <strong>${projectName}</strong>.</p>
              <p><a href="${inviteLink}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">Join Collaboration</a></p>
              <p>Link: ${inviteLink}</p>
            </div>
          </body>
        </html>
      `,
      text: `${inviterName} has invited you to collaborate on ${projectName}.\n\nJoin here: ${inviteLink}`,
    };
  }

  /**
   * Resource access invitation template
   */
  private getResourceAccessTemplate(
    inviteLink: string,
    tenantName: string,
    inviterName: string,
    metadata: Record<string, any>,
  ): EmailTemplate {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const resourceName = metadata?.resourceName || 'a resource';

    return {
      subject: `Access granted to ${resourceName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>🔑 Resource Access Granted</h2>
              <p><strong>${inviterName}</strong> has granted you access to <strong>${resourceName}</strong>.</p>
              <p><a href="${inviteLink}" style="background-color: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">Access Resource</a></p>
            </div>
          </body>
        </html>
      `,
      text: `${inviterName} has granted you access to ${resourceName}.\n\nAccess here: ${inviteLink}`,
    };
  }

  /**
   * Generic invitation template (fallback)
   */
  private getGenericTemplate(
    inviteLink: string,
    tenantName: string,
    inviterName: string,
    type: InvitationType,
  ): EmailTemplate {
    console.warn(`Using generic template for invitation type: ${type}`);
    return {
      subject: `Invitation from ${tenantName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>📩 You've been invited</h2>
              <p><strong>${inviterName}</strong> has sent you an invitation.</p>
              <p><a href="${inviteLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">View Invitation</a></p>
            </div>
          </body>
        </html>
      `,
      text: `${inviterName} has sent you an invitation.\n\nView here: ${inviteLink}`,
    };
  }

  /**
   * Send email (implement with your email provider)
   */
  private async sendEmail(to: string, template: EmailTemplate): Promise<void> {
    // TODO: Implement actual email sending logic
    // Examples:
    // - SendGrid: await this.sendgridService.send({...})
    // - AWS SES: await this.sesService.sendEmail({...})
    // - Nodemailer: await this.transporter.sendMail({...})

    this.logger.log(`📧 Email would be sent to: ${to}`);
    this.logger.debug(`Subject: ${template.subject}`);

    // For now, just log (replace with actual implementation)
    return Promise.resolve();
  }
}
