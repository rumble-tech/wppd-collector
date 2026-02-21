import LatestPhpRuntimeVersionProvider from 'src/resolver/latest-version/providers/runtime/PHP';
import Logger from 'src/services/logger/Logger';
import UpdateLatestPhpVersionTask from 'src/tasks/UpdateLatestPhpVersion';

describe('UpdateLatestPhpVersionTask', () => {
    let task: UpdateLatestPhpVersionTask;
    let mockLogger: jest.Mocked<Logger>;
    let mockProvider: jest.Mocked<LatestPhpRuntimeVersionProvider>;

    beforeEach(() => {
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            silly: jest.fn(),
        } as unknown as jest.Mocked<Logger>;

        mockProvider = {
            fetch: jest.fn(),
        } as unknown as jest.Mocked<LatestPhpRuntimeVersionProvider>;

        task = new UpdateLatestPhpVersionTask(mockLogger, mockProvider);

        jest.clearAllMocks();
    });

    describe('UpdateLatestPhpVersionTask.run', () => {
        it('should update the latest PHP version', async () => {
            mockProvider.fetch.mockResolvedValue();

            await task.run();

            expect(mockProvider.fetch).toHaveBeenCalledTimes(1);
            expect(mockLogger.info).toHaveBeenCalledWith('Updating latest PHP version...');
            expect(mockLogger.info).toHaveBeenCalledWith('Successfully updated latest PHP version');
        });

        it('should log an error when updating the latest PHP version fails', async () => {
            const error = new Error('Failed to fetch latest PHP version');
            mockProvider.fetch.mockRejectedValue(error);

            await task.run();

            expect(mockProvider.fetch).toHaveBeenCalledTimes(1);
            expect(mockLogger.info).toHaveBeenCalledWith('Updating latest PHP version...');
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to update latest PHP version', { err: error });
        });
    });
});
