import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { LoggerInterface } from 'src/components/logger/LoggerInterface';
import RouteError from 'src/components/server/RouteError';
import AbstractController from 'src/controllers/AbstractController';
import { TPluginVersion } from 'src/models/Plugin';
import PluginRepository from 'src/repositories/PluginRepository';
import SiteRepository from 'src/repositories/SiteRepository';
import Tools from 'src/Tools';

export default class SiteController extends AbstractController {
    private siteRepository: SiteRepository;
    private pluginRepository: PluginRepository;

    constructor(logger: LoggerInterface, siteRepository: SiteRepository, pluginRepository: PluginRepository) {
        super(logger);

        this.siteRepository = siteRepository;
        this.pluginRepository = pluginRepository;
    }

    protected useRoutes(): void {
        this.router.get('/', this.getSites.bind(this));
        this.router.get('/:siteId', this.getSite.bind(this));
        this.router.get('/:siteId/plugins', this.getSitePlugins.bind(this));
        this.router.post('/register', this.register.bind(this));
        this.router.put('/:siteId/update/', this.accessMiddleware.bind(this), this.update.bind(this));
    }

    private async accessMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const siteId = req.params.siteId;

            if (!siteId || isNaN(Number(siteId))) {
                throw new RouteError(400, 'Invalid site ID provided');
            }

            const { authorization } = req.headers;

            if (!authorization || typeof authorization !== 'string') {
                throw new RouteError(401, 'Authorization header is required');
            }

            const site = await this.siteRepository.findById(Number(siteId));

            if (!site) {
                throw new RouteError(404, 'Site not found');
            }

            const token = authorization.split('Bearer ')[1];
            if (site.getToken() !== token) {
                throw new RouteError(403, 'Access denied: Invalid token');
            }

            req.site = site;
            next();
        } catch (err) {
            next(err);
        }
    }

    private async getSites(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const sites = await this.siteRepository.findAll();

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

    private async getSite(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const siteId = req.params.siteId;

            if (siteId === undefined || typeof siteId !== 'string' || isNaN(Number(siteId))) {
                throw new RouteError(400, 'The parameter "siteId" is required and must be a non-empty number');
            }

            const site = await this.siteRepository.findById(Number(siteId));

            if (!site) {
                throw new RouteError(404, 'A site with the given ID does not exist');
            }

            res.status(200).json({
                message: 'Site retrieved successfully',
                data: {
                    id: site.getId(),
                    name: site.getName(),
                    url: site.getUrl(),
                    environment: site.getEnvironment(),
                    phpVersion: site.getPhpVersion(),
                    wpVersion: site.getWpVersion(),
                },
            });
        } catch (err) {
            next(err);
        }
    }

    private async getSitePlugins(req: Request, res: Response, next: NextFunction): Promise<void> {
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
                sitePlugins.map(async (sitePlugin) => ({
                    pluginId: sitePlugin.getId(),
                    name: sitePlugin.getName(),
                    slug: sitePlugin.getSlug(),
                    installedVersion: sitePlugin.getInstalledVersion(),
                    latestVersion: sitePlugin.getLatestVersion(),
                    isActive: sitePlugin.getIsActive(),
                    vulnerabilities: (
                        await this.pluginRepository.findVulnerabilities(sitePlugin.getId())
                    ).map((vulnerabilitiy) => ({
                        from: vulnerabilitiy.from,
                        to: vulnerabilitiy.to,
                        score: vulnerabilitiy.score,
                    })),
                }))
            );

            res.status(200).json({
                message: 'Site Plugins retrieved successfully',
                data: pluginData,
            });
        } catch (err) {
            next(err);
        }
    }

    private async register(req: Request, res: Response, next: NextFunction): Promise<void> {
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

    private async update(req: Request, res: Response, next: NextFunction): Promise<void> {
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

            const existingSite = await this.siteRepository.findById(Number(siteId));

            if (!existingSite) {
                throw new RouteError(404, 'A site with the given ID does not exist');
            }

            const updatedSite = await this.siteRepository.update({
                id: existingSite.getId(),
                name,
                phpVersion: Tools.formatVersionToMMP(phpVersion),
                wpVersion: Tools.formatVersionToMMP(wpVersion),
                token: existingSite.getToken(),
                createdAt: existingSite.getCreatedAt().toISOString(),
                updatedAt: new Date().toISOString(),
                url,
                environment: existingSite.getEnvironment(),
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

                    const latestVersion: TPluginVersion = await this.pluginRepository.getLatestVersion(slug);

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

                if (!(await this.siteRepository.findSitePlugin(existingSite.getId(), plugin.getId()))) {
                    this.logger.info('Site plugin not found in database. Inserting new Site Plugin', {
                        site: { id: existingSite.getId(), name: existingSite.getName() },
                        plugin: { id: plugin.getId(), slug: plugin.getSlug() },
                    });

                    const createdSitePlugin = await this.siteRepository.createSitePlugin({
                        siteId: existingSite.getId(),
                        pluginId: plugin.getId(),
                        installedVersion,
                        requiredPhpVersion,
                        requiredWpVersion,
                        isActive: active,
                    });

                    if (!createdSitePlugin) {
                        this.logger.warn('Failed to create site plugin', {
                            site: { id: existingSite.getId(), name: existingSite.getName() },
                            plugin: { id: plugin.getId(), slug: plugin.getSlug() },
                        });
                        continue;
                    }

                    this.logger.info('Site plugin created successfully', { sitePlugin: createdSitePlugin });
                } else {
                    this.logger.info('Site plugin already exists, updating', {
                        site: { id: existingSite.getId(), name: existingSite.getName() },
                        plugin: { id: plugin.getId(), slug: plugin.getSlug() },
                    });

                    const updatedSitePlugin = await this.siteRepository.updateSitePlugin({
                        siteId: existingSite.getId(),
                        pluginId: plugin.getId(),
                        installedVersion,
                        requiredPhpVersion,
                        requiredWpVersion,
                        isActive: active,
                    });

                    if (!updatedSitePlugin) {
                        this.logger.warn('Failed to update site plugin', {
                            site: { id: existingSite.getId(), name: existingSite.getName() },
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
                    site: { id: existingSite.getId(), name: existingSite.getName() },
                    plugin: { id: deletableSitePlugin.getId(), slug: deletableSitePlugin.getSlug() },
                });

                const isDeleted = await this.siteRepository.deleteSitePlugin(
                    existingSite.getId(),
                    deletableSitePlugin.getId()
                );

                if (!isDeleted) {
                    this.logger.warn('Failed to delete site plugin', {
                        site: { id: existingSite.getId(), name: existingSite.getName() },
                        plugin: { id: deletableSitePlugin.getId(), slug: deletableSitePlugin.getSlug() },
                    });
                } else {
                    this.logger.info('Site plugin deleted successfully', {
                        site: { id: existingSite.getId(), name: existingSite.getName() },
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
