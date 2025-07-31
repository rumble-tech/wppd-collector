import RouteError from './RouteError';

describe('RouteError', () => {
    it('should create a instance of RouteError', () => {
        const error = new RouteError(500, 'Internal Server Error');
        expect(error).toBeInstanceOf(RouteError);
    });

    it('should retain the correct status code', () => {
        const statusCode = 500;
        const error = new RouteError(statusCode, 'Internal Server Error');
        expect(error.getStatusCode()).toBe(statusCode);
    });

    it('should retain the correct error message', () => {
        const message = 'Internal Server Error';
        const error = new RouteError(500, message);
        expect(error.message).toBe(message);
    });
});
