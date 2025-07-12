import { LoggerInterface } from 'src/components/logger/LoggerInterface';
import PluginRepository from 'src/repositories/PluginRepository';
import UpdatePluginsVulnerabilitiesTask from './UpdatePluginsVulnerabilities';
import Plugin from 'src/entities/Plugin';

describe('UpdatePluginsVulnerabilities', () => {
    let task: UpdatePluginsVulnerabilitiesTask;
    let mockLogger: jest.Mocked<LoggerInterface>;
    let mockPluginRepository: jest.Mocked<PluginRepository>;

    beforeEach(() => {
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            silly: jest.fn(),
        };

        mockPluginRepository = {
            findAll: jest.fn(),
            getVulnerabilities: jest.fn(),
            createVulnerability: jest.fn(),
            deleteAllVulnerabilitiesForPlugin: jest.fn(),
        } as unknown as jest.Mocked<PluginRepository>;

        task = new UpdatePluginsVulnerabilitiesTask(mockLogger, mockPluginRepository);
    });

    describe('UpdatePluginsVulnerabilities.run', () => {
        it('should fetch, delete and insert vulnerabilities for plugin and log info on success', async () => {
            const plugin = {
                getId: () => 1,
                getSlug: () => 'test-plugin',
                getName: () => 'Test Plugin',
            };

            mockPluginRepository.findAll.mockResolvedValue([plugin] as Plugin[]);

            const vulnerabilities = [
                {
                    from: {
                        version: '1.0.0',
                        inclusive: true,
                    },
                    to: {
                        version: '2.0.0',
                        inclusive: true,
                    },
                    score: 5.0,
                },
            ];

            mockPluginRepository.getVulnerabilities.mockResolvedValue(vulnerabilities);
            mockPluginRepository.deleteAllVulnerabilitiesForPlugin.mockResolvedValue(undefined);

            await task.run();

            expect(mockPluginRepository.getVulnerabilities).toHaveBeenCalledWith(plugin.getSlug());
            expect(mockPluginRepository.deleteAllVulnerabilitiesForPlugin).toHaveBeenCalledWith(plugin.getId());
            expect(mockLogger.info).toHaveBeenCalledWith(
                `Found ${vulnerabilities.length} vulnerabilities for plugin. Clearing existing vulnerabilities and inserting new ones`,
                { id: plugin.getId(), slug: plugin.getSlug() }
            );
        });

        it('should log error if fetching vulnerabilities fails', async () => {
            const plugin = {
                getId: () => 1,
                getSlug: () => 'test-plugin',
                getName: () => 'Test Plugin',
            };

            mockPluginRepository.findAll.mockResolvedValue([plugin] as Plugin[]);
            mockPluginRepository.getVulnerabilities.mockResolvedValue(null);

            await task.run();

            expect(mockLogger.error).toHaveBeenCalledWith('Failed to fetch vulnerabilities for plugin', {
                id: plugin.getId(),
                slug: plugin.getSlug(),
            });
        });
    });

    it('should log error if an exception occurs during the run', async () => {
        mockPluginRepository.findAll.mockRejectedValue(new Error('Database error'));

        await task.run();

        expect(mockLogger.error).toHaveBeenCalledWith('Error while updating plugins vulnerabilities', {
            error: new Error('Database error'),
        });
    });
});
