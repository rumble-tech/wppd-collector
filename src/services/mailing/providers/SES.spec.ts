import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import SESMailProvider from './SES';
import { createTransport, Transporter } from 'nodemailer';

jest.mock('@aws-sdk/client-sesv2');
jest.mock('nodemailer');

const MockSESv2Client = SESv2Client as jest.MockedClass<typeof SESv2Client>;
const mockCreateTransport = createTransport as jest.MockedFunction<typeof createTransport>;

describe('SES', () => {
    let provider: SESMailProvider;
    const config = {
        region: 'us-east-1',
        accessKeyId: 'testKeyId',
        secretAccessKey: 'testSecretKey',
    };
    const fakeTransporter = {} as Transporter;

    beforeEach(() => {
        provider = new SESMailProvider(config);

        mockCreateTransport.mockReturnValue(fakeTransporter);

        jest.clearAllMocks();
    });

    describe('SES.getTransporter', () => {
        it('should instantiate SESv2Client with the config and pass it into createTransport', () => {
            const transporter = provider.getTransporter();

            expect(transporter).toBe(fakeTransporter);

            expect(MockSESv2Client).toHaveBeenCalledWith({
                region: config.region,
                credentials: {
                    accessKeyId: config.accessKeyId,
                    secretAccessKey: config.secretAccessKey,
                },
            });

            expect(mockCreateTransport).toHaveBeenCalledWith({
                SES: {
                    sesClient: expect.any(SESv2Client),
                    SendEmailCommand,
                },
            });
        });
    });
});
