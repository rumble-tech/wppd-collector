import { LoggerInterface } from 'src/components/logger/LoggerInterface';
import { LatestPhpOrWpVersionProviderInterface } from 'src/services/latest-version/LatestVersionProviderInterface';
import UpdateLatestPhpVersionProviderTask from './UpdateLatestPhpVersionProvider';

describe('UpdateLatestPhpVersionProvider', () => {
    let task: UpdateLatestPhpVersionProviderTask;
    let mockLogger: jest.Mocked<LoggerInterface>;
    let mockLatestPhpVersionProvider: jest.Mocked<LatestPhpOrWpVersionProviderInterface>;

    beforeEach(() => {
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            silly: jest.fn(),
        };

        mockLatestPhpVersionProvider = {
            fetchLatestVersion: jest.fn(),
        } as unknown as jest.Mocked<LatestPhpOrWpVersionProviderInterface>;

        task = new UpdateLatestPhpVersionProviderTask(mockLogger, mockLatestPhpVersionProvider);
    });

    describe('UpdateLatestPhpVersionProvider.run', () => {
        it('should update the latest PHP version successfully', async () => {
            mockLatestPhpVersionProvider.fetchLatestVersion.mockResolvedValue(undefined);

            await task.run();

            expect(mockLatestPhpVersionProvider.fetchLatestVersion).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith('Latest PHP version updated successfully.');
        });

        it('should log an error if updating the latest PHP version fails', async () => {
            const error = new Error('Failed to fetch latest PHP version');
            mockLatestPhpVersionProvider.fetchLatestVersion.mockRejectedValue(error);

            await task.run();

            expect(mockLogger.error).toHaveBeenCalledWith('Failed to update latest PHP version:', { err: error });
        });
    });
});
