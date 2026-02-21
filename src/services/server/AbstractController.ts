import express from 'express';
import Logger from 'src/services/logger/Logger';

export default abstract class AbstractController {
    protected prefix: string;
    protected router: express.Router;
    protected logger: Logger;

    protected constructor(logger: Logger) {
        this.router = express.Router();
        this.logger = logger;
    }

    public getPrefix(): string {
        return this.prefix;
    }

    public getRouter(): express.Router {
        return this.router;
    }

    protected abstract useRoutes(): void;
}
