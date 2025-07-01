import { Request, Response, NextFunction } from 'express';
import RouteError from 'src/components/server/RouteError';
import AbstractController from 'src/controllers/AbstractController';
import SiteRepository from 'src/repositories/SiteRepository';
import crypto from 'crypto';
import Logger from 'src/components/Logger';
import PluginRepository from 'src/repositories/PluginRepository';
import Tools from 'src/Tools';
import { TPluginVersion } from 'src/models/Plugin';

export default class SiteController extends AbstractController {
    private siteRepository: SiteRepository;
    private pluginRepository: PluginRepository;

    constructor(logger: Logger, siteRepository: SiteRepository, pluginRepository: PluginRepository) {
        super(logger);

        this.siteRepository = siteRepository;
        this.pluginRepository = pluginRepository;
    }

    protected useRoutes(): void {
        this.router.get('/', this.getSites.bind(this));
        this.router.get('/:siteId', this.getSite.bind(this));
        this.router.get('/:siteId/plugins', this.getSitePlugins.bind(this));
        this.router.post('/register', this.register.bind(this));
        this.router.put('/update/:siteId', this.accessMiddleware.bind(this), this.update.bind(this));
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

            if (sites.length === 0) {
                res.status(200).json({
                    message: 'No sites found',
                    data: null,
                });

                return;
            }

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

            if (!siteId || isNaN(Number(siteId))) {
                throw new RouteError(400, 'Invalid site ID provided');
            }

            const site = await this.siteRepository.findById(Number(siteId));

            if (!site) {
                throw new RouteError(404, 'Site not found');
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

            if (!siteId || isNaN(Number(siteId))) {
                throw new RouteError(400, 'Invalid site ID provided');
            }

            const sitePlugins = await this.siteRepository.findAllSitePlugins(Number(siteId));

            if (sitePlugins.length === 0) {
                res.status(200).json({
                    message: 'No plugins found for this site',
                    data: null,
                });

                return;
            }

            const pluginData = sitePlugins.map((sitePlugin) => ({
                pluginId: sitePlugin.getId(),
                name: sitePlugin.getName(),
                slug: sitePlugin.getSlug(),
                installedVersion: sitePlugin.getInstalledVersion(),
                latestVersion: sitePlugin.getLatestVersion(),
                isActive: sitePlugin.getIsActive(),
                vulnerabilities: [],
            }));

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
            const { name, url } = req.body;

            if (!name || !url) {
                throw new RouteError(400, 'Name and URL are required');
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
                    environment: existingSite.getEnvironment(),
                });

                if (!updatedSite) {
                    throw new RouteError(500, 'Failed to update existing site');
                }

                this.logger.app.info('Site updated successfully', { id: updatedSite.getId(), name: updatedSite.getName() });

                res.status(200).json({
                    message: 'Site updated successfully',
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
                environment: 'production',
            });

            if (!createdSite) {
                throw new RouteError(500, 'Failed to create new site');
            }

            this.logger.app.info('Site registered successfully', { id: createdSite.getId(), name: createdSite.getName() });

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
            const siteId = req.params.siteId;
            if (!siteId || isNaN(Number(siteId))) {
                throw new RouteError(400, 'Invalid site ID provided');
            }

            const { name, environment, phpVersion, wpVersion, url, plugins: sitePlugins } = req.body;

            // TODO: validate request body

            const existingSite = await this.siteRepository.findById(Number(siteId));

            if (!existingSite) {
                throw new RouteError(404, 'Site not found');
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
                environment,
            });

            if (!updatedSite) {
                throw new RouteError(500, 'Failed to update site');
            }

            this.logger.app.info('Site updated successfully', { id: updatedSite.getId(), name: updatedSite.getName() });

            for (const sitePlugin of sitePlugins) {
                const {
                    file,
                    name,
                    active,
                    version: { installedVersion, requiredPhpVersion, requiredWpVersion },
                } = sitePlugin;

                const slug = Tools.getPluginSlugFromFile(file);

                if (!slug) {
                    this.logger.app.warn('Invalid plugin file provided', { file });
                    continue;
                }

                if (!(await this.pluginRepository.findBySlug(slug))) {
                    this.logger.app.info('Plugin not found, creating new plugin', { slug, name, installedVersion, requiredPhpVersion, requiredWpVersion });

                    const latestVersion: TPluginVersion = { version: '1.0.0', requiredPhpVersion: '8.3.4', requiredWpVersion: '6.4' };

                    const createdPlugin = await this.pluginRepository.create({
                        slug,
                        name,
                        latestVersion: latestVersion.version,
                        requiredPhpVersion: latestVersion.requiredPhpVersion,
                        requiredWpVersion: latestVersion.requiredWpVersion,
                    });

                    if (!createdPlugin) {
                        this.logger.app.error('Failed to create new plugin', { slug, name });
                        continue;
                    }
                }

                const plugin = await this.pluginRepository.findBySlug(slug);
                if (!plugin) {
                    this.logger.app.error('Plugin not found after creation', { slug, name });
                    continue;
                }

                if (!(await this.siteRepository.findSitePlugin(existingSite.getId(), plugin.getId()))) {
                    this.logger.app.info('Site plugin not found in database. Inserting new Site Plugin', { site: { id: existingSite.getId(), name: existingSite.getName() }, plugin: { id: plugin.getId(), slug: plugin.getSlug() } });

                    const createdSitePlugin = await this.siteRepository.createSitePlugin({
                        siteId: existingSite.getId(),
                        pluginId: plugin.getId(),
                        installedVersion,
                        requiredPhpVersion,
                        requiredWpVersion,
                        isActive: active,
                    });

                    if (!createdSitePlugin) {
                        this.logger.app.warn('Failed to create site plugin', { site: { id: existingSite.getId(), name: existingSite.getName() }, plugin: { id: plugin.getId(), slug: plugin.getSlug() } });
                        continue;
                    }

                    this.logger.app.info('Site plugin created successfully', { sitePlugin: createdSitePlugin });
                } else {
                    this.logger.app.info('Site plugin already exists, updating', { site: { id: existingSite.getId(), name: existingSite.getName() }, plugin: { id: plugin.getId(), slug: plugin.getSlug() } });

                    const updatedSitePlugin = await this.siteRepository.updateSitePlugin({
                        siteId: existingSite.getId(),
                        pluginId: plugin.getId(),
                        installedVersion,
                        requiredPhpVersion,
                        requiredWpVersion,
                        isActive: active,
                    });

                    if (!updatedSitePlugin) {
                        this.logger.app.warn('Failed to update site plugin', { site: { id: existingSite.getId(), name: existingSite.getName() }, plugin: { id: plugin.getId(), slug: plugin.getSlug() } });
                    }

                    this.logger.app.info('Site plugin updated successfully', { sitePlugin: updatedSitePlugin });
                }
            }

            // Cleanup - remove site plugins that are no longer present in the request

            const assignedPlugins = await this.siteRepository.findAllSitePlugins(Number(siteId));
            const requestPluginFiles = sitePlugins.map((plugin) => Tools.getPluginSlugFromFile(plugin.file));
            const deletableSitePlugins = assignedPlugins.filter((sitePlugin) => !requestPluginFiles.includes(sitePlugin.getSlug()));

            for (const deletableSitePlugin of deletableSitePlugins) {
                this.logger.app.info('Removing site plugin that is no longer present in the request', {
                    site: { id: existingSite.getId(), name: existingSite.getName() },
                    plugin: { id: deletableSitePlugin.getId(), slug: deletableSitePlugin.getSlug() },
                });

                const isDeleted = await this.siteRepository.deleteSitePlugin(existingSite.getId(), deletableSitePlugin.getId());

                if (!isDeleted) {
                    this.logger.app.warn('Failed to delete site plugin', {
                        site: { id: existingSite.getId(), name: existingSite.getName() },
                        plugin: { id: deletableSitePlugin.getId(), slug: deletableSitePlugin.getSlug() },
                    });
                } else {
                    this.logger.app.info('Site plugin deleted successfully', {
                        site: { id: existingSite.getId(), name: existingSite.getName() },
                        plugin: { id: deletableSitePlugin.getId(), slug: deletableSitePlugin.getSlug() },
                    });
                }
            }

            res.sendStatus(200);
        } catch (err) {
            next(err);
        }
    }
}
