import AbstractTask from 'src/tasks/AbstractTask';
import Logger from 'src/components/Logger';
import SiteRepository from 'src/repositories/SiteRepository';
import { TaskInterface } from 'src/tasks/TaskInterface';

export default class DeletePluginsUnusedTask extends AbstractTask implements TaskInterface {
    private siteRepository: SiteRepository;
    private MAX_INACTIVE_TIME = 864e5; // 1 day in seconds

    constructor(logger: Logger, siteRepository: SiteRepository) {
        super(logger);
        this.siteRepository = siteRepository;
    }

    public async run(): Promise<void> {
        try {
            const sites = await this.siteRepository.findAll();

            for (const site of sites) {
                const now = new Date();
                const diff = now.getTime() - site.getUpdatedAt().getTime();

                if (diff > this.MAX_INACTIVE_TIME) {
                    if (await this.siteRepository.delete(site.getId())) {
                        this.logger.scheduler.info(`Deleted inactive site: ${site.getName()} (ID: ${site.getId()})`, {
                            siteId: site.getId(),
                            siteName: site.getName(),
                        });
                    } else {
                        this.logger.scheduler.warn(
                            `Failed to delete inactive site: ${site.getName()} (ID: ${site.getId()})`,
                            {
                                siteId: site.getId(),
                                siteName: site.getName(),
                            }
                        );
                    }
                }
            }
        } catch (err) {
            this.logger.scheduler.error('Error while deleting inactive sites', { error: err });
        }
    }
}
