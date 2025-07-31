import express from 'express';
import http from 'http';
import { ServerConfig } from 'src/config/Types';
import Server from './Server';
import { LoggerInterface } from '../logger/LoggerInterface';
import { setupTestServer } from 'test-utils/setup-server';
import request from 'supertest';

describe('Server', () => {
    let server: Server;
    let mockLogger: jest.Mocked<LoggerInterface>;
    const serverConfig: ServerConfig = {
        port: 0,
        corsOptions: {},
    };

    const fakeHttpServer = {
        listen: jest.fn((port: number, cb: () => void) => {
            cb();
            return fakeHttpServer as unknown as http.Server;
        }),
        on: jest.fn<http.Server['on'], Parameters<http.Server['on']>>(),
    };

    beforeEach(() => {
        jest.resetModules();
        jest.restoreAllMocks();

        jest.spyOn(http, 'createServer').mockReturnValue(fakeHttpServer as unknown as http.Server);

        Server.resetInstance();
        Server.setConfig(serverConfig);

        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            silly: jest.fn(),
        };

        server = Server.getInstance(mockLogger);
    });

    describe('Server.getInstance', () => {
        it('should return the same instance when called multiple times', () => {
            const firstInstance = Server.getInstance(mockLogger);
            const secondInstance = Server.getInstance(mockLogger);
            expect(firstInstance).toBe(secondInstance);
        });

        it('should create a new instance if resetInstance is called', () => {
            const firstInstance = Server.getInstance(mockLogger);
            Server.resetInstance();

            const secondInstance = Server.getInstance(mockLogger);

            expect(firstInstance).not.toBe(secondInstance);
        });
    });

    describe('Server.start', () => {
        it('should resolve then the server.listen callback is invoked', async () => {
            await expect(server.start()).resolves.toBeUndefined();

            expect(fakeHttpServer.listen).toHaveBeenCalledWith(serverConfig.port, expect.any(Function));

            expect(fakeHttpServer.on).toHaveBeenCalledWith('error', expect.any(Function));
        });

        it('should reject if the server emits an error', async () => {
            const error = new Error('Server error');

            fakeHttpServer.listen.mockImplementationOnce(() => {
                return fakeHttpServer as unknown as http.Server;
            });

            fakeHttpServer.on.mockImplementationOnce((event, handler) => {
                if (event === 'error') {
                    handler(error);
                }

                return fakeHttpServer;
            });

            await expect(server.start()).rejects.toThrow('Server error');
            expect(fakeHttpServer.listen).toHaveBeenCalledWith(serverConfig.port, expect.any(Function));
            expect(fakeHttpServer.on).toHaveBeenCalledWith('error', expect.any(Function));
        });
    });

    describe('Server.useRouter', () => {
        it('should throw an error if the router is not defined', () => {
            expect(() => {
                server.useRouter('/test', undefined as unknown as express.Router);
            }).toThrow('Router is not defined');
        });
    });
});
