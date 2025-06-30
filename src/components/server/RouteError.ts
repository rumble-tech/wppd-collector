export default class RouteError extends Error {
    private statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
    }

    public getStatusCode(): number {
        return this.statusCode;
    }
}
