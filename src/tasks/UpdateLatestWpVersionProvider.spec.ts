import { LoggerInterface } from 'src/components/logger/LoggerInterface';
import { LatestPhpOrWpVersionProviderInterface } from 'src/services/latest-version/LatestVersionProviderInterface';
import UpdateLatestWpVersionProviderTask from './UpdateLatestWpVersionProvider';

describe('UpdateLatestWpVersionProvider', () => {
    let task: UpdateLatestWpVersionProviderTask;
    let mockLogger: jest.Mocked<LoggerInterface>;
    let mockLatestWpVersionProvider: jest.Mocked<LatestPhpOrWpVersionProviderInterface>;

    beforeEach(() => {
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            silly: jest.fn(),
        };

        mockLatestWpVersionProvider = {
            fetchLatestVersion: jest.fn(),
        } as unknown as jest.Mocked<LatestPhpOrWpVersionProviderInterface>;

        task = new UpdateLatestWpVersionProviderTask(mockLogger, mockLatestWpVersionProvider);
    });

    describe('UpdateLatestWpVersionProvider.run', () => {
        it('should update the latest WP version successfully', async () => {
            mockLatestWpVersionProvider.fetchLatestVersion.mockResolvedValue(undefined);

            await task.run();

            expect(mockLatestWpVersionProvider.fetchLatestVersion).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith('Latest WP version updated successfully.');
        });

        it('should log an error if updating the latest WP version fails', async () => {
            const error = new Error('Failed to fetch latest WP version');
            mockLatestWpVersionProvider.fetchLatestVersion.mockRejectedValue(error);

            await task.run();

            expect(mockLogger.error).toHaveBeenCalledWith('Failed to update latest WP version:', { err: error });
        });
    });
});
