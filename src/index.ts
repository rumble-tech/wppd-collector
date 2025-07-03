import { db } from 'src/components/database/Database';
import { pluginsTable, pluginVulnerabilitiesTable, sitePluginsTable, sitesTable } from 'src/components/database/Schema';
import Logger from 'src/components/Logger';
import Scheduler from 'src/components/Scheduler';
import Server from 'src/components/server/Server';
import Config from 'src/config/Config';
import ConfigSchema from 'src/config/Schema';
import IndexController from 'src/controllers/IndexController';
import SiteController from 'src/controllers/SiteController';
import PluginRepository from 'src/repositories/PluginRepository';
import SiteRepository from 'src/repositories/SiteRepository';
import LatestVersionResolver from 'src/services/latest-version/LatestVersionResolver';
import WordPressApiLatestVersionProvider from 'src/services/latest-version/providers/WordPressApi';
import MailResolver from 'src/services/mailing/MailResolver';
import SESMailProvider from 'src/services/mailing/providers/SES';
import WordFenceApiVulnerabilitiesProvider from 'src/services/vulnerabilities/providers/WordFenceApi';
import VulnerabilitiesResolver from 'src/services/vulnerabilities/VulnerabilitiesResolver';
import DeletePluginsUnusedTask from 'src/tasks/DeletePluginsUnused';
import DeleteSitesInactiveTask from 'src/tasks/DeleteSitesInactive';
import SendReportMailTask from 'src/tasks/SendReportMail';
import UpdatePluginsLatestVersionTask from 'src/tasks/UpdatePluginsLatestVersion';
import UpdatePluginsVulnerabilitiesTask from 'src/tasks/UpdatePluginsVulnerabilities';

Config.load(ConfigSchema);

Logger.setConfig(Config.getLoggerConfig());
const logger = new Logger();

Server.setConfig(Config.getServerConfig());
const server = Server.getInstance(logger);

const latestVersionResolver = new LatestVersionResolver();
latestVersionResolver.addProvider(new WordPressApiLatestVersionProvider());

const wordFenceApiVulnerabilitiesProvider = new WordFenceApiVulnerabilitiesProvider();

const vulnerabilitiesResolver = new VulnerabilitiesResolver();
vulnerabilitiesResolver.addProvider(wordFenceApiVulnerabilitiesProvider);

const mailResolver = new MailResolver();
mailResolver.setProvider(new SESMailProvider(Config.getMailingSESConfig()));

const siteRepository = new SiteRepository(db, sitesTable, pluginsTable, sitePluginsTable);
const pluginRepository = new PluginRepository(
    db,
    pluginsTable,
    sitePluginsTable,
    pluginVulnerabilitiesTable,
    latestVersionResolver,
    vulnerabilitiesResolver
);

const indexController = new IndexController(logger);
const siteController = new SiteController(logger, siteRepository, pluginRepository);

server.useRouter('/', indexController.getRouter());
server.useRouter('/site', siteController.getRouter());
server
    .start()
    .then(() => {
        logger.app.info('Server started successfully');
    })
    .catch((error) => {
        logger.app.error('Failed to start server:', error);
        process.exit(1);
    });

const scheduler = Scheduler.getInstance(logger);
scheduler.addTask('update-plugins-latest-versions', '0 * * * *', () =>
    new UpdatePluginsLatestVersionTask(logger, pluginRepository).run()
); // Every hour
scheduler.addTask('update-plugins-vulnerabilities', '0 */3 * * *', () =>
    new UpdatePluginsVulnerabilitiesTask(logger, pluginRepository).run()
); // Every 3 hours
scheduler.addTask('delete-plugins-unused', '0 12 * * *', () =>
    new DeletePluginsUnusedTask(logger, pluginRepository).run()
); // Every day at 12:00
scheduler.addTask('delete-sites-inactive', '0 12 */7 * *', () =>
    new DeleteSitesInactiveTask(logger, siteRepository).run()
); // Every 7 days at 12:00
scheduler.addTask('send-report-mail', '0 12 * * *', () =>
    new SendReportMailTask(logger, siteRepository, pluginRepository, mailResolver).run()
); // Every day at 12:00

async function main() {
    try {
        await wordFenceApiVulnerabilitiesProvider.fetchVulnerabilities();
    } catch (err) {
        logger.app.error('Error while fetching vulnerabilities from WordFence API. Exiting application...', {
            error: err,
        });
        process.exit(1);
    }
}

main();
