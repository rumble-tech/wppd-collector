import Plugin from 'src/entities/Plugin';
import PluginVulnerability from 'src/entities/PluginVulnerability';
import PluginRepository from 'src/repositories/PluginRepository';
import PluginVulnerabilityRepository from 'src/repositories/PluginVulnerabilityRepository';
import VulnerabilitiesResolver from 'src/resolver/vulnerabilities/VulnerabilitiesResolver';
import Logger from 'src/services/logger/Logger';
import UpdatePluginVulnerabilitiesTask from 'src/tasks/UpdatePluginVulnerabilities';

describe('UpdatePluginVulnerabilitiesTask', () => {
    let task: UpdatePluginVulnerabilitiesTask;
    let mockLogger: jest.Mocked<Logger>;
    let mockPluginRepository: jest.Mocked<PluginRepository>;
    let mockPluginVulnerabilityRepository: jest.Mocked<PluginVulnerabilityRepository>;
    let mockResolver: jest.Mocked<VulnerabilitiesResolver>;

    beforeEach(() => {
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            silly: jest.fn(),
        } as unknown as jest.Mocked<Logger>;

        mockPluginRepository = {
            findAll: jest.fn(),
        } as unknown as jest.Mocked<PluginRepository>;

        mockPluginVulnerabilityRepository = {
            insert: jest.fn(),
            deleteAllByPluginId: jest.fn(),
        } as unknown as jest.Mocked<PluginVulnerabilityRepository>;

        mockResolver = {
            resolvePlugin: jest.fn(),
        } as unknown as jest.Mocked<VulnerabilitiesResolver>;

        task = new UpdatePluginVulnerabilitiesTask(
            mockLogger,
            mockPluginRepository,
            mockPluginVulnerabilityRepository,
            mockResolver
        );

        jest.clearAllMocks();
    });

    describe('UpdatePluginVulnerabilitiesTask.run', () => {
        const pluginDB = {
            id: 1,
            createdAt: new Date('2026-01-01T00:00:00Z'),
            updatedAt: new Date('2026-01-01T00:00:00Z'),
            slug: 'plugin-1',
            name: 'Plugin1',
            latestVersion: '1.0.0',
            requiredPhpVersion: '8.5.1',
            requiredWpVersion: '6.9.0',
        };

        const resolvedVulnerability = {
            description: 'Vulnerability in Plugin1',
            publishedAt: new Date('2025-12-01T00:00:00Z'),
            severity: 5,
            references: 'https://example.com/vuln1',
            fromVersion: {
                version: '1.0.0',
                inclusive: true,
            },
            toVersion: {
                version: '2.0.0',
                inclusive: true,
            },
        };

        it('should update plugin vulnerabilities successfully', async () => {
            mockPluginRepository.findAll.mockResolvedValue([new Plugin(pluginDB)]);
            mockResolver.resolvePlugin.mockReturnValue([resolvedVulnerability]);
            mockPluginVulnerabilityRepository.deleteAllByPluginId.mockResolvedValue(true);
            mockPluginVulnerabilityRepository.insert.mockResolvedValue(
                new PluginVulnerability({
                    id: 1,
                    createdAt: new Date(),
                    pluginId: pluginDB.id,
                    ...resolvedVulnerability,
                })
            );

            await task.run();

            expect(mockLogger.info).toHaveBeenCalledWith('Updating plugin vulnerabilities...');
            expect(mockLogger.info).toHaveBeenCalledWith('Successfully inserted plugin vulnerability', {
                slug: pluginDB['slug'],
                vulnerability: resolvedVulnerability,
            });
        });

        it('should update plugin vulnerabilities successfully - resolver returns null', async () => {
            mockPluginRepository.findAll.mockResolvedValue([new Plugin(pluginDB)]);
            mockResolver.resolvePlugin.mockReturnValue(null);
            mockPluginVulnerabilityRepository.deleteAllByPluginId.mockResolvedValue(true);
            mockPluginVulnerabilityRepository.insert.mockResolvedValue(
                new PluginVulnerability({
                    id: 1,
                    createdAt: new Date(),
                    pluginId: pluginDB.id,
                    ...resolvedVulnerability,
                })
            );

            await task.run();

            expect(mockLogger.info).toHaveBeenCalledWith('Updating plugin vulnerabilities...');
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to fetch vulnerabilities for plugin', {
                slug: pluginDB['slug'],
            });
        });

        it('should log an error when inserting a vulnerability fails', async () => {
            mockPluginRepository.findAll.mockResolvedValue([new Plugin(pluginDB)]);
            mockResolver.resolvePlugin.mockReturnValue([resolvedVulnerability]);
            mockPluginVulnerabilityRepository.deleteAllByPluginId.mockResolvedValue(true);
            mockPluginVulnerabilityRepository.insert.mockResolvedValue(null);

            await task.run();

            expect(mockLogger.info).toHaveBeenCalledWith('Updating plugin vulnerabilities...');
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to insert plugin vulnerability', {
                slug: pluginDB['slug'],
                vulnerability: resolvedVulnerability,
            });
        });

        it('should log an error when updating the plugin vulnerabilities fails', async () => {
            const error = new Error('Network Error');

            mockPluginRepository.findAll.mockRejectedValue(error);

            await task.run();

            expect(mockLogger.error).toHaveBeenCalledWith('Failed to update plugin vulnerabilities', {
                err: error,
            });
        });
    });
});
