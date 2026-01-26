import { TPlugin } from 'src/entities/Plugin';
import { TSite, TSiteEnvironment } from 'src/entities/Site';
import { TSitePlugin } from 'src/entities/SitePlugin';
import PluginRepository from 'src/repositories/PluginRepository';
import PluginVulnerabilityRepository from 'src/repositories/PluginVulnerabilityRepository';
import SitePluginRepository from 'src/repositories/SitePluginRepository';
import SiteRepository from 'src/repositories/SiteRepository';
import LatestVersionResolver from 'src/resolver/latest-version/LatestVersionResolver';
import MailingResolver from 'src/resolver/mailing/MailingResolver';
import Config from 'src/services/config/Config';
import Logger from 'src/services/logger/Logger';
import AbstractTask from 'src/services/scheduler/AbstractTask';
import Utils, { TVersionDiffCategory } from 'src/Utils';

type TSiteReport = {
    name: TSite['name'];
    url: TSite['url'];
    environment: TSite['environment'];
    phpVersion: {
        installed: TSite['phpVersion'];
        latest: TSite['phpVersion'];
        diff: TVersionDiffCategory | null;
    };
    wpVersion: {
        installed: TSite['wpVersion'];
        latest: TSite['wpVersion'];
        diff: TVersionDiffCategory | null;
    };
    plugins: {
        countTotal: number;
        countMatchingVersions: number;
        mismatchingVersions: {
            slug: TPlugin['slug'];
            isActive: TSitePlugin['isActive'];
            version: {
                installed: string;
                latest: string;
                diff: TVersionDiffCategory;
            };
            vulnerabilities: {
                count: number;
                highestSeverity: number;
            };
        }[];
    };
};

type TGroupedReports = Record<TSiteEnvironment, TSiteReport[]>;

export default class SendReportMailTask extends AbstractTask {
    private readonly siteRepository: SiteRepository;
    private readonly pluginRepository: PluginRepository;
    private readonly sitePluginRepository: SitePluginRepository;
    private readonly pluginVulnerabilityRepository: PluginVulnerabilityRepository;
    private readonly latestVersionResolver: LatestVersionResolver;
    private readonly mailingResolver: MailingResolver;
    private readonly mailSender: string;
    private readonly mailRecipient: string;

    constructor(
        logger: Logger,
        siteRepository: SiteRepository,
        pluginRepository: PluginRepository,
        sitePluginRepository: SitePluginRepository,
        pluginVulnerabilityRepository: PluginVulnerabilityRepository,
        latestVersionResolver: LatestVersionResolver,
        mailingResolver: MailingResolver
    ) {
        super(logger);

        this.siteRepository = siteRepository;
        this.pluginRepository = pluginRepository;
        this.sitePluginRepository = sitePluginRepository;
        this.pluginVulnerabilityRepository = pluginVulnerabilityRepository;
        this.latestVersionResolver = latestVersionResolver;
        this.mailingResolver = mailingResolver;

        this.mailSender = Config.get<string>('MAILING_REPORT_SENDER');
        this.mailRecipient = Config.get<string>('MAILING_REPORT_RECIPIENT');
    }

    public async run(): Promise<void> {
        try {
            const groupedReports = await this.getGroupedReports();
            const mailBody = this.buildMailBody(groupedReports);

            await this.mailingResolver.sendMail(this.mailSender, this.mailRecipient, 'Rumble WPPD Report', mailBody);
        } catch (e) {
            this.logger.error('Failed to send report mail', { err: e });
        }
    }

    private async getGroupedReports(): Promise<TGroupedReports> {
        const siteSortPriority: Record<TSiteEnvironment & null, number> = {
            production: 1,
            staging: 2,
            development: 3,
            null: 4,
        };

        const pluginSortPriority: Record<Exclude<TVersionDiffCategory, 'same' | 'invalid'>, number> = {
            major: 1,
            minor: 2,
            patch: 3,
            igl: 4,
        };

        const reports: TSiteReport[] = [];

        const sites = await this.siteRepository.findAll();
        const latestPhpVersion = this.latestVersionResolver.resolvePhp();
        const latestWpVersion = this.latestVersionResolver.resolveWordPress();

        for (const site of sites) {
            const sitePlugins = await this.sitePluginRepository.findAll();
            const sitePluginsMismatchingVersions: TSiteReport['plugins']['mismatchingVersions'] = [];

            for (const sitePlugin of sitePlugins) {
                const plugin = await this.pluginRepository.findById(sitePlugin.getPluginId());

                if (!plugin) {
                    continue;
                }

                const installedVersion = sitePlugin.getInstalledVersion();
                const latestVersion = plugin.getLatestVersion();

                if (!installedVersion || !latestVersion) {
                    continue;
                }

                const versionDiffCategory = Utils.categorizeVersionDifference(installedVersion, latestVersion);
                if (versionDiffCategory === 'same' || versionDiffCategory === 'invalid') {
                    continue;
                }

                const vulnerabilities = await this.pluginVulnerabilityRepository.findAllByPluginIdAndInstalledVersion(
                    plugin.getId(),
                    installedVersion
                );

                sitePluginsMismatchingVersions.push({
                    slug: plugin.getSlug(),
                    isActive: sitePlugin.getIsActive(),
                    version: {
                        installed: installedVersion,
                        latest: latestVersion,
                        diff: versionDiffCategory,
                    },
                    vulnerabilities: {
                        count: vulnerabilities.length,
                        highestSeverity: vulnerabilities.reduce(
                            (max, vulnerability) => Math.max(max, vulnerability.getSeverity()),
                            0
                        ),
                    },
                });
            }

            if (sitePluginsMismatchingVersions.length > 0) {
                sitePluginsMismatchingVersions.sort((a, b) => {
                    const priorityA = pluginSortPriority[a.version.diff];
                    const priorityB = pluginSortPriority[b.version.diff];

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

            const installedPhpVersion = site.getPhpVersion();
            const installedWpVersion = site.getWpVersion();

            reports.push({
                name: site.getName(),
                url: site.getUrl(),
                environment: site.getEnvironment(),
                phpVersion: {
                    installed: installedPhpVersion,
                    latest: latestPhpVersion,
                    diff:
                        installedPhpVersion && latestPhpVersion
                            ? Utils.categorizeVersionDifference(installedPhpVersion, latestPhpVersion)
                            : null,
                },
                wpVersion: {
                    installed: installedWpVersion,
                    latest: latestWpVersion,
                    diff:
                        installedWpVersion && latestWpVersion
                            ? Utils.categorizeVersionDifference(installedWpVersion, latestWpVersion)
                            : null,
                },
                plugins: {
                    countTotal: sitePlugins.length,
                    countMatchingVersions: sitePlugins.length - sitePluginsMismatchingVersions.length,
                    mismatchingVersions: sitePluginsMismatchingVersions,
                },
            });
        }

        reports.sort((a, b) => {
            return siteSortPriority[a.environment] - siteSortPriority[b.environment];
        });

        return reports.reduce((acc, report) => {
            if (!acc[report.environment]) {
                acc[report.environment] = [];
            }

            acc[report.environment].push(report);

            return acc;
        }, {} as TGroupedReports);
    }

    private buildMailBody(groupedReports: TGroupedReports): string {
        return `
            <html>
                <head>
                    <style>
                        * {
                            font-family: Arial, sans-serif;
                            font-size: 14px;
                        }
                        span#title {
                            font-size: 24px;
                            font-weight: bold;
                        }
                        hr {
                            margin-bottom: 16px;
                            margin-top: 16px;
                        }
                        span.environment-title {
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
                    ${Object.keys(groupedReports)
                        .map(
                            (environment) =>
                                groupedReports[environment].length > 0 &&
                                `
                                <hr>
                                <div>
                                    <span class="environment-title">${environment.charAt(0).toUpperCase() + environment.slice(1)}</span>
                                    ${groupedReports[environment].map(
                                        (report: TSiteReport) => `
                                        <hr>
                                        <div>
                                            <table>
                                                <tbody>
                                                    <tr class="odd">
                                                        <td class="key title">Site</td>
                                                        <td colspan="6">${report.name}</td>
                                                    </tr>
                                                    <tr class="even">
                                                        <td class="key title">URL</td>
                                                        <td colspan="6">${report.url}</td>
                                                    </tr>
                                                    <tr class="odd">
                                                        <td class="key title" rowspan="2">PHP Version</td>
                                                        <td class="title">Installed</td>
                                                        <td class="title">Latest</td>
                                                        <td class="title">Diff</td>
                                                        <td class="title" colspan="3"></td>
                                                    </tr>
                                                    <tr class="even">
                                                        <td>${report.phpVersion.installed}</td>
                                                        <td>${report.phpVersion.latest}</td>
                                                        <td style="color: ${this.getColorForVersionDifference(
                                                            report.phpVersion.diff
                                                        )}; font-weight: bold;">${
                                                            report.phpVersion.diff
                                                                ? report.phpVersion.diff.toUpperCase()
                                                                : '-'
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
                                                        <td>${report.wpVersion.installed}</td>
                                                        <td>${report.wpVersion.latest}</td>
                                                        <td style="color: ${this.getColorForVersionDifference(
                                                            report.wpVersion.diff
                                                        )}; font-weight: bold;">${
                                                            report.wpVersion.diff
                                                                ? report.wpVersion.diff.toUpperCase()
                                                                : '-'
                                                        }</td>
                                                        <td colspan="3"></td>
                                                    </tr>
                                                    <tr class="odd">
                                                        <td class="key title">Total Plugins</td>
                                                        <td colspan="6">${report.plugins.countTotal}</td>
                                                    </tr>
                                                    <tr class="even">
                                                        <td class="key title">Plugins with matching versions</td>
                                                        <td colspan="6">${report.plugins.countMatchingVersions}</td>
                                                    </tr>
                                                </tbody>
                                                <tr class="odd">
                                                    <td class="key title" rowspan="${report.plugins.mismatchingVersions.length === 0 ? 1 : report.plugins.mismatchingVersions.length + 1}">Plugins with mismatching versions</td>
                                                    ${
                                                        report.plugins.mismatchingVersions.length === 0
                                                            ? '<td colspan="6">0</td>'
                                                            : `
                                                        <td class="title">Slug</td>
                                                        <td class="title" style="width: 10%;">Active</td>
                                                        <td class="title" style="width: 10%;">Installed Version</td>
                                                        <td class="title" style="width: 10%;">Latest Version</td>
                                                        <td class="title" style="width: 10%;">Version Difference</td>
                                                        <td class="title" style="width: 10%;">Vulnerabilities</td>
                                                    `
                                                    }
                                                </tr>
                                                ${report.plugins.mismatchingVersions.map(
                                                    (plugin, index) => `
                                                    <tr class="${index % 2 === 0 ? 'even' : 'odd'}">
                                                        <td>${plugin.slug}</td>
                                                        <td>${plugin.isActive ? 'Yes' : 'No'}</td>
                                                        <td>${plugin.version.installed}</td>
                                                        <td>${plugin.version.latest}</td>
                                                        <td style="font-weight: bold; color: ${this.getColorForVersionDifference(plugin.version.diff)}">${plugin.version.diff.toUpperCase()}</td>
                                                        <td>${plugin.vulnerabilities.count === 0 ? '-' : `${plugin.vulnerabilities.count} - ${plugin.vulnerabilities.highestSeverity}`}</td>
                                                    </tr>
                                                `
                                                )}
                                            </table>
                                        </div>
                                    `
                                    )}
                                </div>
                            `
                        )
                        .join('')}
                </body>
            </html>
        `;
    }

    private getColorForVersionDifference(diff: TVersionDiffCategory | null): string {
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
