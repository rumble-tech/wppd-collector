import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import { createTransport, Transporter } from 'nodemailer';
import AbstractMailingProvider from 'src/resolver/mailing/providers/AbstractMailingProvider';
import { TMailingSESConfig } from 'src/services/config/Types';

export default class SESMailingProvider extends AbstractMailingProvider {
    private readonly config: TMailingSESConfig;

    constructor(config: TMailingSESConfig) {
        super();

        this.config = config;
    }

    public getTransporter(): Transporter {
        const sesClient = new SESv2Client({
            region: this.config.region,
            credentials: {
                accessKeyId: this.config.accessKeyId,
                secretAccessKey: this.config.accessKeySecret,
            },
        });

        return createTransport({
            SES: {
                sesClient,
                SendEmailCommand,
            },
        });
    }
}
