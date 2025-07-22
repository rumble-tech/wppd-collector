import { db } from 'src/components/database/Database';
import { pluginsTable, pluginVulnerabilitiesTable, sitePluginsTable, sitesTable } from 'src/components/database/Schema';
import AppLogger from 'src/components/logger/AppLogger';
import SchdulerLogger from 'src/components/logger/SchedulerLogger';
import Scheduler from 'src/components/Scheduler';
import Server from 'src/components/server/Server';
import Config from 'src/config/Config';
import ConfigSchema from 'src/config/Schema';
import IndexController from 'src/controllers/IndexController';
import SiteController from 'src/controllers/SiteController';
import PluginRepository from 'src/repositories/PluginRepository';
import SiteRepository from 'src/repositories/SiteRepository';
import LatestVersionResolver from 'src/services/latest-version/LatestVersionResolver';
import PhpLatestVersionProvider from 'src/services/latest-version/providers/PHP';
import WordPressApiLatestVersionProvider from 'src/services/latest-version/providers/plugin/WordPressApi';
import WordPressLatestVersionProvider from 'src/services/latest-version/providers/WordPress';
import MailResolver from 'src/services/mailing/MailResolver';
import SESMailProvider from 'src/services/mailing/providers/SES';
import WordFenceApiVulnerabilitiesProvider from 'src/services/vulnerabilities/providers/WordFenceApi';
import VulnerabilitiesResolver from 'src/services/vulnerabilities/VulnerabilitiesResolver';
import DeletePluginsUnusedTask from 'src/tasks/DeletePluginsUnused';
import DeleteSitesInactiveTask from 'src/tasks/DeleteSitesInactive';
import SendReportMailTask from 'src/tasks/SendReportMail';
import UpdatePluginsLatestVersionTask from 'src/tasks/UpdatePluginsLatestVersion';
import UpdatePluginsVulnerabilitiesTask from 'src/tasks/UpdatePluginsVulnerabilities';
import UpdateLatestPhpVersionProviderTask from 'src/tasks/UpdateLatestPhpVersionProvider';
import UpdateLatestWpVersionProviderTask from 'src/tasks/UpdateLatestWpVersionProvider';
import UpdateWordFenceVulnerabilitiesProviderTask from 'src/tasks/UpdateWordFenceVulnerabilitiesProvider';

Config.load(ConfigSchema);

const appLogger = new AppLogger(Config.getAppLoggerConfig());
const schedulerLogger = new SchdulerLogger(Config.getSchedulerLoggerConfig());

Server.setConfig(Config.getServerConfig());
const server = Server.getInstance(appLogger);

const latestVersionResolver = new LatestVersionResolver();
const phpLatestVersionProvider = new PhpLatestVersionProvider();
latestVersionResolver.setPhpProvider(phpLatestVersionProvider);

const wpLatestVersionProvider = new WordPressLatestVersionProvider();
latestVersionResolver.setWpProvider(wpLatestVersionProvider);

latestVersionResolver.addPluginProvider(new WordPressApiLatestVersionProvider());

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
    vulnerabilitiesResolver
);

const indexController = new IndexController(appLogger);
const siteController = new SiteController(appLogger, siteRepository, pluginRepository, latestVersionResolver);

server.useRouter('/', indexController.getRouter());
server.useRouter('/site', siteController.getRouter());
server
    .start()
    .then(() => {
        appLogger.info('Server started successfully');
    })
    .catch((error) => {
        appLogger.error('Failed to start server:', error);
        process.exit(1);
    });

const scheduler = Scheduler.getInstance(appLogger);
scheduler.addTask('update-plugins-latest-versions', '0 * * * *', () =>
    new UpdatePluginsLatestVersionTask(schedulerLogger, pluginRepository, latestVersionResolver).run()
); // Every hour
scheduler.addTask('update-plugins-vulnerabilities', '0 */3 * * *', () =>
    new UpdatePluginsVulnerabilitiesTask(schedulerLogger, pluginRepository).run()
); // Every 3 hours
scheduler.addTask('delete-plugins-unused', '0 12 * * *', () =>
    new DeletePluginsUnusedTask(schedulerLogger, pluginRepository).run()
); // Every day at 12:00
scheduler.addTask('delete-sites-inactive', '0 12 */7 * *', () =>
    new DeleteSitesInactiveTask(schedulerLogger, siteRepository).run()
); // Every 7 days at 12:00
scheduler.addTask('send-report-mail', '0 12 * * *', () =>
    new SendReportMailTask(schedulerLogger, siteRepository, pluginRepository, latestVersionResolver, mailResolver).run()
); // Every day at 12:00
scheduler.addTask('update-latest-php-version', '* */30 * * *', () =>
    new UpdateLatestPhpVersionProviderTask(schedulerLogger, phpLatestVersionProvider).run()
); // Every 30 minutes
scheduler.addTask('update-latest-wp-version', '* */30 * * *', () =>
    new UpdateLatestWpVersionProviderTask(schedulerLogger, wpLatestVersionProvider).run()
); // Every 30 minutes
scheduler.addTask('update-wordfence-vulnerabilities-version', '* */30 * * *', () =>
    new UpdateWordFenceVulnerabilitiesProviderTask(schedulerLogger, wordFenceApiVulnerabilitiesProvider).run()
); // Every 30 minutes

async function main() {
    try {
        await phpLatestVersionProvider.fetchLatestVersion();
        await wpLatestVersionProvider.fetchLatestVersion();
        await wordFenceApiVulnerabilitiesProvider.fetchVulnerabilities();
    } catch (err) {
        appLogger.error('Error while fetching initial data. Exiting application...', {
            error: err,
        });
        process.exit(1);
    }
}

main();
