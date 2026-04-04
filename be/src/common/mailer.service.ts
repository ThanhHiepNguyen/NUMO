import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
    private readonly logger = new Logger(MailerService.name);
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    async sendOtpEmail(toEmail: string, otp: string): Promise<boolean> {
        try {
            const mailOptions = {
                from: `"NUMO Support" <${process.env.EMAIL_USER}>`,
                to: toEmail,
                subject: 'Mã OTP xác thực đăng ký tài khoản',
                html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Mã OTP của bạn</h2>
            <p>Mã OTP để xác thực đăng ký là:</p>
            <h1 style="letter-spacing: 4px;">${otp}</h1>
            <p>Mã có hiệu lực trong 5 phút.</p>
          </div>
        `,
            };
            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            this.logger.error('Failed to send OTP email', error as any);
            return false;
        }
    }
}

