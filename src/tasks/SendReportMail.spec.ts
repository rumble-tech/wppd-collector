import { LoggerInterface } from 'src/components/logger/LoggerInterface';
import Config from 'src/config/Config';
import Site from 'src/entities/Site';
import SitePlugin from 'src/entities/SitePlugin';
import PluginRepository from 'src/repositories/PluginRepository';
import SiteRepository from 'src/repositories/SiteRepository';
import MailResolver from 'src/services/mailing/MailResolver';
import SendReportMailTask from './SendReportMail';

jest.mock('src/config/Config');
const mockedConfigGet = Config.get as jest.MockedFunction<typeof Config.get>;

describe('SendReportMail', () => {
    let task: SendReportMailTask;
    let mockLogger: jest.Mocked<LoggerInterface>;
    let mockSiteRepository: jest.Mocked<SiteRepository>;
    let mockPluginRepository: jest.Mocked<PluginRepository>;
    let mockMailResolver: jest.Mocked<MailResolver>;

    beforeEach(() => {
        mockedConfigGet.mockReset();
        mockedConfigGet.mockImplementation((key: string) => {
            if (key === 'MAILING_REPORT_SENDER') {
                return 'sender@example.com';
            }
            if (key === 'MAILING_REPORT_RECIPIENT') {
                return 'recipient@example.com';
            }
            return '';
        });

        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            silly: jest.fn(),
        };

        mockSiteRepository = {
            findAll: jest.fn(),
            findAllSitePlugins: jest.fn(),
        } as unknown as jest.Mocked<SiteRepository>;

        mockPluginRepository = {
            getVulnerabilities: jest.fn(),
        } as unknown as jest.Mocked<PluginRepository>;

        mockMailResolver = {
            sendMail: jest.fn(),
        } as unknown as jest.Mocked<MailResolver>;

        task = new SendReportMailTask(mockLogger, mockSiteRepository, mockPluginRepository, mockMailResolver);
    });

    describe('SendReportMail.run', () => {
        it('should send a report mail with grouped site reports', async () => {
            const sites = [
                {
                    getId: () => 1,
                    getName: () => 'Test Site 1',
                    getEnvironment: () => 'production',
                    getUrl: () => 'https://example.com/site-1',
                },
                {
                    getId: () => 2,
                    getName: () => 'Test Site 2',
                    getEnvironment: () => 'development',
                    getUrl: () => 'https://example.com/site-2',
                },
            ];

            mockSiteRepository.findAll.mockResolvedValue(sites as Site[]);

            const sitePlugins = [
                {
                    getSlug: () => 'test-plugin-valid-active',
                    getName: () => 'Test Plugin Valid Active',
                    getInstalledVersion: () => ({ version: '1.0.0' }),
                    getLatestVersion: () => ({ version: '2.0.0' }),
                    getIsActive: () => true,
                },
                {
                    getSlug: () => 'test-plugin-valid-inactive',
                    getName: () => 'Test Plugin Valid Inactive',
                    getInstalledVersion: () => ({ version: '1.0.0' }),
                    getLatestVersion: () => ({ version: '2.0.0' }),
                    getIsActive: () => false,
                },
                {
                    getSlug: () => 'test-plugin - skip because null version',
                    getName: () => 'Test Plugin - Skip Null Version',
                    getInstalledVersion: () => ({ version: null }),
                    getLatestVersion: () => ({ version: null }),
                    getIsActive: () => true,
                },
                {
                    getSlug: () => 'test-plugin - skip because same version',
                    getName: () => 'Test Plugin - Skip Same Version',
                    getInstalledVersion: () => ({ version: '1.0.0' }),
                    getLatestVersion: () => ({ version: '1.0.0' }),
                    getIsActive: () => true,
                },
                {
                    getSlug: () => 'test-plugin - skip because invalid version',
                    getName: () => 'Test Plugin - Skip Invalid Version',
                    getInstalledVersion: () => ({ version: 'invalid' }),
                    getLatestVersion: () => ({ version: 'invalid' }),
                    getIsActive: () => true,
                },
            ];

            mockSiteRepository.findAllSitePlugins.mockResolvedValue(sitePlugins as SitePlugin[]);

            const vulnerability = {
                from: {
                    version: '1.0.0',
                    inclusive: true,
                },
                to: {
                    version: '2.0.0',
                    inclusive: true,
                },
                score: 5.0,
            };

            mockPluginRepository.getVulnerabilities.mockResolvedValue([vulnerability]);

            await task.run();

            expect(mockMailResolver.sendMail).toHaveBeenCalledTimes(1);
            const [sender, recipient, subject, html] = mockMailResolver.sendMail.mock.calls[0];
            expect(sender).toBe('sender@example.com');
            expect(recipient).toBe('recipient@example.com');
            expect(subject).toBe('Rumble WPPD Report');

            expect(html).toContain('Test Site');
            expect(html).toContain('https://example.com/site-1');
            expect(html).toContain('test-plugin-valid-active');
            expect(html).toContain('test-plugin-valid-inactive');
            expect(html).toContain('Yes');
            expect(html).toContain('No');
            expect(html).toContain('1.0.0');
            expect(html).toContain('2.0.0');
            expect(html).toContain('<td style="color: red">MAJOR</td>');
            expect(html).toContain('1 - 5');

            expect(html).not.toContain('test-plugin - skip because null version');
            expect(html).not.toContain('test-plugin - skip because same version');
            expect(html).not.toContain('test-plugin - skip because invalid version');

            expect(mockLogger.info).toHaveBeenCalledWith('Rumble WPPD Report generated and sent via email.');
        });

        it('should sort site plugins by slug if version diff category is same', async () => {
            const site = {
                getId: () => 1,
                getName: () => 'Test Site 1',
                getEnvironment: () => 'production',
                getUrl: () => 'https://example.com/site-1',
            };

            mockSiteRepository.findAll.mockResolvedValue([site] as Site[]);

            const sitePlugins = [
                {
                    getSlug: () => 'plugin-a',
                    getName: () => 'Test Plugin A',
                    getInstalledVersion: () => ({ version: '1.0.0' }),
                    getLatestVersion: () => ({ version: '2.0.0' }),
                    getIsActive: () => true,
                },
                {
                    getSlug: () => 'plugin-c',
                    getName: () => 'Test Plugin C',
                    getInstalledVersion: () => ({ version: '1.0.0' }),
                    getLatestVersion: () => ({ version: '2.0.0' }),
                    getIsActive: () => true,
                },
                {
                    getSlug: () => 'plugin-b',
                    getName: () => 'Test Plugin B',
                    getInstalledVersion: () => ({ version: '1.0.0' }),
                    getLatestVersion: () => ({ version: '2.0.0' }),
                    getIsActive: () => true,
                },
            ];

            mockSiteRepository.findAllSitePlugins.mockResolvedValue(sitePlugins as SitePlugin[]);
            mockPluginRepository.getVulnerabilities.mockResolvedValue([]);

            await task.run();

            expect(mockMailResolver.sendMail).toHaveBeenCalledTimes(1);
            const html = mockMailResolver.sendMail.mock.calls[0][3];

            expect(html).toContain('plugin-a');
            expect(html).toContain('plugin-b');
            expect(html.indexOf('plugin-a')).toBeLessThan(html.indexOf('plugin-b'));
            expect(html.indexOf('plugin-b')).toBeLessThan(html.indexOf('plugin-c'));
        });

        it('should render the correct colors for version diff categories', async () => {
            const site = {
                getId: () => 1,
                getName: () => 'Test Site 1',
                getEnvironment: () => 'production',
                getUrl: () => 'https://example.com/site-1',
            };

            mockSiteRepository.findAll.mockResolvedValue([site] as Site[]);

            const sitePlugins = [
                {
                    getSlug: () => 'plugin-major',
                    getName: () => 'Test Plugin Major',
                    getInstalledVersion: () => ({ version: '1.0.0' }),
                    getLatestVersion: () => ({ version: '2.0.0' }),
                    getIsActive: () => true,
                },
                {
                    getSlug: () => 'plugin-minor',
                    getName: () => 'Test Plugin Minor',
                    getInstalledVersion: () => ({ version: '1.0.0' }),
                    getLatestVersion: () => ({ version: '1.2.0' }),
                    getIsActive: () => true,
                },
                {
                    getSlug: () => 'plugin-patch',
                    getName: () => 'Test Plugin Patch',
                    getInstalledVersion: () => ({ version: '1.0.0' }),
                    getLatestVersion: () => ({ version: '1.0.1' }),
                    getIsActive: () => true,
                },
                {
                    getSlug: () => 'plugin-igl',
                    getName: () => 'Test Plugin Installed Greater Latest',
                    getInstalledVersion: () => ({ version: '2.0.0' }),
                    getLatestVersion: () => ({ version: '1.0.0' }),
                    getIsActive: () => true,
                },
            ];

            mockSiteRepository.findAllSitePlugins.mockResolvedValue(sitePlugins as SitePlugin[]);
            mockPluginRepository.getVulnerabilities.mockResolvedValue([]);

            await task.run();

            expect(mockMailResolver.sendMail).toHaveBeenCalledTimes(1);
            const html = mockMailResolver.sendMail.mock.calls[0][3];

            expect(html).toContain('plugin-major');
            expect(html).toContain('plugin-minor');
            expect(html).toContain('plugin-patch');
            expect(html).toContain('plugin-igl');
            expect(html).toContain('style="color: red">MAJOR</td>');
            expect(html).toContain('style="color: darkorange">MINOR</td>');
            expect(html).toContain('style="color: royalblue">PATCH</td>');
            expect(html).toContain('style="color: indigo">IGL</td>');
        });

        it('should skip site plugin when fetching vulnerabilities fails', async () => {
            const site = {
                getId: () => 1,
                getName: () => 'Test Site',
                getEnvironment: () => 'production',
                getUrl: () => 'https://example.com/site-1',
            };

            mockSiteRepository.findAll.mockResolvedValue([site] as Site[]);

            const sitePlugin = {
                getSlug: () => 'test-plugin',
                getName: () => 'Test Plugin',
                getInstalledVersion: () => ({ version: '1.0.0' }),
                getLatestVersion: () => ({ version: '2.0.0' }),
                getIsActive: () => true,
            };

            mockSiteRepository.findAllSitePlugins.mockResolvedValue([sitePlugin] as SitePlugin[]);

            mockPluginRepository.getVulnerabilities.mockResolvedValue(null);

            await task.run();

            expect(mockLogger.warn).toHaveBeenCalledWith('Failed to fetch vulnerabilities for plugin', {
                slug: 'test-plugin',
            });
        });

        it('should log an error if sending mail fails', async () => {
            mockSiteRepository.findAll.mockResolvedValue([]);
            mockSiteRepository.findAllSitePlugins.mockResolvedValue([]);
            mockPluginRepository.getVulnerabilities.mockResolvedValue([]);

            const error = new Error('Mail sending failed');
            mockMailResolver.sendMail.mockRejectedValue(error);

            await task.run();

            expect(mockLogger.error).toHaveBeenCalledWith('Failed to send Rumble WPPD Report via email', {
                error,
            });
        });
    });
});
