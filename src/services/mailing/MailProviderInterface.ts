import { Transporter } from 'nodemailer';

export interface MailProviderInterface {
    getTransporter(): Transporter;
}
