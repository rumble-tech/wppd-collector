import { SendMailOptions } from 'nodemailer';
import { MailProviderInterface } from 'src/services/mailing/MailProviderInterface';

export default class MailResolver {
    private provider: MailProviderInterface;

    constructor() {}

    public async setProvider(provider: MailProviderInterface): Promise<void> {
        this.provider = provider;
    }

    public async sendMail(from: string, to: string, subject: string, body: string): Promise<boolean> {
        const transporter = this.provider.getTransporter();

        const mailOptions: SendMailOptions = {
            from: from,
            to: to,
            subject,
            text: body,
        };

        return new Promise((resolve) =>
            transporter.sendMail(mailOptions, (error) => {
                if (error) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            })
        );
    }
}
