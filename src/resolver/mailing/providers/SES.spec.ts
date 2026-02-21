import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import { createTransport, Transporter } from 'nodemailer';
import SESMailingProvider from 'src/resolver/mailing/providers/SES';
import { TMailingSESConfig } from 'src/services/config/Types';

jest.mock('@aws-sdk/client-sesv2');
jest.mock('nodemailer');

const mockedSESv2Client = SESv2Client as jest.MockedClass<typeof SESv2Client>;
const mockedCreateTransport = createTransport as jest.MockedFunction<typeof createTransport>;

describe('SESMailingProvider', () => {
    let provider: SESMailingProvider;

    const sesMailConfig: TMailingSESConfig = {
        region: 'ses-region',
        accessKeyId: 'ses-access-key-id',
        accessKeySecret: 'ses-access-key-secret',
    };

    const fakeTransporter = {} as Transporter;

    beforeEach(() => {
        provider = new SESMailingProvider(sesMailConfig);

        mockedCreateTransport.mockReturnValue(fakeTransporter);

        jest.clearAllMocks();
    });

    describe('SESMailingProvider.getTransporter', () => {
        it('should create and return a nodemailer transporter using AWS SES', () => {
            const transporter = provider.getTransporter();

            expect(transporter).toBe(fakeTransporter);
            expect(mockedSESv2Client).toHaveBeenCalledWith({
                region: sesMailConfig.region,
                credentials: {
                    accessKeyId: sesMailConfig.accessKeyId,
                    secretAccessKey: sesMailConfig.accessKeySecret,
                },
            });
            expect(mockedCreateTransport).toHaveBeenCalledWith({
                SES: {
                    sesClient: expect.any(SESv2Client),
                    SendEmailCommand,
                },
            });
        });
    });
});
