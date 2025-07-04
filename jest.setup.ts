import { LoggerInterface } from 'src/components/logger/LoggerInterface';
import Server from 'src/components/server/Server';
import IndexController from 'src/controllers/IndexController';

module.exports = async () => {
    await setupServer();
};

const mockLogger: LoggerInterface = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    silly: jest.fn(),
};

const setupServer = async () => {
    Server.setConfig({
        port: 0,
        corsOptions: {},
    });

    const serverInstance = Server.getInstance(mockLogger);
    serverInstance.useRouter('/', new IndexController(mockLogger).getRouter());

    await serverInstance.start();

    global.server = serverInstance;
};
