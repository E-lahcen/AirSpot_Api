export class SendEmailDto {
  subject: string;
  html?: string;
  recipient: string;
  message: string;
}
