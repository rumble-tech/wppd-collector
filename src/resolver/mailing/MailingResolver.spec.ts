import MailingResolver from 'src/resolver/mailing/MailingResolver';
import AbstractMailingProvider from 'src/resolver/mailing/providers/AbstractMailingProvider';

describe('MailingResolver', () => {
    let mailingProvider: AbstractMailingProvider;
    let resolver: MailingResolver;
    let sendMailMock: jest.Mock;

    beforeEach(() => {
        sendMailMock = jest.fn((options, callback) => callback(null));

        mailingProvider = {
            getTransporter: jest.fn().mockReturnValue({
                sendMail: sendMailMock,
            }),
        } as unknown as AbstractMailingProvider;

        resolver = new MailingResolver(mailingProvider);

        jest.clearAllMocks();
    });

    describe('MailingResolver.sendMail', () => {
        it('should send an email using the provider', async () => {
            const from = 'from@example.com';
            const to = 'to@example.com';
            const subject = 'Test Subject';
            const body = '<p>This is a test email.</p>';

            await resolver.sendMail(from, to, subject, body);

            expect(mailingProvider.getTransporter().sendMail).toHaveBeenCalledWith(
                {
                    from,
                    to,
                    subject,
                    html: body,
                },
                expect.any(Function)
            );
        });

        it('should throw an error if sending the email fails', async () => {
            sendMailMock.mockImplementation((options, callback) => {
                callback(new Error('Failed to send email'));
            });

            const from = 'from@example.com';
            const to = 'to@example.com';
            const subject = 'Test Subject';
            const body = '<p>This is a test email.</p>';

            await expect(resolver.sendMail(from, to, subject, body)).rejects.toThrow('Failed to send email');
        });
    });
});
