import express from 'express';

interface IController {
    getRouter(): express.Router;
}

export default abstract class AbstractController implements IController {
    protected router: express.Router;

    constructor() {
        this.router = express.Router();
        this.useRoutes();
    }

    public getRouter(): express.Router {
        return this.router;
    }

    protected abstract useRoutes(): void;
}
