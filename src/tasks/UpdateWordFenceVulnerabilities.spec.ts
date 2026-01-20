import WordFenceApiVulnerabilitiesProvider from 'src/resolver/vulnerabilities/providers/plugin/WordFenceApi';
import Logger from 'src/services/logger/Logger';
import UpdateWordFenceVulnerabilitiesTask from 'src/tasks/UpdateWordFenceVulnerabilities';

describe('UpdateWordFenceVulnerabilities', () => {
    let task: UpdateWordFenceVulnerabilitiesTask;
    let mockLogger: jest.Mocked<Logger>;
    let mockProvider: jest.Mocked<WordFenceApiVulnerabilitiesProvider>;

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
        } as unknown as jest.Mocked<WordFenceApiVulnerabilitiesProvider>;

        task = new UpdateWordFenceVulnerabilitiesTask(mockLogger, mockProvider);

        jest.clearAllMocks();
    });

    describe('UpdateWordFenceVulnerabilities.run', () => {
        it('should update WordFence vulnerabilities', async () => {
            mockProvider.fetch.mockResolvedValue();

            await task.run();

            expect(mockProvider.fetch).toHaveBeenCalledTimes(1);
            expect(mockLogger.info).toHaveBeenCalledWith('Updating WordFence vulnerabilities...');
            expect(mockLogger.info).toHaveBeenCalledWith('Successfully updated WordFence vulnerabilities');
        });

        it('should log an error when updating the WordFence vulnerabilities fails', async () => {
            const error = new Error('Failed to fetch plugin vulnerabilities');
            mockProvider.fetch.mockRejectedValue(error);

            await task.run();

            expect(mockProvider.fetch).toHaveBeenCalledTimes(1);
            expect(mockLogger.info).toHaveBeenCalledWith('Updating WordFence vulnerabilities...');
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to update WordFence vulnerabilities', {
                err: error,
            });
        });
    });
});
