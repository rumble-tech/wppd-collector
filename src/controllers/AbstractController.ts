import express from 'express';
import { LoggerInterface } from 'src/components/logger/LoggerInterface';

interface ControllerInterface {
    getRouter(): express.Router;
}

export default abstract class AbstractController implements ControllerInterface {
    protected router: express.Router;
    protected logger: LoggerInterface;

    constructor(logger: LoggerInterface) {
        this.router = express.Router();
        this.logger = logger;
        this.useRoutes();
    }

    public getRouter(): express.Router {
        return this.router;
    }

    protected abstract useRoutes(): void;
}
