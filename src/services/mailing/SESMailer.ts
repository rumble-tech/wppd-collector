import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import { createTransport, Transporter } from 'nodemailer';
import Logger from 'src/components/Logger';
import { MailingSESConfig } from 'src/config/Types';
import AbstractMailer from 'src/services/mailing/AbstractMailer';

export default class SESMailer extends AbstractMailer {
    private config: MailingSESConfig;

    constructor(logger: Logger, config: MailingSESConfig) {
        super(logger);
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
