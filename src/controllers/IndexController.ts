import { Request, Response } from 'express';
import Config from 'src/services/config/Config';
import Logger from 'src/services/logger/Logger';
import AbstractController from 'src/services/server/AbstractController';

export default class IndexController extends AbstractController {
    protected readonly prefix = '/';

    constructor(logger: Logger) {
        super(logger);

        this.useRoutes();
    }

    protected useRoutes(): void {
        this.router.get('/', this.welcomeRoute.bind(this));
    }

    private welcomeRoute(req: Request, res: Response): void {
        res.status(200).json({
            message: 'Welcome to the API!',
            data: {
                NODE_ENV: Config.get<string>('NODE_ENV'),
            },
        });
    }
}
