import Site from 'src/entities/Site';
import SiteRepository from 'src/repositories/SiteRepository';
import Logger from 'src/services/logger/Logger';
import DeleteInactiveSitesTask from 'src/tasks/DeleteInactiveSites';

describe('DeleteInactiveSitesTask', () => {
    let task: DeleteInactiveSitesTask;
    let mockLogger: jest.Mocked<Logger>;
    let mockSiteRepository: jest.Mocked<SiteRepository>;

    beforeEach(() => {
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            silly: jest.fn(),
        } as unknown as jest.Mocked<Logger>;

        mockSiteRepository = {
            findAll: jest.fn(),
            delete: jest.fn(),
        } as unknown as jest.Mocked<SiteRepository>;

        task = new DeleteInactiveSitesTask(mockLogger, mockSiteRepository);

        jest.clearAllMocks();
    });

    describe('DeleteInactiveSitesTask.run', () => {
        const siteDB = {
            id: 1,
            createdAt: new Date('2026-01-01T00:00:00Z'),
            updatedAt: new Date('2026-01-01T00:00:00Z'),
            name: 'Site1',
            url: 'https://example.com/site1',
            apiKey: 'api-key-1',
            environment: 'development',
            phpVersion: '8.5.1',
            wpVersion: '6.9.0',
        } as const;

        it('should delete inactive sites', async () => {
            mockSiteRepository.findAll.mockResolvedValue([new Site(siteDB)]);
            mockSiteRepository.delete.mockResolvedValue(true);

            await task.run();

            expect(mockLogger.info).toHaveBeenCalledWith('Deleting inactive sites...');
            expect(mockLogger.info).toHaveBeenCalledWith(`Deleting inactive site`, {
                siteId: siteDB.id,
            });
            expect(mockLogger.info).toHaveBeenCalledWith(`Successfully deleted site`, {
                siteId: siteDB.id,
            });
            expect(mockSiteRepository.delete).toHaveBeenCalledWith(siteDB.id);
        });

        it('should not delete active sites', async () => {
            mockSiteRepository.findAll.mockResolvedValue([new Site({ ...siteDB, updatedAt: new Date() })]);
            mockSiteRepository.delete.mockResolvedValue(true);

            await task.run();

            expect(mockLogger.info).toHaveBeenCalledWith('Deleting inactive sites...');
        });

        it('should log an error when deleting inactive sites return fails', async () => {
            mockSiteRepository.findAll.mockResolvedValue([new Site(siteDB)]);
            mockSiteRepository.delete.mockResolvedValue(false);

            await task.run();

            expect(mockLogger.info).toHaveBeenCalledWith('Deleting inactive sites...');
            expect(mockLogger.info).toHaveBeenCalledWith(`Deleting inactive site`, {
                siteId: siteDB.id,
            });
            expect(mockLogger.error).toHaveBeenCalledWith(`Failed to delete site`, {
                siteId: siteDB.id,
            });
            expect(mockSiteRepository.delete).toHaveBeenCalledWith(siteDB.id);
        });

        it('should log an error when the task fails', async () => {
            const error = new Error('Network Error');

            mockSiteRepository.findAll.mockRejectedValue(error);

            await task.run();

            expect(mockLogger.error).toHaveBeenCalledWith('Failed to delete inactive sites', {
                err: error,
            });
        });
    });
});
