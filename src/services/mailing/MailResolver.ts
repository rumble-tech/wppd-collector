import { SendMailOptions } from 'nodemailer';
import { MailProviderInterface } from 'src/services/mailing/MailProviderInterface';

export default class MailResolver {
    private provider: MailProviderInterface;

    constructor() {}

    public async setProvider(provider: MailProviderInterface): Promise<void> {
        this.provider = provider;
    }

    public async sendMail(from: string, to: string, subject: string, body: string): Promise<void> {
        const transporter = this.provider.getTransporter();

        const mailOptions: SendMailOptions = {
            from: from,
            to: to,
            subject,
            html: body,
        };

        return new Promise((resolve, reject) =>
            transporter.sendMail(mailOptions, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            })
        );
    }
}
