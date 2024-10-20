import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private logger = new Logger()
    constructor(@Inject('MAIL_TRANSPORTER') private readonly transporter: nodemailer.Transporter, // Inject transporter
    ) { }

    /**
     * Gửi email
     * @param {object} mailOptions - Các tùy chọn email (to, subject, html)
     */
    async sendMail(mailOptions: { to: string; subject: string; html: string }): Promise<void> {
        try {
            const mailDetails = {
                from: process.env.MAIL_FROM || 'no-reply@example.com',
                to: mailOptions.to,
                subject: mailOptions.subject,
                html: mailOptions.html,
            };

            await this.transporter.sendMail(mailDetails);
            this.logger.log(`Email sent to ${mailOptions.to}`)
        } catch (error) {
            this.logger.error('Error sending email:', error);
            throw new InternalServerErrorException('Failed to send email');
        }
    }
}
