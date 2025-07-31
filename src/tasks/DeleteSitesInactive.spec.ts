import { LoggerInterface } from 'src/components/logger/LoggerInterface';
import SiteRepository from 'src/repositories/SiteRepository';
import DeleteSitesInactiveTask from './DeleteSitesInactive';
import Site from 'src/entities/Site';

describe('DeleteSitesInactive', () => {
    let task: DeleteSitesInactiveTask;
    let mockLogger: jest.Mocked<LoggerInterface>;
    let mockSiteRepository: jest.Mocked<SiteRepository>;

    const FIXED_DATE_NOW = new Date('2025-01-01T00:00:00Z').getTime();
    const ONE_DAY_MS = 864e5;

    beforeAll(() => {
        jest.spyOn(Date, 'now').mockReturnValue(FIXED_DATE_NOW);
    });

    beforeEach(() => {
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            silly: jest.fn(),
        };

        mockSiteRepository = {
            findAll: jest.fn(),
            delete: jest.fn(),
        } as unknown as jest.Mocked<SiteRepository>;

        task = new DeleteSitesInactiveTask(mockLogger, mockSiteRepository);
    });

    describe('DeleteSitesInactive.run', () => {
        it('should delete sites that have been inactive for more than 1 day', async () => {
            const site = {
                getId: () => 1,
                getName: () => 'Test Site',
                getUpdatedAt: () => new Date(FIXED_DATE_NOW - ONE_DAY_MS - 1000),
            };

            mockSiteRepository.findAll.mockResolvedValue([site] as Site[]);
            mockSiteRepository.delete.mockResolvedValue(true);

            await task.run();

            expect(mockSiteRepository.findAll).toHaveBeenCalled();
            expect(mockSiteRepository.delete).toHaveBeenCalledWith(1);
            expect(mockLogger.info).toHaveBeenCalledWith(`Deleted inactive site: Test Site (ID: 1)`, {
                siteId: 1,
                siteName: 'Test Site',
            });
        });

        it('should not delete sites that have been updated within the last day', async () => {
            const site = {
                getId: () => 1,
                getName: () => 'Test Site',
                getUpdatedAt: () => new Date(FIXED_DATE_NOW - ONE_DAY_MS + 1000),
            };

            mockSiteRepository.findAll.mockResolvedValue([site] as Site[]);

            await task.run();

            expect(mockSiteRepository.findAll).toHaveBeenCalled();
            expect(mockSiteRepository.delete).not.toHaveBeenCalled();
        });

        it('should log a warning if site deletion fails', async () => {
            const site = {
                getId: () => 1,
                getName: () => 'Test Site',
                getUpdatedAt: () => new Date(FIXED_DATE_NOW - ONE_DAY_MS - 1000),
            };

            mockSiteRepository.findAll.mockResolvedValue([site] as Site[]);
            mockSiteRepository.delete.mockResolvedValue(false);

            await task.run();

            expect(mockSiteRepository.findAll).toHaveBeenCalled();
            expect(mockSiteRepository.delete).toHaveBeenCalledWith(1);
            expect(mockLogger.warn).toHaveBeenCalledWith(`Failed to delete inactive site: Test Site (ID: 1)`, {
                siteId: 1,
                siteName: 'Test Site',
            });
        });

        it('should log an error if an exception occurs during deletion', async () => {
            const error = new Error('Deletion failed');
            mockSiteRepository.findAll.mockRejectedValue(error);

            await task.run();

            expect(mockLogger.error).toHaveBeenCalledWith('Error while deleting inactive sites', { error });
        });
    });
});
