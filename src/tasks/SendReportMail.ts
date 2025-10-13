import { LoggerInterface } from 'src/components/logger/LoggerInterface';
import Config from 'src/config/Config';
import { TPlugin } from 'src/models/Plugin';
import { siteEnvironments, TSite, TSiteEnvironment } from 'src/models/Site';
import { TSitePlugin } from 'src/models/SitePlugin';
import PluginRepository from 'src/repositories/PluginRepository';
import SiteRepository from 'src/repositories/SiteRepository';
import LatestVersionResolver from 'src/services/latest-version/LatestVersionResolver';
import MailResolver from 'src/services/mailing/MailResolver';
import AbstractTask from 'src/tasks/AbstractTask';
import { TaskInterface } from 'src/tasks/TaskInterface';
import Tools from 'src/Tools';

type TSiteReport = {
    name: TSite['name'];
    url: TSite['url'];
    environment: TSiteEnvironment;
    phpVersion: {
        installed: TSite['phpVersion'];
        latest: string | null;
        diff: 'major' | 'minor' | 'patch' | 'igl' | 'same' | 'invalid' | null;
    };
    wpVersion: {
        installed: TSite['wpVersion'];
        latest: string | null;
        diff: 'major' | 'minor' | 'patch' | 'igl' | 'same' | 'invalid' | null;
    };
    plugins: {
        total: number;
        matchingVersions: number;
        mismatchingVersions: {
            slug: TPlugin['slug'];
            isActive: TSitePlugin['isActive'];
            installedVersion: TSitePlugin['installedVersion'];
            latestVersion: TPlugin['latestVersion'];
            difference: 'major' | 'minor' | 'patch' | 'igl';
            severity: {
                countVulnerabilities: number;
                highestScore: number;
            };
        }[];
    };
};

type GroupedReport = Record<TSiteEnvironment, TSiteReport[]>;

export default class SendReportMailTask extends AbstractTask implements TaskInterface {
    private siteRepository: SiteRepository;
    private pluginRepository: PluginRepository;
    private latestVersionResolver: LatestVersionResolver;
    private mailResolver: MailResolver;

    constructor(
        logger: LoggerInterface,
        siteRepository: SiteRepository,
        pluginRepository: PluginRepository,
        latestVersionResolver: LatestVersionResolver,
        mailResolver: MailResolver
    ) {
        super(logger);
        this.siteRepository = siteRepository;
        this.pluginRepository = pluginRepository;
        this.latestVersionResolver = latestVersionResolver;
        this.mailResolver = mailResolver;
    }

    public async run(): Promise<void> {
        try {
            if (!Config.get<boolean>('MAILING_ENABLED')) {
                this.logger.info('Mailing is disabled, skipping report mail sending.');
                return;
            }

            const groupedReports = await this.getGroupedReports();
            const mailContent = this.buildMailContent(groupedReports);

            this.logger.info('Sending report mail...');

            await this.mailResolver.sendMail(
                Config.get<string>('MAILING_REPORT_SENDER'),
                Config.get<string>('MAILING_REPORT_RECIPIENT'),
                'Rumble WPPD Report',
                mailContent
            );
            this.logger.info('Rumble WPPD Report generated and sent via email.');
        } catch (err) {
            this.logger.error('Failed to send Rumble WPPD Report via email', { error: err });
        }
    }

    private async getGroupedReports(): Promise<GroupedReport> {
        const siteSortPriority: Record<string, number> = {
            production: 1,
            staging: 2,
            development: 3,
            null: 4,
        };

        const pluginSortPriority: Record<string, number> = {
            major: 1,
            minor: 2,
            patch: 3,
            igl: 4,
        };

        const siteReports: TSiteReport[] = [];

        const sites = await this.siteRepository.findAll();
        const latestPhpVersion = await this.latestVersionResolver.resolvePhp();
        const latestWpVersion = await this.latestVersionResolver.resolveWp();

        for (const site of sites) {
            const sitePlugins = await this.siteRepository.findAllSitePlugins(site.getId());
            const sitePluginsWithMismatchingVersions: TSiteReport['plugins']['mismatchingVersions'] = [];

            for (const sitePlugin of sitePlugins) {
                const installedVersion = sitePlugin.getInstalledVersion();
                const latestVersion = sitePlugin.getLatestVersion();

                if (installedVersion.version === null || latestVersion.version === null) {
                    continue;
                }

                const sitePluginVersionDiffCategory = Tools.categorizeVersionDiff(
                    installedVersion.version,
                    latestVersion.version
                );

                if (sitePluginVersionDiffCategory === 'invalid' || sitePluginVersionDiffCategory === 'same') {
                    continue;
                }

                const vulnerabilities = await this.pluginRepository.getVulnerabilities(sitePlugin.getSlug());
                if (vulnerabilities === null) {
                    this.logger.warn(`Failed to fetch vulnerabilities for plugin`, { slug: sitePlugin.getSlug() });
                    continue;
                }

                const filteredVulnerabilities = vulnerabilities.filter(({ to }) => {
                    if (to.version === '*' || !to.version || !installedVersion.version) {
                        return true;
                    }

                    const cmp = Tools.compareVersions(to.version, installedVersion.version);

                    if (cmp === null) {
                        return false;
                    }

                    return cmp > 0 || (cmp === 0 && to.inclusive);
                });

                sitePluginsWithMismatchingVersions.push({
                    slug: sitePlugin.getSlug(),
                    isActive: sitePlugin.getIsActive(),
                    installedVersion: installedVersion.version,
                    latestVersion: latestVersion.version,
                    difference: sitePluginVersionDiffCategory,
                    severity: {
                        countVulnerabilities: filteredVulnerabilities.length,
                        highestScore: filteredVulnerabilities.reduce(
                            (max, vulnerability) => Math.max(max, vulnerability.score),
                            0
                        ),
                    },
                });
            }

            if (sitePluginsWithMismatchingVersions.length > 0) {
                sitePluginsWithMismatchingVersions.sort((a, b) => {
                    const priorityA = pluginSortPriority[a.difference];
                    const priorityB = pluginSortPriority[b.difference];

                    if (priorityA === priorityB) {
                        if (a.slug < b.slug) {
                            return -1;
                        } else {
                            return 1;
                        }
                    }

                    return priorityA - priorityB;
                });
            }

            const sitePhpVersion = site.getPhpVersion();
            const siteWpVersion = site.getWpVersion();

            siteReports.push({
                name: site.getName(),
                url: site.getUrl(),
                environment: site.getEnvironment(),
                phpVersion: {
                    installed: sitePhpVersion,
                    latest: latestPhpVersion,
                    diff:
                        sitePhpVersion && latestPhpVersion
                            ? Tools.categorizeVersionDiff(sitePhpVersion, latestPhpVersion)
                            : null,
                },
                wpVersion: {
                    installed: siteWpVersion,
                    latest: latestWpVersion,
                    diff:
                        siteWpVersion && latestWpVersion
                            ? Tools.categorizeVersionDiff(siteWpVersion, latestWpVersion)
                            : null,
                },
                plugins: {
                    total: sitePlugins.length,
                    matchingVersions: sitePlugins.length - sitePluginsWithMismatchingVersions.length,
                    mismatchingVersions: sitePluginsWithMismatchingVersions,
                },
            });
        }

        siteReports.sort((a, b) => {
            return siteSortPriority[a.environment] - siteSortPriority[b.environment];
        });

        const groupedReports: GroupedReport = siteReports.reduce((acc, report) => {
            if (!acc[report.environment]) {
                acc[report.environment] = [];
            }

            acc[report.environment].push(report);
            return acc;
        }, {} as GroupedReport);

        return groupedReports;
    }

    private buildMailContent(reports: GroupedReport): string {
        const html = `
            <html>
                <head>
                    <style>
                        * {
                            font-family: Arial, sans-serif;
                            font-size: 14px;
                        }
                        hr {
                            margin-bottom: 16px;
                            margin-top: 16px;
                        }
                        span#title {
                            font-size: 24px;
                            font-weight: bold;
                        }
                        div.environment-wrapper > span.environment-title {
                            font-size: 20px;
                            font-weight: bold;
                        }
                        table {
                            width: 100%;
                        }
                        table > tbody > tr > td {
                            padding: 4px;
                        }
                        table > tbody > tr.odd > td {
                            background: #ddd;
                        }
                        table > tbody > tr.even > td {
                            background: #eee;
                        }
                        table > tbody > tr > td.key {
                            width: 20%;
                        }
                        table > tbody > tr > td.title {
                            background: #ccc;
                            font-weight: bold;
                        }

                    </style>
                </head>
                <body>
                    <span id="title">Rumble WPPD Report</span>
                    ${siteEnvironments
                        .map((environment) =>
                            reports[environment]
                                ? `
                        <hr>
                        <div class="environment-wrapper">
                            <span class="environment-title">${
                                environment.charAt(0).toUpperCase() + environment.slice(1)
                            }</span>
                            ${reports[environment]
                                .map(
                                    (siteReport) =>
                                        `
                            <hr>
                            <div class="site-wrapper">
                                <table>
                                    <tbody>
                                        <tr class="odd">
                                            <td class="key title">Site</td>
                                            <td colspan="6">${siteReport.name}</td>
                                        </tr>
                                        <tr class="even">
                                            <td class="key title">URL</td>
                                            <td colspan="6">${siteReport.url}</td>
                                        </tr>
                                        <tr class="odd">
                                            <td class="key title" rowspan="2">PHP Version</td>
                                            <td class="title">Installed</td>
                                            <td class="title">Latest</td>
                                            <td class="title">Diff</td>
                                            <td class="title" colspan="3"></td>
                                        </tr>
                                        <tr class="even">
                                            <td>${siteReport.phpVersion.installed}</td>
                                            <td>${siteReport.phpVersion.latest}</td>
                                             <td style="color: ${this.getColorForVersionDiff(
                                                 siteReport.phpVersion.diff
                                             )}; font-weight: bold;">${
                                            siteReport.phpVersion.diff ? siteReport.phpVersion.diff.toUpperCase() : '-'
                                        }</td>
                                            <td colspan="3"></td>
                                        </tr>
                                        <tr class="odd">
                                            <td class="key title" rowspan="2">WP Version</td>
                                            <td class="title">Installed</td>
                                            <td class="title">Latest</td>
                                            <td class="title">Diff</td>
                                            <td class="title" colspan="3"></td>
                                        </tr>
                                        <tr class="even">
                                            <td>${siteReport.wpVersion.installed}</td>
                                            <td>${siteReport.wpVersion.latest}</td>
                                             <td style="color: ${this.getColorForVersionDiff(
                                                 siteReport.wpVersion.diff
                                             )}; font-weight: bold;">${
                                            siteReport.wpVersion.diff ? siteReport.wpVersion.diff.toUpperCase() : '-'
                                        }</td>
                                            <td colspan="3"></td>
                                        </tr>
                                        <tr class="odd">
                                            <td class="key title">Total Plugins</td>
                                            <td colspan="6">${siteReport.plugins.total}</td>
                                        </tr>
                                        <tr class="even">
                                            <td class="key title">Plugins with matching versions</td>
                                            <td colspan="6">${siteReport.plugins.matchingVersions}</td>
                                        </tr>
                                        <tr class="odd">
                                            <td class="key title" rowspan="${
                                                siteReport.plugins.mismatchingVersions.length > 0
                                                    ? siteReport.plugins.mismatchingVersions.length + 1
                                                    : 1
                                            }">Plugins with mismatching versions</td>
                                            ${
                                                siteReport.plugins.mismatchingVersions.length > 0
                                                    ? `
                                            <td class="title">Plugin ID</td>
                                            <td class="title" style="width: 10%;">Active</td>
                                            <td class="title" style="width: 10%;">Installed Version</td>
                                            <td class="title" style="width: 10%;">Latest Version</td>
                                            <td class="title" style="width: 10%;">Difference</td>
                                            <td class="title" style="width: 10%;">Severity</td>
                                            `
                                                    : `
                                            <td colspan="6">0</td>
                                            `
                                            }
                                        </tr>
                                        ${siteReport.plugins.mismatchingVersions
                                            .map(
                                                (plugin, index) =>
                                                    `
                                        <tr class="${index % 2 === 0 ? 'even' : 'odd'}">
                                            <td>${plugin.slug}</td>
                                            <td>${plugin.isActive === true ? 'Yes' : 'No'}</td>
                                            <td>${plugin.installedVersion}</td>
                                            <td>${plugin.latestVersion}</td>
                                            <td style="color: ${this.getColorForVersionDiff(
                                                plugin.difference
                                            )}; font-weight: bold;">${plugin.difference.toUpperCase()}</td>
                                            <td>${
                                                plugin.severity.countVulnerabilities > 0
                                                    ? `${plugin.severity.countVulnerabilities} - ${plugin.severity.highestScore}`
                                                    : '-'
                                            }</td>
                                        </tr>
                                        `
                                            )
                                            .join('')}
                                    </tbody>
                                </table>
                            </div>
                            `
                                )
                                .join('')}
                        </div>
                        `
                                : ''
                        )
                        .join('')}
                </body>
            <html>
        `;

        return html;
    }

    private getColorForVersionDiff(diff: 'major' | 'minor' | 'patch' | 'igl' | 'same' | 'invalid' | null): string {
        switch (diff) {
            case 'major':
                return '#f2495d';
            case 'minor':
                return '#ff9830';
            case 'patch':
                return '#fade2a';
            case 'igl':
                return '#0794f2';
            case 'same':
                return '#73bf69';
            case 'invalid':
                return '#808080';
            default:
                return 'black';
        }
    }
}
