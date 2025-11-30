import { Injectable } from "@nestjs/common";
import { SendEmailDto } from "../dtos/send-email.dto";
import * as nodemailer from "nodemailer";
import { ConfigService } from "@nestjs/config";
import { EnvironmentVariables } from "@app/core/validators";

@Injectable()
export class EmailService {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  send(sendEmailDto: SendEmailDto): Promise<nodemailer.SentMessageInfo> {
    const transporter: nodemailer.Transporter = nodemailer.createTransport({
      host: this.configService.get<string>("SMTP_HOST"),
      port: this.configService.get<number>("SMTP_PORT"),
      secure: true, // use TLS
      auth: {
        user: this.configService.get<string>("SMTP_USER"),
        pass: this.configService.get<string>("SMTP_PASS"),
      },
    });

    const mailOptions: nodemailer.SendMailOptions = {
      from: this.configService.get<string>("SMTP_FROM"),
      to: sendEmailDto.recipient,
      subject: sendEmailDto.subject,
      text: sendEmailDto.message,
      html: sendEmailDto.html,
    };

    return transporter.sendMail(mailOptions);
  }
}
