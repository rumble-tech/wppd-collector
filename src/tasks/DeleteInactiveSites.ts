import SiteRepository from 'src/repositories/SiteRepository';
import Logger from 'src/services/logger/Logger';
import AbstractTask from 'src/services/scheduler/AbstractTask';

export default class DeleteInactiveSitesTask extends AbstractTask {
    private readonly siteRepository: SiteRepository;
    private readonly MAX_INACTIVE_TIME_MS = 864e5; // 1 day

    constructor(logger: Logger, siteRepository: SiteRepository) {
        super(logger);

        this.siteRepository = siteRepository;
    }

    public async run(): Promise<void> {
        try {
            this.logger.info('Deleting inactive sites...');

            const sites = await this.siteRepository.findAll();

            for (const site of sites) {
                const now = new Date().getTime();
                const lastUpdated = new Date(site.getUpdatedAt()).getTime();

                if (now - lastUpdated > this.MAX_INACTIVE_TIME_MS) {
                    this.logger.info(`Deleting inactive site`, {
                        siteId: site.getId(),
                    });

                    if (!(await this.siteRepository.delete(site.getId()))) {
                        this.logger.error('Failed to delete site', {
                            siteId: site.getId(),
                        });

                        continue;
                    }

                    this.logger.info(`Successfully deleted site`, {
                        siteId: site.getId(),
                    });
                }
            }
        } catch (e) {
            this.logger.error('Failed to delete inactive sites', {
                err: e,
            });
        }
    }
}
