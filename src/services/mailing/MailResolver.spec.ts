import { MailProviderInterface } from './MailProviderInterface';
import MailResolver from './MailResolver';

describe('MailResolver', () => {
    let resolver: MailResolver;

    beforeEach(() => {
        resolver = new MailResolver();
    });

    const createMockProvider = (): jest.Mocked<MailProviderInterface> => {
        return {
            getTransporter: jest.fn().mockReturnValue({
                sendMail: jest.fn((options, callback) => {
                    callback(null);
                }),
            }),
        };
    };

    describe('MailResolver.setProvider', () => {
        it('should set the mail provider', () => {
            const mockProvider = createMockProvider();

            resolver.setProvider(mockProvider);

            expect(resolver['provider']).toBe(mockProvider);
        });
    });

    describe('MailResolver.sendMail', () => {
        it('should send an email using the provider', async () => {
            const mockProvider = createMockProvider();

            resolver.setProvider(mockProvider);

            const from = 'foo@example.com';
            const to = 'bar@example.com';
            const subject = 'Test Subject';
            const body = '<p>This is a test email.</p>';

            await resolver.sendMail(from, to, subject, body);

            expect(mockProvider.getTransporter().sendMail).toHaveBeenCalledWith(
                {
                    from: from,
                    to: to,
                    subject: subject,
                    html: body,
                },
                expect.any(Function)
            );
        });

        it('should throw an error if provider is not set', async () => {
            const from = 'foo@example.com';
            const to = 'bar@example.com';
            const subject = 'Test Subject';
            const body = '<p>This is a test email.</p>';

            await expect(resolver.sendMail(from, to, subject, body)).rejects.toThrow('Mail provider is not set');
        });

        it('should reject if sending email fails', async () => {
            const mockProvider = createMockProvider();

            mockProvider.getTransporter().sendMail.mockImplementation((options, callback) => {
                callback(new Error('Failed to send email'));
            });

            resolver.setProvider(mockProvider);

            const from = 'foo@example.com';
            const to = 'bar@example.com';
            const subject = 'Test Subject';
            const body = '<p>This is a test email.</p>';

            await expect(resolver.sendMail(from, to, subject, body)).rejects.toThrow('Failed to send email');
        });
    });
});
