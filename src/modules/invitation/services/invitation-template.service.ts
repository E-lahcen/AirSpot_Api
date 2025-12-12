import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Invitation, InvitationType } from '../entities/invitation.entity';
import { SendEmailDto } from '@app/modules/notification/dtos/send-email.dto';

@Injectable()
export class InvitationTemplateService {
  constructor(private readonly configService: ConfigService) {}

  generateInvitationEmail(invitation: Invitation): SendEmailDto {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'https://app-v3.myairspot-staging.com';
    const acceptUrl = `${frontendUrl}/accept-invitation?token=${invitation.token}&slug=${invitation.tenant_slug}&type=${invitation.type}`;

    switch (invitation.type) {
      case InvitationType.TENANT_REGISTRATION:
        return this.generateTenantRegistrationEmail(invitation, acceptUrl);

      case InvitationType.COLLABORATION:
        return this.generateCollaborationEmail(invitation, acceptUrl);

      case InvitationType.ROLE_ASSIGNMENT:
        return this.generateRoleAssignmentEmail(invitation, acceptUrl);

      default:
        return this.generateDefaultEmail(invitation, acceptUrl);
    }
  }

  private generateTenantRegistrationEmail(
    invitation: Invitation,
    acceptUrl: string,
  ): SendEmailDto {
    const invitorName = invitation.invitor
      ? invitation.invitor.full_name || invitation.invitor.email
      : 'A team member';
    const companyName =
      (invitation.metadata?.company_name as string) || 'the team';
    const roleName = invitation.role?.name || 'member';

    return {
      recipient: invitation.email,
      subject: `You're invited to join ${companyName}! 🎉`,
      message: `You have been invited to join ${companyName} as a ${roleName}.`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Join ${companyName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                You're Invited! 🎉
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi there!
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                <strong>${invitorName}</strong> has invited you to join <strong>${companyName}</strong> as a <strong>${roleName}</strong>.
              </p>
              
              <p style="margin: 0 0 30px; color: #666666; font-size: 14px; line-height: 1.6;">
                Click the button below to accept your invitation and create your account. This invitation will expire on <strong>${new Date(invitation.expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${acceptUrl}" 
                       style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #999999; font-size: 13px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0; color: #667eea; font-size: 12px; word-break: break-all; line-height: 1.6;">
                ${acceptUrl}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                Questions? Contact us at support@yourcompany.com
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} ${companyName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    };
  }

  private generateCollaborationEmail(
    invitation: Invitation,
    acceptUrl: string,
  ): SendEmailDto {
    const invitorName = invitation.invitor
      ? invitation.invitor.full_name || invitation.invitor.email
      : 'A team member';
    const projectName =
      (invitation.metadata?.project_name as string) || 'a project';

    return {
      recipient: invitation.email,
      subject: `You've been added to ${projectName}`,
      message: `You have been invited to collaborate on ${projectName}.`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Collaboration Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                Collaboration Invite 🤝
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi there!
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                <strong>${invitorName}</strong> has invited you to collaborate on <strong>${projectName}</strong>.
              </p>
              
              <p style="margin: 0 0 30px; color: #666666; font-size: 14px; line-height: 1.6;">
                Accept the invitation to start working together. This invitation expires on <strong>${new Date(invitation.expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${acceptUrl}" 
                       style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);">
                      Accept & Collaborate
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #999999; font-size: 13px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0; color: #4facfe; font-size: 12px; word-break: break-all; line-height: 1.6;">
                ${acceptUrl}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    };
  }

  private generateRoleAssignmentEmail(
    invitation: Invitation,
    acceptUrl: string,
  ): SendEmailDto {
    const invitorName = invitation.invitor
      ? invitation.invitor.full_name || invitation.invitor.email
      : 'An administrator';
    const newRole = invitation.role?.name || 'a new role';

    return {
      recipient: invitation.email,
      subject: `Your role has been updated to ${newRole}`,
      message: `Your role has been updated to ${newRole}.`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Role Assignment</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                Role Update 👑
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi there!
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                <strong>${invitorName}</strong> has updated your role to <strong>${newRole}</strong>.
              </p>
              
              <p style="margin: 0 0 30px; color: #666666; font-size: 14px; line-height: 1.6;">
                Click the button below to accept this role change and continue. This invitation expires on <strong>${new Date(invitation.expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${acceptUrl}" 
                       style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(240, 147, 251, 0.4);">
                      Accept Role Change
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #999999; font-size: 13px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0; color: #f093fb; font-size: 12px; word-break: break-all; line-height: 1.6;">
                ${acceptUrl}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    };
  }

  private generateDefaultEmail(
    invitation: Invitation,
    acceptUrl: string,
  ): SendEmailDto {
    const invitorName = invitation.invitor
      ? invitation.invitor.full_name || invitation.invitor.email
      : 'Someone';

    return {
      recipient: invitation.email,
      subject: 'You have a new invitation',
      message: `You have received a new invitation.`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                You're Invited! ✨
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi there!
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                <strong>${invitorName}</strong> has sent you an invitation.
              </p>
              
              <p style="margin: 0 0 30px; color: #666666; font-size: 14px; line-height: 1.6;">
                Click the button below to accept. This invitation expires on <strong>${new Date(invitation.expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${acceptUrl}" 
                       style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #999999; font-size: 13px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0; color: #667eea; font-size: 12px; word-break: break-all; line-height: 1.6;">
                ${acceptUrl}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    };
  }
}
