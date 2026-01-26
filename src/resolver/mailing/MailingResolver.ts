import AbstractMailingProvider from 'src/resolver/mailing/providers/AbstractMailingProvider';

export default class MailingResolver {
    private readonly provider: AbstractMailingProvider;

    constructor(provider: AbstractMailingProvider) {
        this.provider = provider;
    }

    public async sendMail(from: string, to: string, subject: string, body: string): Promise<void> {
        if (!this.provider) {
            throw new Error('Mailing provider is not configured');
        }

        const transporter = this.provider.getTransporter();

        return new Promise((resolve, reject) => {
            transporter.sendMail({ from, to, subject, html: body }, (err) => {
                if (err) {
                    return reject(err);
                }

                resolve();
            });
        });
    }
}
