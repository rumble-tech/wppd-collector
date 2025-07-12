import { LoggerInterface } from 'src/components/logger/LoggerInterface';
import SiteRepository from 'src/repositories/SiteRepository';
import AbstractTask from 'src/tasks/AbstractTask';
import { TaskInterface } from 'src/tasks/TaskInterface';

export default class DeleteSitesInactiveTask extends AbstractTask implements TaskInterface {
    private siteRepository: SiteRepository;
    private MAX_INACTIVE_TIME = 864e5; // 1 day in milli seconds

    constructor(logger: LoggerInterface, siteRepository: SiteRepository) {
        super(logger);
        this.siteRepository = siteRepository;
    }

    public async run(): Promise<void> {
        try {
            const sites = await this.siteRepository.findAll();

            for (const site of sites) {
                const now = Date.now();
                const diff = now - site.getUpdatedAt().getTime();

                if (diff > this.MAX_INACTIVE_TIME) {
                    if (await this.siteRepository.delete(site.getId())) {
                        this.logger.info(`Deleted inactive site: ${site.getName()} (ID: ${site.getId()})`, {
                            siteId: site.getId(),
                            siteName: site.getName(),
                        });
                    } else {
                        this.logger.warn(`Failed to delete inactive site: ${site.getName()} (ID: ${site.getId()})`, {
                            siteId: site.getId(),
                            siteName: site.getName(),
                        });
                    }
                }
            }
        } catch (err) {
            this.logger.error('Error while deleting inactive sites', { error: err });
        }
    }
}
