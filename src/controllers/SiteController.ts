import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import PluginRepository from 'src/repositories/PluginRepository';
import SiteRepository from 'src/repositories/SiteRepository';
import LatestVersionResolver from 'src/resolver/latest-version/LatestVersionResolver';
import Logger from 'src/services/logger/Logger';
import AbstractController from 'src/services/server/AbstractController';
import RouteError from 'src/services/server/RouteError';
import Utils from 'src/Utils';

export default class SiteController extends AbstractController {
    protected readonly prefix = '/site';

    private readonly siteRepository: SiteRepository;
    private readonly pluginRepository: PluginRepository;
    private readonly latestVersionResolver: LatestVersionResolver;

    constructor(
        logger: Logger,
        siteRepository: SiteRepository,
        pluginRepository: PluginRepository,
        latestVersionResolver: LatestVersionResolver
    ) {
        super(logger);

        this.siteRepository = siteRepository;
        this.pluginRepository = pluginRepository;
        this.latestVersionResolver = latestVersionResolver;

        this.useRoutes();
    }

    protected useRoutes(): void {
        this.router.get('/', this.allRoute.bind(this));
        this.router.get('/:siteId', this.singleRoute.bind(this));
        this.router.post('/', this.registerRoute.bind(this));
        this.router.put('/:siteId', this.accessMiddleware.bind(this), this.updateRoute.bind(this));
    }

    private async accessMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const siteId = req.params.siteId;

            if (siteId === undefined || isNaN(Number(siteId))) {
                throw new RouteError(400, 'The parameter "siteId" is required and must be a valid number');
            }

            const { 'x-auth-token': xAuthToken } = req.headers;

            if (!xAuthToken || typeof xAuthToken !== 'string') {
                throw new RouteError(401, 'The "X-Auth-Token" header is required');
            }

            const site = await this.siteRepository.findById(Number(siteId));

            if (!site) {
                throw new RouteError(404, 'Failed to find a site with the given Id');
            }

            if (site.getApiKey() !== xAuthToken) {
                throw new RouteError(403, 'The "X-Auth-Token" header is invalid');
            }

            req.site = site;

            next();
        } catch (e) {
            next(e);
        }
    }

    private async allRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const sites = await this.siteRepository.findAll();

            res.status(200).json({
                message: 'Successfully retrieved all sites',
                data: sites.map((site) => ({
                    id: site.getId(),
                    name: site.getName(),
                    url: site.getUrl(),
                    environment: site.getEnvironment(),
                })),
            });
        } catch (e) {
            next(e);
        }
    }

    private async singleRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const siteId = req.params.siteId;

            if (siteId === undefined || isNaN(Number(siteId))) {
                throw new RouteError(400, 'The parameter "siteId" is required and must be a valid number');
            }

            const site = await this.siteRepository.findById(Number(siteId));

            if (!site) {
                throw new RouteError(404, 'Failed to find a site with the given Id');
            }

            const installedPhpVersion = site.getPhpVersion();
            const installedWordPressVersion = site.getWpVersion();
            const latestPhpVersion = this.latestVersionResolver.resolvePhp();
            const latestWordPressVersion = this.latestVersionResolver.resolveWordPress();

            res.status(200).json({
                message: 'Successfully retrieved site',
                data: {
                    id: site.getId(),
                    name: site.getName(),
                    url: site.getUrl(),
                    environment: site.getEnvironment(),
                    phpVersion: {
                        installed: installedPhpVersion,
                        latest: latestPhpVersion,
                        difference:
                            installedPhpVersion && latestPhpVersion
                                ? Utils.categorizeVersionDifference(installedPhpVersion, latestPhpVersion)
                                : null,
                    },
                    wpVersion: {
                        installed: installedWordPressVersion,
                        latest: latestWordPressVersion,
                        difference:
                            installedWordPressVersion && latestWordPressVersion
                                ? Utils.categorizeVersionDifference(installedWordPressVersion, latestWordPressVersion)
                                : null,
                    },
                },
            });
        } catch (e) {
            next(e);
        }
    }

    private async registerRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.registerRouteBodyValidator(req.body);

            const { name, url, environment } = req.body;

            const apiKey = crypto.randomBytes(32).toString('hex');

            const existingSite = await this.siteRepository.findByNameAndUrl(name, url);

            if (existingSite) {
                const updatedSite = await this.siteRepository.update({
                    id: existingSite.getId(),
                    name: existingSite.getName(),
                    url: existingSite.getUrl(),
                    environment: environment,
                    apiKey: apiKey,
                    phpVersion: existingSite.getPhpVersion(),
                    wpVersion: existingSite.getWpVersion(),
                });

                if (!updatedSite) {
                    throw new RouteError(500, 'Failed to update site');
                }

                res.status(200).json({
                    message: 'Successfully re-registered site',
                    data: {
                        id: updatedSite.getId(),
                        name: updatedSite.getName(),
                        url: updatedSite.getUrl(),
                        apiKey: updatedSite.getApiKey(),
                        environment: updatedSite.getEnvironment(),
                    },
                });

                return;
            }

            const createdSite = await this.siteRepository.insert({ name, url, environment, apiKey });

            if (!createdSite) {
                throw new RouteError(500, 'Failed to create site');
            }

            res.status(201).json({
                message: 'Successfully registered site',
                data: {
                    id: createdSite.getId(),
                    name: createdSite.getName(),
                    url: createdSite.getUrl(),
                    apiKey: createdSite.getApiKey(),
                    environment: createdSite.getEnvironment(),
                },
            });
        } catch (e) {
            next(e);
        }
    }

    private async updateRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.updateRouteBodyValidator(req.body);

            const siteId = req.site.getId();
            const { name, url, phpVersion, wpVersion, plugins } = req.body;

            const updatedSite = await this.siteRepository.update({
                id: siteId,
                name,
                url,
                environment: req.site.getEnvironment(),
                apiKey: req.site.getApiKey(),
                phpVersion: Utils.formatVersion(phpVersion),
                wpVersion: Utils.formatVersion(wpVersion),
            });

            if (!updatedSite) {
                throw new RouteError(500, 'Failed to update site');
            }

            for (const plugin of plugins) {
                const { file, name } = plugin;

                const slug = Utils.getPluginSlugFromFile(file);

                if (!slug) {
                    this.logger.warn('Invalid plugin file format', { file });
                    continue;
                }

                if (!(await this.pluginRepository.findBySlug(slug))) {
                    this.logger.info('Plugin not found in database. Creating new plugin entry', {
                        slug,
                        name,
                    });

                    if (
                        !(await this.pluginRepository.insert({
                            slug,
                            name,
                            latestVersion: null,
                            requiredPhpVersion: null,
                            requiredWpVersion: null,
                        }))
                    ) {
                        this.logger.error('Failed to create plugin entry', { slug, name });
                    }
                }
            }

            res.status(200).json({
                message: 'Successfully updated site',
                data: {
                    id: updatedSite.getId(),
                    name: updatedSite.getName(),
                    url: updatedSite.getUrl(),
                    environment: updatedSite.getEnvironment(),
                    phpVersion: updatedSite.getPhpVersion(),
                    wpVersion: updatedSite.getWpVersion(),
                },
            });
        } catch (e) {
            next(e);
        }
    }

    private registerRouteBodyValidator(body: { name: string; url: string; environment: string }): void {
        const { name, url, environment } = body;

        if (!name || typeof name !== 'string' || name.trim() === '') {
            throw new RouteError(400, 'The field "name" is required and must be a non-empty string');
        }

        if (!url || typeof url !== 'string' || url.trim() === '') {
            throw new RouteError(400, 'The field "url" is required and must be a non-empty string');
        }

        if (!environment || !['production', 'staging', 'development'].includes(environment)) {
            throw new RouteError(
                400,
                'The field "environment" is required and must either be "production", "staging" or "development"'
            );
        }
    }

    private updateRouteBodyValidator(body: {
        name: string;
        phpVersion: string;
        wpVersion: string;
        url: string;
        plugins: {
            file: string;
            name: string;
        }[];
    }): void {
        const { name, url, phpVersion, wpVersion, plugins } = body;

        if (!name || typeof name !== 'string' || name.trim() === '') {
            throw new RouteError(400, 'The field "name" is required and must be a non-empty string');
        }

        if (!url || typeof url !== 'string' || url.trim() === '') {
            throw new RouteError(400, 'The field "url" is required and must be a non-empty string');
        }

        if (!phpVersion || typeof phpVersion !== 'string' || Utils.formatVersion(phpVersion) === 'invalid-version') {
            throw new RouteError(400, 'The field "phpVersion" is required and must be a valid version string');
        }

        if (!wpVersion || typeof wpVersion !== 'string' || Utils.formatVersion(wpVersion) === 'invalid-version') {
            throw new RouteError(400, 'The field "wpVersion" is required and must be a valid version string');
        }

        if (!Array.isArray(plugins)) {
            throw new RouteError(400, 'The field "plugins" is required and must be an array');
        }

        if (plugins.length > 0) {
            for (let i = 0; i < plugins.length; i++) {
                const plugin = plugins[i];

                if (!plugin.file || typeof plugin.file !== 'string') {
                    throw new RouteError(400, `The field "plugins[${i}].file" is required and must be a string`);
                }

                if (!plugin.name || typeof plugin.name !== 'string') {
                    throw new RouteError(400, `The field "plugins[${i}].name" is required and must be a string`);
                }
            }
        }
    }
}
