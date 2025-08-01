import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { LoggerInterface } from 'src/components/logger/LoggerInterface';
import RouteError from 'src/components/server/RouteError';
import AbstractController from 'src/controllers/AbstractController';
import { TPluginVersion } from 'src/models/Plugin';
import { TSiteEnvironment } from 'src/models/Site';
import PluginRepository from 'src/repositories/PluginRepository';
import SiteRepository from 'src/repositories/SiteRepository';
import LatestVersionResolver from 'src/services/latest-version/LatestVersionResolver';
import Tools from 'src/Tools';

export default class SiteController extends AbstractController {
    private siteRepository: SiteRepository;
    private pluginRepository: PluginRepository;
    private latestVersionResolver: LatestVersionResolver;

    constructor(
        logger: LoggerInterface,
        siteRepository: SiteRepository,
        pluginRepository: PluginRepository,
        latestVersionResolver: LatestVersionResolver
    ) {
        super(logger);

        this.siteRepository = siteRepository;
        this.pluginRepository = pluginRepository;
        this.latestVersionResolver = latestVersionResolver;
    }

    protected useRoutes(): void {
        this.router.get('/', this.getSitesRoute.bind(this));
        this.router.get('/:siteId', this.getSiteRoute.bind(this));
        this.router.get('/:siteId/plugins', this.getSitePluginsRoute.bind(this));
        this.router.post('/register', this.registerRoute.bind(this));
        this.router.put('/:siteId/update', this.accessMiddleware.bind(this), this.updateRoute.bind(this));
    }

    private async accessMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const siteId = req.params.siteId;

            if (siteId === undefined || typeof siteId !== 'string' || isNaN(Number(siteId))) {
                throw new RouteError(400, 'The parameter "siteId" is required and must be a non-empty number');
            }

            const { authorization } = req.headers;

            if (!authorization || typeof authorization !== 'string') {
                throw new RouteError(401, 'The header "Authorization" is required');
            }

            const site = await this.siteRepository.findById(Number(siteId));

            if (!site) {
                throw new RouteError(404, 'A site with the given ID does not exist');
            }

            const token = authorization.split('Bearer ')[1];
            if (site.getToken() !== token) {
                throw new RouteError(403, 'The header "Authorization" is invalid');
            }

            req.site = site;
            next();
        } catch (err) {
            next(err);
        }
    }

    private async getSitesRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const siteEnvironment = req.query.environment;

            if (
                siteEnvironment !== undefined &&
                (typeof siteEnvironment !== 'string' ||
                    !['production', 'staging', 'development'].includes(siteEnvironment as string))
            ) {
                throw new RouteError(
                    400,
                    'The query parameter "environment" must be either "production", "staging", or "development"'
                );
            }

            const sites = await this.siteRepository.findAll(siteEnvironment as TSiteEnvironment | null);

            res.status(200).json({
                message: 'Sites retrieved successfully',
                data: sites.map((site) => ({
                    id: site.getId(),
                    name: site.getName(),
                    url: site.getUrl(),
                    environment: site.getEnvironment(),
                })),
            });
        } catch (err) {
            next(err);
        }
    }

    private async getSiteRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const siteId = req.params.siteId;

            if (siteId === undefined || typeof siteId !== 'string' || isNaN(Number(siteId))) {
                throw new RouteError(400, 'The parameter "siteId" is required and must be a non-empty number');
            }

            const site = await this.siteRepository.findById(Number(siteId));

            if (!site) {
                throw new RouteError(404, 'A site with the given ID does not exist');
            }

            const sitePhpVersion = site.getPhpVersion();
            const siteWpVersion = site.getWpVersion();
            const latestPhpVersion = await this.latestVersionResolver.resolvePhp();
            const latestWpVersion = await this.latestVersionResolver.resolveWp();

            res.status(200).json({
                message: 'Site retrieved successfully',
                data: {
                    id: site.getId(),
                    name: site.getName(),
                    url: site.getUrl(),
                    environment: site.getEnvironment(),
                    phpVersion: {
                        installed: site.getPhpVersion(),
                        latest: latestPhpVersion,
                        diff:
                            sitePhpVersion && latestPhpVersion
                                ? Tools.categorizeVersionDiff(sitePhpVersion, latestPhpVersion)
                                : null,
                    },
                    wpVersion: {
                        installed: siteWpVersion,
                        latest: latestWpVersion,
                        diff:
                            siteWpVersion && latestWpVersion
                                ? Tools.categorizeVersionDiff(siteWpVersion, latestWpVersion)
                                : null,
                    },
                },
            });
        } catch (err) {
            next(err);
        }
    }

    private async getSitePluginsRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const siteId = req.params.siteId;

            if (siteId === undefined || typeof siteId !== 'string' || isNaN(Number(siteId))) {
                throw new RouteError(400, 'The parameter "siteId" is required and must be a non-empty number');
            }

            if (!(await this.siteRepository.findById(Number(siteId)))) {
                throw new RouteError(404, 'A site with the given ID does not exist');
            }

            const sitePlugins = await this.siteRepository.findAllSitePlugins(Number(siteId));

            const pluginData = await Promise.all(
                sitePlugins.map(async (sitePlugin) => {
                    const installedVersion = sitePlugin.getInstalledVersion();
                    const latestVersion = sitePlugin.getLatestVersion();
                    const allVulnerabilities = await this.pluginRepository.findVulnerabilities(sitePlugin.getId());

                    const filteredVulnerabilities = allVulnerabilities.filter(({ to }) => {
                        if (to.version === '*' || !to.version || !installedVersion.version) {
                            return true;
                        }

                        const cmp = Tools.compareVersions(to.version, installedVersion.version);

                        if (cmp === null) {
                            return false;
                        }

                        return cmp > 0 || (cmp === 0 && to.inclusive);
                    });

                    const vulnerabilities = filteredVulnerabilities.map((vulnerabilitiy) => ({
                        from: vulnerabilitiy.from,
                        to: vulnerabilitiy.to,
                        score: vulnerabilitiy.score,
                    }));

                    return {
                        pluginId: sitePlugin.getId(),
                        name: sitePlugin.getName(),
                        slug: sitePlugin.getSlug(),
                        installedVersion: sitePlugin.getInstalledVersion(),
                        latestVersion: sitePlugin.getLatestVersion(),
                        versionDiff:
                            installedVersion['version'] && latestVersion['version']
                                ? Tools.categorizeVersionDiff(installedVersion['version'], latestVersion['version'])
                                : null,
                        isActive: sitePlugin.getIsActive(),
                        vulnerabilities: {
                            list: vulnerabilities,
                            count: vulnerabilities.length,
                            highestScore: vulnerabilities.reduce(
                                (max, vulnerability) => Math.max(max, vulnerability.score),
                                0
                            ),
                        },
                    };
                })
            );

            res.status(200).json({
                message: 'Site Plugins retrieved successfully',
                data: pluginData,
            });
        } catch (err) {
            next(err);
        }
    }

    private async registerRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { name, url, environment } = req.body;

            if (!name || typeof name !== 'string' || name.trim() === '') {
                throw new RouteError(400, 'The field "name" is required and must be a non-empty string');
            }

            if (!url || typeof url !== 'string' || url.trim() === '') {
                throw new RouteError(400, 'The field "url" is required and must be a non-empty string');
            }

            if (!environment || !['production', 'staging', 'development'].includes(environment)) {
                throw new RouteError(
                    400,
                    'The field "environment" is required and must be either "production", "staging", or "development"'
                );
            }

            const token = crypto.randomBytes(32).toString('hex');

            const existingSite = await this.siteRepository.findByNameAndUrl(name, url);

            if (existingSite !== null) {
                const updatedSite = await this.siteRepository.update({
                    id: existingSite.getId(),
                    name: existingSite.getName(),
                    phpVersion: existingSite.getPhpVersion(),
                    wpVersion: existingSite.getWpVersion(),
                    token,
                    createdAt: existingSite.getCreatedAt().toISOString(),
                    updatedAt: new Date().toISOString(),
                    url: existingSite.getUrl(),
                    environment,
                });

                if (!updatedSite) {
                    throw new RouteError(500, 'Failed to re-register already registered site');
                }

                this.logger.info('Site re-registered successfully', {
                    id: updatedSite.getId(),
                    name: updatedSite.getName(),
                });

                res.status(200).json({
                    message: 'Site re-registered successfully',
                    data: {
                        id: updatedSite.getId(),
                        name: updatedSite.getName(),
                        url: updatedSite.getUrl(),
                        token: updatedSite.getToken(),
                    },
                });

                return;
            }

            const createdSite = await this.siteRepository.create({
                name,
                phpVersion: null,
                wpVersion: null,
                token,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                url,
                environment,
            });

            if (!createdSite) {
                throw new RouteError(500, 'Failed to register site');
            }

            this.logger.info('Site registered successfully', {
                id: createdSite.getId(),
                name: createdSite.getName(),
            });

            res.status(201).json({
                message: 'Site registered successfully',
                data: {
                    id: createdSite.getId(),
                    name: createdSite.getName(),
                    url: createdSite.getUrl(),
                    token: createdSite.getToken(),
                },
            });
        } catch (err) {
            next(err);
        }
    }

    private async updateRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const siteId = req.site.getId();

            const { name, phpVersion, wpVersion, url, plugins: sitePlugins } = req.body;

            if (name === undefined || typeof name !== 'string' || name.trim() === '') {
                throw new RouteError(400, 'The field "name" is required and must be a non-empty string');
            }

            if (url === undefined || typeof url !== 'string' || url.trim() === '') {
                throw new RouteError(400, 'The field "url" is required and must be a non-empty string');
            }

            if (
                phpVersion === undefined ||
                typeof phpVersion !== 'string' ||
                Tools.formatVersionToMMP(phpVersion) === 'invalid-version-format'
            ) {
                throw new RouteError(400, 'The field "phpVersion" is required and must be a valid version string');
            }

            if (
                wpVersion === undefined ||
                typeof wpVersion !== 'string' ||
                Tools.formatVersionToMMP(wpVersion) === 'invalid-version-format'
            ) {
                throw new RouteError(400, 'The field "wpVersion" is required and must be a valid version string');
            }

            if (!Array.isArray(sitePlugins)) {
                throw new RouteError(400, 'The field "plugins" is required and must be an array');
            }

            if (sitePlugins.length > 0) {
                for (let i = 0; i < sitePlugins.length; i++) {
                    if (sitePlugins[i].file === undefined || typeof sitePlugins[i].file !== 'string') {
                        throw new RouteError(400, `The field "plugins[${i}].file" is required and must be a string`);
                    }

                    if (sitePlugins[i].name === undefined || typeof sitePlugins[i].name !== 'string') {
                        throw new RouteError(400, `The field "plugins[${i}].name" is required and must be a string`);
                    }

                    if (sitePlugins[i].active === undefined || typeof sitePlugins[i].active !== 'boolean') {
                        throw new RouteError(400, `The field "plugins[${i}].active" is required and must be a boolean`);
                    }

                    if (!sitePlugins[i].version || typeof sitePlugins[i].version !== 'object') {
                        throw new RouteError(
                            400,
                            `The field "plugins[${i}].version" is required and must be an object`
                        );
                    }

                    if (
                        sitePlugins[i].version.installedVersion === undefined ||
                        (sitePlugins[i].version.installedVersion !== null &&
                            (typeof sitePlugins[i].version.installedVersion !== 'string' ||
                                Tools.formatVersionToMMP(sitePlugins[i].version.installedVersion) ===
                                    'invalid-version-format'))
                    ) {
                        throw new RouteError(
                            400,
                            `The field "plugins[${i}].version.installedVersion" is required and must be a valid version string or null`
                        );
                    }

                    if (
                        sitePlugins[i].version.requiredPhpVersion === undefined ||
                        (sitePlugins[i].version.requiredPhpVersion !== null &&
                            (typeof sitePlugins[i].version.requiredPhpVersion !== 'string' ||
                                Tools.formatVersionToMMP(sitePlugins[i].version.requiredPhpVersion) ===
                                    'invalid-version-format'))
                    ) {
                        throw new RouteError(
                            400,
                            `The field "plugins[${i}].version.requiredPhpVersion" is required and must be a valid version string or null`
                        );
                    }

                    if (
                        sitePlugins[i].version.requiredWpVersion === undefined ||
                        (sitePlugins[i].version.requiredWpVersion !== null &&
                            (typeof sitePlugins[i].version.requiredWpVersion !== 'string' ||
                                Tools.formatVersionToMMP(sitePlugins[i].version.requiredWpVersion) ===
                                    'invalid-version-format'))
                    ) {
                        throw new RouteError(
                            400,
                            `The field "plugins[${i}].version.requiredWpVersion" is required and must be a valid version string or null`
                        );
                    }
                }
            }

            const updatedSite = await this.siteRepository.update({
                id: req.site.getId(),
                name,
                phpVersion: Tools.formatVersionToMMP(phpVersion),
                wpVersion: Tools.formatVersionToMMP(wpVersion),
                token: req.site.getToken(),
                createdAt: req.site.getCreatedAt().toISOString(),
                updatedAt: new Date().toISOString(),
                url,
                environment: req.site.getEnvironment(),
            });

            if (!updatedSite) {
                throw new RouteError(500, 'Failed to update site');
            }

            this.logger.info('Site updated successfully', { id: updatedSite.getId(), name: updatedSite.getName() });

            for (const sitePlugin of sitePlugins) {
                const {
                    file,
                    name,
                    active,
                    version: { installedVersion, requiredPhpVersion, requiredWpVersion },
                } = sitePlugin;

                const slug = Tools.getPluginSlugFromFile(file);

                if (!slug) {
                    this.logger.warn('Invalid plugin file provided', { file });
                    continue;
                }

                if (!(await this.pluginRepository.findBySlug(slug))) {
                    this.logger.info('Plugin not found, creating new plugin', {
                        slug,
                        name,
                        installedVersion,
                        requiredPhpVersion,
                        requiredWpVersion,
                    });

                    const latestVersion: TPluginVersion = await this.latestVersionResolver.resolvePlugin(slug);

                    const createdPlugin = await this.pluginRepository.create({
                        slug,
                        name,
                        latestVersion: latestVersion.version,
                        requiredPhpVersion: latestVersion.requiredPhpVersion,
                        requiredWpVersion: latestVersion.requiredWpVersion,
                    });

                    if (!createdPlugin) {
                        this.logger.error('Failed to create new plugin', { slug, name });
                        continue;
                    }

                    const vulnerabilities = await this.pluginRepository.getVulnerabilities(slug);
                    if (!vulnerabilities || !Array.isArray(vulnerabilities)) {
                        this.logger.error('Failed to fetch vulnerabilities for plugin', {
                            id: createdPlugin.getId(),
                            slug: createdPlugin.getSlug(),
                        });
                    } else {
                        this.logger.info(
                            `Found ${vulnerabilities.length} vulnerabilities for plugin. Clearing existing vulnerabilities and inserting new ones`,
                            { plugin: { id: createdPlugin.getId(), slug: createdPlugin.getSlug() } }
                        );

                        await this.pluginRepository.deleteAllVulnerabilitiesForPlugin(createdPlugin.getId());

                        this.logger.info('Inserting vulnerabilities for plugin', {
                            plugin: { id: createdPlugin.getId(), slug: createdPlugin.getSlug() },
                        });

                        for (const vulnerability of vulnerabilities) {
                            await this.pluginRepository.createVulnerability({
                                pluginId: createdPlugin.getId(),
                                ...vulnerability,
                            });

                            this.logger.info('Vulnerability created successfully', {
                                plugin: { id: createdPlugin.getId(), slug: createdPlugin.getSlug() },
                                vulnerability,
                            });
                        }
                    }
                }

                const plugin = await this.pluginRepository.findBySlug(slug);
                if (!plugin) {
                    this.logger.error('Plugin not found after creation', { slug, name });
                    continue;
                }

                if (!(await this.siteRepository.findSitePlugin(req.site.getId(), plugin.getId()))) {
                    this.logger.info('Site plugin not found in database. Inserting new Site Plugin', {
                        site: { id: req.site.getId(), name: req.site.getName() },
                        plugin: { id: plugin.getId(), slug: plugin.getSlug() },
                    });

                    const createdSitePlugin = await this.siteRepository.createSitePlugin({
                        siteId: req.site.getId(),
                        pluginId: plugin.getId(),
                        installedVersion: installedVersion ? Tools.formatVersionToMMP(installedVersion) : null,
                        requiredPhpVersion: requiredPhpVersion ? Tools.formatVersionToMMP(requiredPhpVersion) : null,
                        requiredWpVersion: requiredWpVersion ? Tools.formatVersionToMMP(requiredWpVersion) : null,
                        isActive: active,
                    });

                    if (!createdSitePlugin) {
                        this.logger.warn('Failed to create site plugin', {
                            site: { id: req.site.getId(), name: req.site.getName() },
                            plugin: { id: plugin.getId(), slug: plugin.getSlug() },
                        });
                        continue;
                    }

                    this.logger.info('Site plugin created successfully', { sitePlugin: createdSitePlugin });
                } else {
                    this.logger.info('Site plugin already exists, updating', {
                        site: { id: req.site.getId(), name: req.site.getName() },
                        plugin: { id: plugin.getId(), slug: plugin.getSlug() },
                    });

                    const updatedSitePlugin = await this.siteRepository.updateSitePlugin({
                        siteId: req.site.getId(),
                        pluginId: plugin.getId(),
                        installedVersion: installedVersion ? Tools.formatVersionToMMP(installedVersion) : null,
                        requiredPhpVersion: requiredPhpVersion ? Tools.formatVersionToMMP(requiredPhpVersion) : null,
                        requiredWpVersion: requiredWpVersion ? Tools.formatVersionToMMP(requiredWpVersion) : null,
                        isActive: active,
                    });

                    if (!updatedSitePlugin) {
                        this.logger.warn('Failed to update site plugin', {
                            site: { id: req.site.getId(), name: req.site.getName() },
                            plugin: { id: plugin.getId(), slug: plugin.getSlug() },
                        });
                    }

                    this.logger.info('Site plugin updated successfully', { sitePlugin: updatedSitePlugin });
                }
            }

            // Cleanup - remove site plugins that are no longer present in the request

            const assignedPlugins = await this.siteRepository.findAllSitePlugins(Number(siteId));
            const requestPluginFiles = sitePlugins.map((plugin) => Tools.getPluginSlugFromFile(plugin.file));
            const deletableSitePlugins = assignedPlugins.filter(
                (sitePlugin) => !requestPluginFiles.includes(sitePlugin.getSlug())
            );

            for (const deletableSitePlugin of deletableSitePlugins) {
                this.logger.info('Removing site plugin that is no longer present in the request', {
                    site: { id: req.site.getId(), name: req.site.getName() },
                    plugin: { id: deletableSitePlugin.getId(), slug: deletableSitePlugin.getSlug() },
                });

                const isDeleted = await this.siteRepository.deleteSitePlugin(
                    req.site.getId(),
                    deletableSitePlugin.getId()
                );

                if (!isDeleted) {
                    this.logger.warn('Failed to delete site plugin', {
                        site: { id: req.site.getId(), name: req.site.getName() },
                        plugin: { id: deletableSitePlugin.getId(), slug: deletableSitePlugin.getSlug() },
                    });
                } else {
                    this.logger.info('Site plugin deleted successfully', {
                        site: { id: req.site.getId(), name: req.site.getName() },
                        plugin: { id: deletableSitePlugin.getId(), slug: deletableSitePlugin.getSlug() },
                    });
                }
            }

            res.status(200).json({
                message: 'Site updated successfully',
                data: {
                    id: updatedSite.getId(),
                    name: updatedSite.getName(),
                    url: updatedSite.getUrl(),
                    phpVersion: updatedSite.getPhpVersion(),
                    wpVersion: updatedSite.getWpVersion(),
                    environment: updatedSite.getEnvironment(),
                },
            });
        } catch (err) {
            next(err);
        }
    }
}
