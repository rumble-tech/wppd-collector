import cors from 'cors';
import express from 'express';
import http from 'http';
import { LoggerInterface } from 'src/components/logger/LoggerInterface';
import RouteError from 'src/components/server/RouteError';
import { ServerConfig } from 'src/config/Types';

export default class Server {
    private static instance?: Server;
    private static config: ServerConfig;

    private app: express.Application;
    private server: http.Server;
    private router: express.Router;
    private logger: LoggerInterface;

    private constructor(logger: LoggerInterface) {
        this.app = express();
        this.server = http.createServer(this.app);
        this.router = express.Router();
        this.logger = logger;

        this.app.use(express.json());
        this.app.use(cors(Server.config.corsOptions));
        this.app.use('/', this.router);

        this.useErrorHandlers();
    }

    public static getInstance(logger: LoggerInterface): Server {
        if (!Server.instance) {
            Server.instance = new Server(logger);
        }

        return Server.instance;
    }

    public static resetInstance(): void {
        Server.instance = undefined;
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

    public getApp(): express.Application {
        return this.app;
    }

    private useErrorHandlers(): void {
        this.app.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
            const error = new RouteError(404, `Route not found: ${req.method} ${req.originalUrl}`);
            next(error);
        });

        this.app.use(
            (err: Error | RouteError, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
                const statusCode = err instanceof RouteError ? err.getStatusCode() : 500;
                const message = err instanceof RouteError ? err.message : 'Internal server error';

                this.logger.error(`[${statusCode}] ${message}`);

                res.status(statusCode).json({
                    message,
                    data: null,
                });
            }
        );
    }
}
