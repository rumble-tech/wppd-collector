import LatestWordPressRuntimeVersionProvider from 'src/resolver/latest-version/providers/runtime/WordPress';
import Logger from 'src/services/logger/Logger';
import UpdateLatestWordPressVersionTask from 'src/tasks/UpdateLatestWordPressVersion';

describe('UpdateLatestWordPressVersionTask', () => {
    let task: UpdateLatestWordPressVersionTask;
    let mockLogger: jest.Mocked<Logger>;
    let mockProvider: jest.Mocked<LatestWordPressRuntimeVersionProvider>;

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
        } as unknown as jest.Mocked<LatestWordPressRuntimeVersionProvider>;

        task = new UpdateLatestWordPressVersionTask(mockLogger, mockProvider);

        jest.clearAllMocks();
    });

    describe('UpdateLatestWordPressVersionTask.run', () => {
        it('should update the latest WordPress version', async () => {
            mockProvider.fetch.mockResolvedValue();

            await task.run();

            expect(mockProvider.fetch).toHaveBeenCalledTimes(1);
            expect(mockLogger.info).toHaveBeenCalledWith('Updating latest WordPress version...');
            expect(mockLogger.info).toHaveBeenCalledWith('Successfully updated latest WordPress version');
        });

        it('should log an error when updating the latest WordPress version fails', async () => {
            const error = new Error('Failed to fetch latest WordPress version');
            mockProvider.fetch.mockRejectedValue(error);

            await task.run();

            expect(mockProvider.fetch).toHaveBeenCalledTimes(1);
            expect(mockLogger.info).toHaveBeenCalledWith('Updating latest WordPress version...');
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to update latest WordPress version', { err: error });
        });
    });
});
