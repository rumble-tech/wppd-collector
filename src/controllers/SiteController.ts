import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import PluginRepository from 'src/repositories/PluginRepository';
import PluginVulnerabilityRepository from 'src/repositories/PluginVulnerabilityRepository';
import SitePluginRepository from 'src/repositories/SitePluginRepository';
import SiteRepository from 'src/repositories/SiteRepository';
import LatestVersionResolver from 'src/resolver/latest-version/LatestVersionResolver';
import VulnerabilitiesResolver from 'src/resolver/vulnerabilities/VulnerabilitiesResolver';
import Logger from 'src/services/logger/Logger';
import AbstractController from 'src/services/server/AbstractController';
import RouteError from 'src/services/server/RouteError';
import Utils from 'src/Utils';
import SitePlugin from '../entities/SitePlugin';

export default class SiteController extends AbstractController {
    protected readonly prefix = '/site';

    private readonly siteRepository: SiteRepository;
    private readonly pluginRepository: PluginRepository;
    private readonly sitePluginRepository: SitePluginRepository;
    private readonly pluginVulnerabilityRepository: PluginVulnerabilityRepository;
    private readonly latestVersionResolver: LatestVersionResolver;
    private readonly vulnerabilitiesResolver: VulnerabilitiesResolver;

    constructor(
        logger: Logger,
        siteRepository: SiteRepository,
        pluginRepository: PluginRepository,
        sitePluginRepository: SitePluginRepository,
        pluginVulnerabilityRepository: PluginVulnerabilityRepository,
        latestVersionResolver: LatestVersionResolver,
        vulnerabilitiesResolver: VulnerabilitiesResolver
    ) {
        super(logger);

        this.siteRepository = siteRepository;
        this.pluginRepository = pluginRepository;
        this.sitePluginRepository = sitePluginRepository;
        this.pluginVulnerabilityRepository = pluginVulnerabilityRepository;
        this.latestVersionResolver = latestVersionResolver;
        this.vulnerabilitiesResolver = vulnerabilitiesResolver;

        this.useRoutes();
    }

    protected useRoutes(): void {
        this.router.get('/', this.allRoute.bind(this));
        this.router.get('/:siteId', this.singleRoute.bind(this));
        this.router.get('/:siteId/plugins', this.singlePluginsRoute.bind(this));
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

    private async singlePluginsRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const siteId = req.params.siteId;

            if (siteId === undefined || isNaN(Number(siteId))) {
                throw new RouteError(400, 'The parameter "siteId" is required and must be a valid number');
            }

            const site = await this.siteRepository.findById(Number(siteId));

            if (!site) {
                throw new RouteError(404, 'Failed to find a site with the given Id');
            }

            const sitePlugins = await this.sitePluginRepository.findAllBySiteId(Number(siteId));
            const pluginsData = (
                await Promise.all(
                    sitePlugins.map(async (sitePlugin) => {
                        const plugin = await this.pluginRepository.findById(sitePlugin.getPluginId());
                        if (!plugin) {
                            return null;
                        }

                        const installedVersion = sitePlugin.getInstalledVersion();
                        const latestVersion = plugin.getLatestVersion();
                        const vulnerabilities = await this.pluginVulnerabilityRepository.findAllByPluginId(
                            plugin.getId()
                        );

                        const filteredVulnerabilities = vulnerabilities.filter((vulnerability) => {
                            if (installedVersion === null) {
                                return true;
                            }

                            const fromVersion = vulnerability.getFromVersion();
                            const toVersion = vulnerability.getToVersion();

                            let satisfiesLowerBound = true;
                            if (fromVersion.version !== '*') {
                                const cmpFrom = Utils.compareVersions(installedVersion, fromVersion.version);

                                if (cmpFrom === 'invalid') {
                                    satisfiesLowerBound = true;
                                } else if (cmpFrom === 'greater') {
                                    satisfiesLowerBound = true;
                                } else if (cmpFrom === 'equal') {
                                    satisfiesLowerBound = fromVersion.inclusive;
                                } else if (cmpFrom === 'less') {
                                    satisfiesLowerBound = false;
                                }
                            }

                            let satisfiesUpperBound = true;
                            if (toVersion.version !== '*') {
                                const cmpTo = Utils.compareVersions(installedVersion, toVersion.version);

                                if (cmpTo === 'invalid') {
                                    satisfiesUpperBound = true;
                                } else if (cmpTo === 'less') {
                                    satisfiesUpperBound = true;
                                } else if (cmpTo === 'equal') {
                                    satisfiesUpperBound = toVersion.inclusive;
                                } else if (cmpTo === 'greater') {
                                    satisfiesUpperBound = false;
                                }
                            }

                            return satisfiesLowerBound && satisfiesUpperBound;
                        });

                        return {
                            id: plugin.getId(),
                            slug: plugin.getSlug(),
                            name: plugin.getName(),
                            installedVersion: {
                                version: sitePlugin.getInstalledVersion(),
                                requiredPhpVersion: sitePlugin.getRequiredPhpVersion(),
                                requiredWpVersion: sitePlugin.getRequiredWpVersion(),
                            },
                            latestVersion: {
                                version: plugin.getLatestVersion(),
                                requiredPhpVersion: plugin.getRequiredPhpVersion(),
                                requiredWpVersion: plugin.getRequiredWpVersion(),
                            },
                            versionDifference:
                                installedVersion && latestVersion
                                    ? Utils.categorizeVersionDifference(installedVersion, latestVersion)
                                    : null,
                            isActive: sitePlugin.getIsActive(),
                            vulnerabilities: {
                                count: filteredVulnerabilities.length,
                                maxSeverity: filteredVulnerabilities.reduce(
                                    (max, vulnerability) => Math.max(max, vulnerability.getSeverity()),
                                    0
                                ),
                                details: filteredVulnerabilities
                                    .map((vulnerability) => ({
                                        description: vulnerability.getDescription(),
                                        publishedAt: vulnerability.getPublishedAt(),
                                        severity: vulnerability.getSeverity(),
                                        references: vulnerability.getReferences(),
                                        fromVersion: vulnerability.getFromVersion(),
                                        toVersion: vulnerability.getToVersion(),
                                    }))
                                    .sort(
                                        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
                                    ),
                            },
                        };
                    })
                )
            ).filter((plugin) => plugin !== null);

            res.status(200).json({
                message: 'Successfully retrieved site plugins',
                data: pluginsData,
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

                    const latestPluginVersion = await this.latestVersionResolver.resolvePlugin(slug);

                    const createdPlugin = await this.pluginRepository.insert({
                        slug,
                        name,
                        latestVersion: latestPluginVersion.version,
                        requiredPhpVersion: latestPluginVersion.requiredPhpVersion,
                        requiredWpVersion: latestPluginVersion.requiredWpVersion,
                    });

                    if (!createdPlugin) {
                        this.logger.error('Failed to create plugin entry', { slug, name });
                        continue;
                    }

                    const vulnerabilities = await this.vulnerabilitiesResolver.resolvePlugin(slug);

                    if (!vulnerabilities || !Array.isArray(vulnerabilities)) {
                        this.logger.error('Failed to fetch vulnerabilities for plugin after creation', { slug });
                    } else {
                        await this.pluginVulnerabilityRepository.deleteAllByPluginId(createdPlugin.getId());

                        for (const vulnerability of vulnerabilities) {
                            if (
                                !(await this.pluginVulnerabilityRepository.insert({
                                    pluginId: createdPlugin.getId(),
                                    description: vulnerability.description,
                                    publishedAt: vulnerability.publishedAt,
                                    severity: vulnerability.severity,
                                    references: vulnerability.references,
                                    fromVersion: vulnerability.fromVersion,
                                    toVersion: vulnerability.toVersion,
                                }))
                            ) {
                                this.logger.error('Failed to insert plugin vulnerability', { slug, vulnerability });
                            } else {
                                this.logger.info('Successfully inserted plugin vulnerability', { slug, vulnerability });
                            }
                        }
                    }
                }

                const dbPlugin = await this.pluginRepository.findBySlug(slug);

                if (!dbPlugin) {
                    this.logger.error('Plugin not found after insertion attempt', { slug });
                    continue;
                }

                if (!(await this.sitePluginRepository.findBySiteIdAndPluginId(req.site.getId(), dbPlugin.getId()))) {
                    this.logger.info('Site plugin not found in database. Creating new site plugin entry', {
                        site: {
                            id: req.site.getId(),
                            name: req.site.getName(),
                        },
                        plugin: {
                            id: dbPlugin.getId(),
                            slug: dbPlugin.getSlug(),
                        },
                    });

                    if (
                        !(await this.sitePluginRepository.insert({
                            siteId: req.site.getId(),
                            pluginId: dbPlugin.getId(),
                            installedVersion: plugin.version.installedVersion,
                            requiredPhpVersion: plugin.version.requiredPhpVersion,
                            requiredWpVersion: plugin.version.requiredWpVersion,
                            isActive: plugin.active,
                        }))
                    ) {
                        this.logger.error('Failed to create site plugin entry', {
                            siteId: req.site.getId(),
                            pluginId: dbPlugin.getId(),
                        });

                        continue;
                    }

                    this.logger.info('Successfully created site plugin entry', {
                        siteId: req.site.getId(),
                        pluginId: dbPlugin.getId(),
                    });
                } else {
                    this.logger.info('Site plugin entry already exists. Updating.', {
                        site: {
                            id: req.site.getId(),
                            name: req.site.getName(),
                        },
                        plugin: {
                            id: dbPlugin.getId(),
                            slug: dbPlugin.getSlug(),
                        },
                    });

                    if (
                        !(await this.sitePluginRepository.update({
                            siteId: req.site.getId(),
                            pluginId: dbPlugin.getId(),
                            installedVersion: plugin.version.installedVersion,
                            requiredPhpVersion: plugin.version.requiredPhpVersion,
                            requiredWpVersion: plugin.version.requiredWpVersion,
                            isActive: plugin.active,
                        }))
                    ) {
                        this.logger.error('Failed to update site plugin entry', {
                            siteId: req.site.getId(),
                            pluginId: dbPlugin.getId(),
                        });

                        continue;
                    }

                    this.logger.info('Successfully updated site plugin entry', {
                        siteId: req.site.getId(),
                        pluginId: dbPlugin.getId(),
                    });
                }
            }

            const allSitePlugins = await this.sitePluginRepository.findAllBySiteId(req.site.getId());
            const receivedPluginSlugs = plugins.map((plugin) => Utils.getPluginSlugFromFile(plugin.file));

            const deletableSitePlugins = (
                await Promise.all(
                    allSitePlugins.map(async (sitePlugin) => {
                        const plugin = await this.pluginRepository.findById(sitePlugin.getPluginId());
                        if (!plugin) {
                            return undefined; // Return undefined instead of null
                        }

                        return receivedPluginSlugs.includes(plugin.getSlug()) ? undefined : sitePlugin;
                    })
                )
            ).filter((sitePlugin): sitePlugin is SitePlugin => Boolean(sitePlugin)); // Type guard to ensure only SitePlugin remains

            for (const sitePlugin of deletableSitePlugins) {
                this.logger.info('Deleting site plugin entry as it was not included in the update payload', {
                    siteId: req.site.getId(),
                    pluginId: sitePlugin.getPluginId(),
                });

                if (!(await this.sitePluginRepository.delete(sitePlugin.getSiteId(), sitePlugin.getPluginId()))) {
                    this.logger.error('Failed to delete site plugin entry', {
                        siteId: req.site.getId(),
                        pluginId: sitePlugin.getPluginId(),
                    });

                    continue;
                }

                this.logger.info('Successfully deleted site plugin entry', {
                    siteId: req.site.getId(),
                    pluginId: sitePlugin.getPluginId(),
                });
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
            active: boolean;
            version: {
                installedVersion: string | null;
                requiredPhpVersion: string | null;
                requiredWpVersion: string | null;
            };
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

                if (typeof plugin.active !== 'boolean') {
                    throw new RouteError(400, `The field "plugins[${i}].active" is required and must be a boolean`);
                }

                if (!plugin.version || typeof plugin.version !== 'object') {
                    throw new RouteError(400, `The field "plugins[${i}].version" is required and must be an object`);
                }

                if (
                    plugin.version.installedVersion === undefined ||
                    (plugin.version.installedVersion !== null &&
                        (typeof plugin.version.installedVersion !== 'string' ||
                            Utils.formatVersion(plugin.version.installedVersion) === 'invalid-version'))
                ) {
                    throw new RouteError(
                        400,
                        `The field "plugins[${i}].version.installedVersion" is required and must be a valid version string or null`
                    );
                }

                if (
                    plugin.version.requiredPhpVersion === undefined ||
                    (plugin.version.requiredPhpVersion !== null &&
                        (typeof plugin.version.requiredPhpVersion !== 'string' ||
                            Utils.formatVersion(plugin.version.requiredPhpVersion) === 'invalid-version'))
                ) {
                    throw new RouteError(
                        400,
                        `The field "plugins[${i}].version.requiredPhpVersion" is required and must be a valid version string or null`
                    );
                }

                if (
                    plugin.version.requiredWpVersion === undefined ||
                    (plugin.version.requiredWpVersion !== null &&
                        (typeof plugin.version.requiredWpVersion !== 'string' ||
                            Utils.formatVersion(plugin.version.requiredWpVersion) === 'invalid-version'))
                ) {
                    throw new RouteError(
                        400,
                        `The field "plugins[${i}].version.requiredWpVersion" is required and must be a valid version string or null`
                    );
                }
            }
        }
    }
}
