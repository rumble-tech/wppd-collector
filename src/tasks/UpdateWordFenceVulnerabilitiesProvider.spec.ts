import { LoggerInterface } from 'src/components/logger/LoggerInterface';
import { VulnerabilitiesProviderInterface } from 'src/services/vulnerabilities/VulnerabilitiesProviderInterface';
import UpdateWordFenceVulnerabilitiesProviderTask from './UpdateWordFenceVulnerabilitiesProvider';

describe('UpdateWordFenceVulnerabilitiesProvider', () => {
    let task: UpdateWordFenceVulnerabilitiesProviderTask;
    let mockLogger: jest.Mocked<LoggerInterface>;
    let mockWordFenceVulnerabilitiesProvider: jest.Mocked<VulnerabilitiesProviderInterface>;

    beforeEach(() => {
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            silly: jest.fn(),
        };

        mockWordFenceVulnerabilitiesProvider = {
            fetchVulnerabilities: jest.fn(),
        } as unknown as jest.Mocked<VulnerabilitiesProviderInterface>;

        task = new UpdateWordFenceVulnerabilitiesProviderTask(mockLogger, mockWordFenceVulnerabilitiesProvider);
    });

    describe('UpdateWordFenceVulnerabilitiesProvider.run', () => {
        it('should update the WordFence vulnerabilities successfully', async () => {
            mockWordFenceVulnerabilitiesProvider.fetchVulnerabilities.mockResolvedValue(undefined);

            await task.run();

            expect(mockWordFenceVulnerabilitiesProvider.fetchVulnerabilities).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith('WordFence vulnerabilities updated successfully.');
        });
        it('should log an error if updating the latest WP version fails', async () => {
            const error = new Error('Failed to fetch latest WP version');
            mockWordFenceVulnerabilitiesProvider.fetchVulnerabilities.mockRejectedValue(error);

            await task.run();

            expect(mockLogger.error).toHaveBeenCalledWith('Failed to update WordFence vulnerabilities:', {
                err: error,
            });
        });
    });
});
