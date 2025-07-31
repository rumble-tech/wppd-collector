import { LoggerInterface } from 'src/components/logger/LoggerInterface';
import DeletePluginsUnusedTask from './DeletePluginsUnused';
import PluginRepository from 'src/repositories/PluginRepository';

describe('DeletePluginsUnused', () => {
    let task: DeletePluginsUnusedTask;
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
            deleteUnused: jest.fn(),
        } as unknown as jest.Mocked<PluginRepository>;

        task = new DeletePluginsUnusedTask(mockLogger, mockPluginRepository);
    });

    describe('DeletePluginsUnused.run', () => {
        it('should log a info when unused plugins are deleted successfully', async () => {
            mockPluginRepository.deleteUnused.mockResolvedValue(true);

            await task.run();

            expect(mockLogger.info).toHaveBeenCalledWith('Deleted unused plugins successfully');
        });

        it('should log a warning when no unused plugins found or deletion failed', async () => {
            mockPluginRepository.deleteUnused.mockResolvedValue(false);

            await task.run();

            expect(mockLogger.warn).toHaveBeenCalledWith('No unused plugins found or deletion failed');
        });

        it('should log an error when an error occurs during deletion', async () => {
            const error = new Error('Deletion failed');
            mockPluginRepository.deleteUnused.mockRejectedValue(error);

            await task.run();

            expect(mockLogger.error).toHaveBeenCalledWith('Error while deleting unused plugins', { error });
        });
    });
});
