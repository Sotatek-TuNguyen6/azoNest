import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: 'MAIL_TRANSPORTER',
            useFactory: (configService: ConfigService) => {
                return nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: configService.get('MAIL_USER'),
                        pass: configService.get('MAIL_PASSWORD'),
                    },
                });
            },
            inject: [ConfigService],
        },
        MailService,
    ],
    exports: [MailService],
})
export class MailModule { }
