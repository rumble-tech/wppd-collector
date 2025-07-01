import express from 'express';
import Logger from 'src/components/Logger';

interface ControllerInterface {
    getRouter(): express.Router;
}

export default abstract class AbstractController implements ControllerInterface {
    protected router: express.Router;
    protected logger: Logger;

    constructor(logger: Logger) {
        this.router = express.Router();
        this.logger = logger;
        this.useRoutes();
    }

    public getRouter(): express.Router {
        return this.router;
    }

    protected abstract useRoutes(): void;
}
