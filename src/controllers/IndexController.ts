import AbstractController from 'src/controllers/AbstractController';

export default class IndexController extends AbstractController {
    protected useRoutes(): void {
        this.router.get('/', (req, res) => {
            res.status(200).json({
                message: 'Welcome to the API',
                version: process.env.npm_package_version,
            });
        });
    }
}
