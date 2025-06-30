declare namespace Express {
    export interface Request {
        site: import('src/entities/Site').default;
    }
}
