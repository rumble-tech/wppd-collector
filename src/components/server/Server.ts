import { ServerConfig } from 'src/config/Types';
import express from 'express';
import cors from 'cors';
import http from 'http';
import RouteError from 'src/components/server/RouteError';
import Logger from 'src/components/Logger';

export default class Server {
    private static instance: Server;
    private static config: ServerConfig;

    private app: express.Application;
    private server: http.Server;
    private router: express.Router;

    private constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.router = express.Router();

        this.app.use(express.json());
        this.app.use(cors(Server.config.corsOptions));
        this.app.use('/', this.router);

        this.useErrorHandlers();
    }

    public static getInstance(): Server {
        if (!Server.instance) {
            Server.instance = new Server();
        }

        return Server.instance;
    }

    public static setConfig(config: ServerConfig): void {
        Server.config = config;
    }

    public async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.server.listen(Server.config.port, () => {
                resolve();
            });

            this.server.on('error', (err) => {
                reject(err);
            });
        });
    }

    public useRouter(prefix: string, router: express.Router): void {
        if (!router) {
            throw new Error('Router is not defined');
        }

        this.router.use(prefix, router);
    }

    private useErrorHandlers(): void {
        this.app.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
            const error = new RouteError(404, `Route not found: ${req.method} ${req.originalUrl}`);
            next(error);
        });

        this.app.use((err: Error | RouteError, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
            if (err instanceof RouteError) {
                const statusCode = err.getStatusCode();
                const message = err.message;

                Logger.app.error(`[${statusCode}] ${message}`);

                res.status(statusCode).json({ error: message });
                return;
            }

            const status = 500;
            const message = 'Internal server error';

            res.status(status).json({ message });
        });
    }
}
