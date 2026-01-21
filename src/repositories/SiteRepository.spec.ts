import { and, eq } from 'drizzle-orm';
import SiteRepository from 'src/repositories/SiteRepository';
import { TDatabase, TSitesTable } from 'src/services/database/Types';

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
                execute: jest.fn().mockResolvedValue([
                    {
                        id: 1,
                        createdAt: new Date('2026-01-01T00:00:00Z'),
                        updatedAt: new Date('2026-01-02T00:00:00Z'),
                        name: 'Site1',
                        url: 'https://example.com/site1',
                        apiKey: 'api-key-1',
                        environment: 'development',
                        phpVersion: '8.5.1',
                        wpVersion: '6.9.0',
                    },
                ]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const sites = await siteRepository.findAll();

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(sitesTable);
            expect(builder.execute).toHaveBeenCalled();

            expect(sites[0].getId()).toBe(1);
            expect(sites[0].getCreatedAt()).toEqual(new Date('2026-01-01T00:00:00Z'));
            expect(sites[0].getUpdatedAt()).toEqual(new Date('2026-01-02T00:00:00Z'));
            expect(sites[0].getName()).toBe('Site1');
            expect(sites[0].getUrl()).toBe('https://example.com/site1');
            expect(sites[0].getApiKey()).toBe('api-key-1');
            expect(sites[0].getEnvironment()).toBe('development');
            expect(sites[0].getPhpVersion()).toBe('8.5.1');
            expect(sites[0].getWpVersion()).toBe('6.9.0');
        });
    });

    describe('SiteRepository.findById', () => {
        it('should return one site by its id', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([
                    {
                        id: 1,
                        createdAt: new Date('2026-01-01T00:00:00Z'),
                        updatedAt: new Date('2026-01-02T00:00:00Z'),
                        name: 'Site1',
                        url: 'https://example.com/site1',
                        apiKey: 'api-key-1',
                        environment: 'development',
                        phpVersion: '8.5.1',
                        wpVersion: '6.9.0',
                    },
                ]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const site = await siteRepository.findById(1);

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(sitesTable);
            expect(builder.where).toHaveBeenCalledWith(eq(sitesTable.id, 1));
            expect(builder.limit).toHaveBeenCalledWith(1);
            expect(builder.execute).toHaveBeenCalled();

            expect(site).not.toBeNull();
            expect(site?.getId()).toBe(1);
            expect(site?.getCreatedAt()).toEqual(new Date('2026-01-01T00:00:00Z'));
            expect(site?.getUpdatedAt()).toEqual(new Date('2026-01-02T00:00:00Z'));
            expect(site?.getName()).toBe('Site1');
            expect(site?.getUrl()).toBe('https://example.com/site1');
            expect(site?.getApiKey()).toBe('api-key-1');
            expect(site?.getEnvironment()).toBe('development');
            expect(site?.getPhpVersion()).toBe('8.5.1');
            expect(site?.getWpVersion()).toBe('6.9.0');
        });

        it('should return null if the site could not be found by its id', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const site = await siteRepository.findById(1);

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(sitesTable);
            expect(builder.where).toHaveBeenCalledWith(eq(sitesTable.id, 1));
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
                execute: jest.fn().mockResolvedValue([
                    {
                        id: 1,
                        createdAt: new Date('2026-01-01T00:00:00Z'),
                        updatedAt: new Date('2026-01-02T00:00:00Z'),
                        name: 'Site1',
                        url: 'https://example.com/site1',
                        apiKey: 'api-key-1',
                        environment: 'development',
                        phpVersion: '8.5.1',
                        wpVersion: '6.9.0',
                    },
                ]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const site = await siteRepository.findByNameAndUrl('Site1', 'https://example.com/site1');

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(sitesTable);
            expect(builder.where).toHaveBeenCalledWith(
                and(eq(sitesTable.name, 'Site1'), eq(sitesTable.url, 'https://example.com/site1'))
            );
            expect(builder.limit).toHaveBeenCalledWith(1);
            expect(builder.execute).toHaveBeenCalled();

            expect(site).not.toBeNull();
            expect(site?.getId()).toBe(1);
            expect(site?.getCreatedAt()).toEqual(new Date('2026-01-01T00:00:00Z'));
            expect(site?.getUpdatedAt()).toEqual(new Date('2026-01-02T00:00:00Z'));
            expect(site?.getName()).toBe('Site1');
            expect(site?.getUrl()).toBe('https://example.com/site1');
            expect(site?.getApiKey()).toBe('api-key-1');
            expect(site?.getEnvironment()).toBe('development');
            expect(site?.getPhpVersion()).toBe('8.5.1');
            expect(site?.getWpVersion()).toBe('6.9.0');
        });

        it('should return null if the site could not be found by its name and url', async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([]),
            };

            (database.select as jest.Mock).mockReturnValueOnce(builder);

            const site = await siteRepository.findByNameAndUrl('Site1', 'https://example.com/site1');

            expect(database.select).toHaveBeenCalled();
            expect(builder.from).toHaveBeenCalledWith(sitesTable);
            expect(builder.where).toHaveBeenCalledWith(
                and(eq(sitesTable.name, 'Site1'), eq(sitesTable.url, 'https://example.com/site1'))
            );
            expect(builder.limit).toHaveBeenCalledWith(1);
            expect(builder.execute).toHaveBeenCalled();

            expect(site).toBeNull();
        });
    });

    describe('SiteRepository.insert', () => {
        const sitePayload = {
            name: 'Site1',
            url: 'https://example.com/site1',
            apiKey: 'api-key-1',
            environment: 'development',
        } as const;

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
                        id: 1,
                        createdAt: fixedSystemTime,
                        updatedAt: fixedSystemTime,
                        ...sitePayload,
                        phpVersion: null,
                        wpVersion: null,
                    },
                ]),
            };

            (database.insert as jest.Mock).mockReturnValueOnce(builder);

            const insertedSite = await siteRepository.insert(sitePayload);

            expect(database.insert).toHaveBeenCalledWith(sitesTable);
            expect(builder.values).toHaveBeenCalledWith({
                createdAt: fixedSystemTime,
                updatedAt: fixedSystemTime,
                ...sitePayload,
                phpVersion: null,
                wpVersion: null,
            });
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(insertedSite).not.toBeNull();
            expect(insertedSite?.getId()).toBe(1);
            expect(insertedSite?.getCreatedAt()).toEqual(fixedSystemTime);
            expect(insertedSite?.getUpdatedAt()).toEqual(fixedSystemTime);
            expect(insertedSite?.getName()).toBe(sitePayload.name);
            expect(insertedSite?.getUrl()).toBe(sitePayload.url);
            expect(insertedSite?.getApiKey()).toBe(sitePayload.apiKey);
            expect(insertedSite?.getEnvironment()).toBe(sitePayload.environment);
            expect(insertedSite?.getPhpVersion()).toBeNull();
            expect(insertedSite?.getWpVersion()).toBeNull();
        });

        it('should return null when the site insert fails', async () => {
            const builder = {
                values: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([]),
            };

            (database.insert as jest.Mock).mockReturnValueOnce(builder);

            const insertedSite = await siteRepository.insert(sitePayload);

            expect(database.insert).toHaveBeenCalledWith(sitesTable);
            expect(builder.values).toHaveBeenCalledWith({
                createdAt: fixedSystemTime,
                updatedAt: fixedSystemTime,
                ...sitePayload,
                phpVersion: null,
                wpVersion: null,
            });
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(insertedSite).toBeNull();
        });
    });

    describe('SiteRepository.update', () => {
        const sitePayload = {
            id: 1,
            name: 'Site1',
            url: 'https://example.com/site1',
            apiKey: 'api-key-1',
            environment: 'development',
            phpVersion: '8.5.1',
            wpVersion: '6.9.0',
        } as const;

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
                        createdAt: fixedSystemTime,
                        updatedAt: fixedSystemTime,
                        ...sitePayload,
                    },
                ]),
            };

            (database.update as jest.Mock).mockReturnValueOnce(builder);

            const updatedSite = await siteRepository.update(sitePayload);

            expect(database.update).toHaveBeenCalledWith(sitesTable);
            expect(builder.set).toHaveBeenCalledWith({
                updatedAt: fixedSystemTime,
                name: sitePayload.name,
                url: sitePayload.url,
                apiKey: sitePayload.apiKey,
                environment: sitePayload.environment,
                phpVersion: sitePayload.phpVersion,
                wpVersion: sitePayload.wpVersion,
            });
            expect(builder.where).toHaveBeenCalledWith(eq(sitesTable.id, sitePayload.id));
            expect(builder.returning).toHaveBeenCalled();
            expect(builder.execute).toHaveBeenCalled();

            expect(updatedSite).not.toBeNull();
            expect(updatedSite?.getId()).toBe(1);
            expect(updatedSite?.getCreatedAt()).toEqual(fixedSystemTime);
            expect(updatedSite?.getUpdatedAt()).toEqual(fixedSystemTime);
            expect(updatedSite?.getName()).toBe(sitePayload.name);
            expect(updatedSite?.getUrl()).toBe(sitePayload.url);
            expect(updatedSite?.getApiKey()).toBe(sitePayload.apiKey);
            expect(updatedSite?.getEnvironment()).toBe(sitePayload.environment);
            expect(updatedSite?.getPhpVersion()).toBe(sitePayload.phpVersion);
            expect(updatedSite?.getWpVersion()).toBe(sitePayload.wpVersion);
        });

        it('should return null when the site update fails', async () => {
            const builder = {
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                returning: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([]),
            };

            (database.update as jest.Mock).mockReturnValueOnce(builder);

            const updatedSite = await siteRepository.update(sitePayload);

            expect(database.update).toHaveBeenCalledWith(sitesTable);
            expect(builder.set).toHaveBeenCalledWith({
                updatedAt: fixedSystemTime,
                name: sitePayload.name,
                url: sitePayload.url,
                apiKey: sitePayload.apiKey,
                environment: sitePayload.environment,
                phpVersion: sitePayload.phpVersion,
                wpVersion: sitePayload.wpVersion,
            });
            expect(builder.where).toHaveBeenCalledWith(eq(sitesTable.id, sitePayload.id));
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

            const isDeleted = await siteRepository.delete(1);

            expect(database.delete).toHaveBeenCalledWith(sitesTable);
            expect(builder.where).toHaveBeenCalledWith(eq(sitesTable.id, 1));
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

            const isDeleted = await siteRepository.delete(1);

            expect(database.delete).toHaveBeenCalledWith(sitesTable);
            expect(builder.where).toHaveBeenCalledWith(eq(sitesTable.id, 1));
            expect(builder.execute).toHaveBeenCalled();

            expect(isDeleted).toBeFalsy();
        });
    });
});
