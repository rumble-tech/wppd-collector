import { and, eq } from 'drizzle-orm';
import Site from 'src/entities/Site';
import SiteRepository from 'src/repositories/SiteRepository';
import { TDatabase, TSitesTable } from 'src/services/database/Types';
import { testDataSiteEntity, testDataSiteJSON } from 'test-utils/test-data/Site';

describe('SiteRepository', () => {
    let siteRepository: SiteRepository;
    let database: Partial<TDatabase>;
    let sitesTable: TSitesTable;

    beforeEach(() => {
        database = {
            select: jest.fn(),
            insert: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };

        sitesTable = {} as unknown as TSitesTable;

        siteRepository = new SiteRepository(database as TDatabase, sitesTable);
    });

    describe('SiteRepository.findAll', () => {
        it('should return all sites', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([testDataSiteJSON]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const sites = await siteRepository.findAll();

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(sitesTable);
            expect(builder.execute).toHaveBeenCalled();

            expect(sites).toHaveLength(1);

            const [site] = sites;

            expect(site).toEqualSiteEntity(testDataSiteEntity);
        });
    });

    describe('SiteRepository.findById', () => {
        it('should return one site by its id', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([testDataSiteJSON]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const site = await siteRepository.findById(testDataSiteJSON.id);

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(sitesTable);
            expect(builder.where).toHaveBeenCalledWith(eq(sitesTable.id, testDataSiteJSON.id));
            expect(builder.limit).toHaveBeenCalledWith(1);
            expect(builder.execute).toHaveBeenCalled();

            expect(site).not.toBeNull();
            expect(site).toEqualSiteEntity(testDataSiteEntity);
        });

        it('should return null if the site could not be found by its id', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const site = await siteRepository.findById(testDataSiteJSON.id);

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(sitesTable);
            expect(builder.where).toHaveBeenCalledWith(eq(sitesTable.id, testDataSiteJSON.id));
            expect(builder.limit).toHaveBeenCalledWith(1);
            expect(builder.execute).toHaveBeenCalled();

            expect(site).toBeNull();
        });
    });

    describe('SiteRepository.findByNameAndUrl', () => {
        it('should return one site by its name and url', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([testDataSiteJSON]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const site = await siteRepository.findByNameAndUrl(testDataSiteJSON.name, testDataSiteJSON.url);

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(sitesTable);
            expect(builder.where).toHaveBeenCalledWith(
                and(eq(sitesTable.name, testDataSiteJSON.name), eq(sitesTable.url, testDataSiteJSON.url))
            );
            expect(builder.limit).toHaveBeenCalledWith(1);
            expect(builder.execute).toHaveBeenCalled();

            expect(site).not.toBeNull();
            expect(site).toEqualSiteEntity(testDataSiteEntity);
        });

        it('should return null if the site could not be found by its name and url', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const site = await siteRepository.findByNameAndUrl(testDataSiteJSON.name, testDataSiteJSON.url);

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(sitesTable);
            expect(builder.where).toHaveBeenCalledWith(
                and(eq(sitesTable.name, testDataSiteJSON.name), eq(sitesTable.url, testDataSiteJSON.url))
            );
            expect(builder.limit).toHaveBeenCalledWith(1);
            expect(builder.execute).toHaveBeenCalled();

            expect(site).toBeNull();
        });
    });

    describe('SiteRepository.insert', () => {
        const siteInsertPayload = {
            name: testDataSiteJSON.name,
            url: testDataSiteJSON.url,
            apiKey: testDataSiteJSON.apiKey,
            environment: testDataSiteJSON.environment,
        };

        const fixedSystemTime = new Date('2026-01-01T00:00:00Z');

        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(fixedSystemTime);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should insert a new site and return it', async () => {
            const builder = {
                values: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        id: testDataSiteJSON.id,
                        createdAt: fixedSystemTime,
                        updatedAt: fixedSystemTime,
                        ...siteInsertPayload,
                        phpVersion: null,
                        wpVersion: null,
                    },
                ]),
            };

            (database.insert as jest.Mock).mockReturnValueOnce(builder);

            const insertedSite = await siteRepository.insert(siteInsertPayload);

            expect(database.insert).toHaveBeenCalledWith(sitesTable);
            expect(builder.values).toHaveBeenCalledWith({
                createdAt: fixedSystemTime,
                updatedAt: fixedSystemTime,
                ...siteInsertPayload,
                phpVersion: null,
                wpVersion: null,
            });
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(insertedSite).not.toBeNull();
            expect(insertedSite).toEqualSiteEntity(
                new Site({
                    ...testDataSiteJSON,
                    createdAt: fixedSystemTime,
                    updatedAt: fixedSystemTime,
                    phpVersion: null,
                    wpVersion: null,
                })
            );
        });

        it('should return null when the site insert fails', async () => {
            const builder = {
                values: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([]),
            };

            (database.insert as jest.Mock).mockReturnValueOnce(builder);

            const insertedSite = await siteRepository.insert(siteInsertPayload);

            expect(database.insert).toHaveBeenCalledWith(sitesTable);
            expect(builder.values).toHaveBeenCalledWith({
                createdAt: fixedSystemTime,
                updatedAt: fixedSystemTime,
                ...siteInsertPayload,
                phpVersion: null,
                wpVersion: null,
            });
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(insertedSite).toBeNull();
        });
    });

    describe('SiteRepository.update', () => {
        const siteUpdatePayload = {
            id: testDataSiteJSON.id,
            name: testDataSiteJSON.name,
            url: testDataSiteJSON.url,
            apiKey: testDataSiteJSON.apiKey,
            environment: testDataSiteJSON.environment,
            phpVersion: testDataSiteJSON.phpVersion,
            wpVersion: testDataSiteJSON.wpVersion,
        };

        const fixedSystemTime = new Date('2026-01-01T00:00:00Z');

        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(fixedSystemTime);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should update a site and return it', async () => {
            const builder = {
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        createdAt: testDataSiteJSON.createdAt,
                        updatedAt: fixedSystemTime,
                        ...siteUpdatePayload,
                    },
                ]),
            };

            (database.update as jest.Mock).mockReturnValueOnce(builder);

            const updatedSite = await siteRepository.update(siteUpdatePayload);

            expect(database.update).toHaveBeenCalledWith(sitesTable);
            expect(builder.set).toHaveBeenCalledWith({
                updatedAt: fixedSystemTime,
                name: siteUpdatePayload.name,
                url: siteUpdatePayload.url,
                apiKey: siteUpdatePayload.apiKey,
                environment: siteUpdatePayload.environment,
                phpVersion: siteUpdatePayload.phpVersion,
                wpVersion: siteUpdatePayload.wpVersion,
            });
            expect(builder.where).toHaveBeenCalledWith(eq(sitesTable.id, siteUpdatePayload.id));
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(updatedSite).not.toBeNull();
            expect(updatedSite).toEqualSiteEntity(
                new Site({
                    ...testDataSiteJSON,
                    updatedAt: fixedSystemTime,
                })
            );
        });

        it('should return null when the site update fails', async () => {
            const builder = {
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([]),
            };

            (database.update as jest.Mock).mockReturnValueOnce(builder);

            const updatedSite = await siteRepository.update(siteUpdatePayload);

            expect(database.update).toHaveBeenCalledWith(sitesTable);
            expect(builder.set).toHaveBeenCalledWith({
                updatedAt: fixedSystemTime,
                name: siteUpdatePayload.name,
                url: siteUpdatePayload.url,
                apiKey: siteUpdatePayload.apiKey,
                environment: siteUpdatePayload.environment,
                phpVersion: siteUpdatePayload.phpVersion,
                wpVersion: siteUpdatePayload.wpVersion,
            });
            expect(builder.where).toHaveBeenCalledWith(eq(sitesTable.id, siteUpdatePayload.id));
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(updatedSite).toBeNull();
        });
    });

    describe('SiteRepository.delete', () => {
        it('should delete a site and return true', async () => {
            const builder = {
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue({ changes: 1 }),
            };

            (database.delete as jest.Mock).mockReturnValueOnce(builder);

            const isDeleted = await siteRepository.delete(testDataSiteJSON.id);

            expect(database.delete).toHaveBeenCalledWith(sitesTable);
            expect(builder.where).toHaveBeenCalledWith(eq(sitesTable.id, testDataSiteJSON.id));
            expect(builder.execute).toHaveBeenCalled();

            expect(isDeleted).toBeTruthy();
        });

        it('should fail to delete a site and return false', async () => {
            const builder = {
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue({ changes: 0 }),
            };

            (database.delete as jest.Mock).mockReturnValueOnce(builder);

            const isDeleted = await siteRepository.delete(testDataSiteJSON.id);

            expect(database.delete).toHaveBeenCalledWith(sitesTable);
            expect(builder.where).toHaveBeenCalledWith(eq(sitesTable.id, testDataSiteJSON.id));
            expect(builder.execute).toHaveBeenCalled();

            expect(isDeleted).toBeFalsy();
        });
    });
});
