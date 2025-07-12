import { LoggerInterface } from 'src/components/logger/LoggerInterface';
import Plugin from 'src/entities/Plugin';
import PluginRepository from 'src/repositories/PluginRepository';
import LatestVersionResolver from 'src/services/latest-version/LatestVersionResolver';
import UpdatePluginsLatestVersionTask from './UpdatePluginsLatestVersion';

describe('UpdatePluginsLatestVersion', () => {
    let task: UpdatePluginsLatestVersionTask;
    let mockLogger: jest.Mocked<LoggerInterface>;
    let mockPluginRepository: jest.Mocked<PluginRepository>;
    let mockLatestVersionResolver: jest.Mocked<LatestVersionResolver>;

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
            update: jest.fn(),
        } as unknown as jest.Mocked<PluginRepository>;

        mockLatestVersionResolver = {
            resolvePlugin: jest.fn(),
        } as unknown as jest.Mocked<LatestVersionResolver>;

        task = new UpdatePluginsLatestVersionTask(mockLogger, mockPluginRepository, mockLatestVersionResolver);
    });

    describe('UpdatePluginsLatestVersion.run', () => {
        it('should update each plugin and log info on success', async () => {
            const plugin = {
                getId: () => 1,
                getSlug: () => 'test-plugin',
                getName: () => 'Test Plugin',
            };

            mockPluginRepository.findAll.mockResolvedValue([plugin] as Plugin[]);

            const latestVersion = {
                version: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.8',
            };

            mockLatestVersionResolver.resolvePlugin.mockResolvedValue(latestVersion);

            mockPluginRepository.update.mockResolvedValue({} as Plugin);

            await task.run();

            expect(mockPluginRepository.update).toHaveBeenCalledWith({
                id: plugin.getId(),
                slug: plugin.getSlug(),
                name: plugin.getName(),
                latestVersion: latestVersion.version,
                requiredPhpVersion: latestVersion.requiredPhpVersion,
                requiredWpVersion: latestVersion.requiredWpVersion,
            });
            expect(mockLogger.info).toHaveBeenCalledWith(
                `Updated plugin ${plugin.getSlug()} to latest version ${latestVersion.version}`,
                {
                    pluginId: plugin.getId(),
                    latestVersion: latestVersion.version,
                    requiredPhpVersion: latestVersion.requiredPhpVersion,
                    requiredWpVersion: latestVersion.requiredWpVersion,
                }
            );
        });

        it('should log a warning if plugin update fails', async () => {
            const plugin = {
                getId: () => 1,
                getSlug: () => 'test-plugin',
                getName: () => 'Test Plugin',
            };

            mockPluginRepository.findAll.mockResolvedValue([plugin] as Plugin[]);

            const latestVersion = {
                version: '1.0.0',
                requiredPhpVersion: '7.4',
                requiredWpVersion: '5.8',
            };

            mockLatestVersionResolver.resolvePlugin.mockResolvedValue(latestVersion);

            mockPluginRepository.update.mockResolvedValue(null);

            await task.run();

            expect(mockLogger.warn).toHaveBeenCalledWith(
                `Failed to update plugin ${plugin.getSlug()} to latest version ${latestVersion.version}`
            );
        });

        it('should log an error if an exception occurs', async () => {
            mockPluginRepository.findAll.mockRejectedValue(new Error('Database error'));

            await task.run();

            expect(mockLogger.error).toHaveBeenCalledWith('Error while updating plugins latest version', {
                error: expect.any(Error),
            });
        });
    });
});
