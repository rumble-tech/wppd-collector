import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import { createTransport, Transporter } from 'nodemailer';
import { MailingSESConfig } from 'src/config/Types';
import { MailProviderInterface } from 'src/services/mailing/MailProviderInterface';

export default class SESMailProvider implements MailProviderInterface {
    private config: MailingSESConfig;

    constructor(config: MailingSESConfig) {
        this.config = config;
    }

    public getTransporter(): Transporter {
        const sesClient = new SESv2Client({
            region: this.config.region,
            credentials: {
                accessKeyId: this.config.accessKeyId,
                secretAccessKey: this.config.secretAccessKey,
            },
        });

        return createTransport({
            SES: { sesClient, SendEmailCommand },
        });
    }
}
