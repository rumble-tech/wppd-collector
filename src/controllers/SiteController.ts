import { Request, Response, NextFunction } from 'express';
import RouteError from 'src/components/server/RouteError';
import AbstractController from 'src/controllers/AbstractController';
import SiteRepository from 'src/repositories/SiteRepository';
import crypto from 'crypto';
import Logger from 'src/components/Logger';
import PluginRepository from 'src/repositories/PluginRepository';

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
        this.router.get('/:siteId/plugins', this.accessMiddleware.bind(this), this.getSitePlugins.bind(this));
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

            // TODO: implement

            res.sendStatus(200);
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
            console.log('Update site called');

            res.sendStatus(200);
        } catch (err) {
            next(err);
        }
    }
}
