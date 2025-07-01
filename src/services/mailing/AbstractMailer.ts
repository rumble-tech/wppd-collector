import { SendMailOptions, Transporter } from 'nodemailer';
import Logger from 'src/components/Logger';

interface MailerInterface {
    sendMail(from: string, to: string, subject: string, body: string): Promise<boolean>;
}

export default abstract class AbstractMailer implements MailerInterface {
    protected logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    public async sendMail(from: string, to: string, subject: string, body: string): Promise<boolean> {
        const transporter = this.getTransporter();

        const mailOptions: SendMailOptions = {
            from: from,
            to: to,
            subject,
            text: body,
        };

        return new Promise((resolve) =>
            transporter.sendMail(mailOptions, (error) => {
                if (error) {
                    this.logger.app.error('Failed to send email:', error);
                    resolve(false);
                } else {
                    this.logger.app.info('Email sent successfully');
                    resolve(true);
                }
            })
        );
    }

    protected abstract getTransporter(): Transporter;
}
