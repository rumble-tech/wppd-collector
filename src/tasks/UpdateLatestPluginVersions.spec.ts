import Plugin from 'src/entities/Plugin';
import PluginRepository from 'src/repositories/PluginRepository';
import LatestVersionResolver from 'src/resolver/latest-version/LatestVersionResolver';
import Logger from 'src/services/logger/Logger';
import UpdateLatestPluginVersionsTask from 'src/tasks/UpdateLatestPluginVersions';

describe('UpdateLatestPluginVersionsTask', () => {
    let task: UpdateLatestPluginVersionsTask;
    let mockLogger: jest.Mocked<Logger>;
    let mockPluginRepository: jest.Mocked<PluginRepository>;
    let mockResolver: jest.Mocked<LatestVersionResolver>;

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
            update: jest.fn(),
        } as unknown as jest.Mocked<PluginRepository>;

        mockResolver = {
            resolvePlugin: jest.fn(),
        } as unknown as jest.Mocked<LatestVersionResolver>;

        task = new UpdateLatestPluginVersionsTask(mockLogger, mockPluginRepository, mockResolver);

        jest.clearAllMocks();
    });

    describe('UpdateLatestPluginVersionsTask.run', () => {
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

        const resolvedLatestVersion = {
            version: '1.0.0',
            requiredPhpVersion: '8.5.1',
            requiredWpVersion: '6.9.0',
        };

        it('should update each plugin', async () => {
            mockPluginRepository.findAll.mockResolvedValue([new Plugin(pluginDB)]);
            mockResolver.resolvePlugin.mockResolvedValue(resolvedLatestVersion);
            mockPluginRepository.update.mockResolvedValue(new Plugin(pluginDB));

            await task.run();

            expect(mockLogger.info).toHaveBeenCalledWith('Successfully updated latest plugin version', {
                plugin: pluginDB.slug,
                version: resolvedLatestVersion.version,
                requiredPhpVersion: resolvedLatestVersion.requiredPhpVersion,
                requiredWpVersion: resolvedLatestVersion.requiredWpVersion,
            });
        });

        it('should log a warning when updating a plugin fails', async () => {
            mockPluginRepository.findAll.mockResolvedValue([new Plugin(pluginDB)]);
            mockResolver.resolvePlugin.mockResolvedValue(resolvedLatestVersion);
            mockPluginRepository.update.mockResolvedValue(null);

            await task.run();

            expect(mockLogger.warn).toHaveBeenCalledWith('Failed to update latest plugin version', {
                plugin: pluginDB.slug,
            });
        });

        it('should log an error when updating the latest plugin versions fails', async () => {
            const error = new Error('Network Error');

            mockPluginRepository.findAll.mockRejectedValue(error);

            await task.run();

            expect(mockLogger.error).toHaveBeenCalledWith('Failed to update latest plugin versions', {
                err: error,
            });
        });
    });
});
