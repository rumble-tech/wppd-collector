import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import SiteRepository from 'src/repositories/SiteRepository';
import Logger from 'src/services/logger/Logger';
import AbstractController from 'src/services/server/AbstractController';
import RouteError from 'src/services/server/RouteError';

export default class SiteController extends AbstractController {
    protected readonly prefix = '/site';

    private readonly siteRepository: SiteRepository;

    constructor(logger: Logger, siteRepository: SiteRepository) {
        super(logger);

        this.siteRepository = siteRepository;

        this.useRoutes();
    }

    protected useRoutes(): void {
        this.router.get('/', this.allRoute.bind(this));
        this.router.get('/:siteId', this.singleRoute.bind(this));
        this.router.post('/', this.registerRoute.bind(this));
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
                throw new RouteError(404, 'Failed to find site with the given Id');
            }

            res.status(200).json({
                message: 'Successfully retrieved site',
                data: {
                    id: site.getId(),
                    name: site.getName(),
                    url: site.getUrl(),
                    environment: site.getEnvironment(),
                    phpVersion: site.getPhpVersion(),
                    wpVersion: site.getWpVersion(),
                },
            });
        } catch (e) {
            next(e);
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
                    'The field "environment" is required and must either be "production", "staging" or "development"'
                );
            }

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
}
