import { Transporter } from 'nodemailer';

export default abstract class AbstractMailingProvider {
    public abstract getTransporter(): Transporter;
}
