import { TPlugin } from 'src/entities/Plugin';
import { TPluginVulnerability } from 'src/entities/PluginVulnerability';
import AbstractPluginVulnerabilitiesProvider
    from 'src/resolver/vulnerabilities/providers/plugin/AbstractPluginVulnerabilitiesProvider';
import Utils from 'src/Utils';
import Config from 'src/services/config/Config';
import axios from 'axios';

export default class WordFenceApiPluginVulnerabilitiesProvider extends AbstractPluginVulnerabilitiesProvider {
    private readonly apiUrl = 'https://www.wordfence.com/api/intelligence/v3/vulnerabilities/production';
    private apiKey: string;

    private vulnerabilities: Record<
        TPlugin['slug'],
        Omit<TPluginVulnerability, 'id' | 'createdAt' | 'pluginId'>[] | null
    > = {};

    public get(slug: TPlugin['slug']): Omit<TPluginVulnerability, 'id' | 'createdAt' | 'pluginId'>[] | null {
        const pluginVulnerabilities = this.vulnerabilities[slug];

        if (!pluginVulnerabilities) {
            return null;
        }

        return pluginVulnerabilities;
    }

    public async fetch(): Promise<void> {
        try {
            if (!this.apiKey) {
                this.apiKey = Config.get<string>('WORDFENCE_API_KEY');
            }
            
            const response = await axios({
                method: 'GET',
                url: this.apiUrl,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
            });

            const data = response.data as Record<
                TPlugin['slug'],
                {
                    software: {
                        type: string;
                        name: string;
                        slug: string;
                        affected_versions: Record<
                            string,
                            {
                                from_version: string;
                                from_inclusive: boolean;
                                to_version: string;
                                to_inclusive: boolean;
                            }
                        >;
                    }[];
                    cvss: {
                        score: number;
                    };
                    published: string;
                    description: string;
                    references: string[];
                }
            >;

            const map: Record<TPlugin['slug'], Omit<TPluginVulnerability, 'id' | 'createdAt' | 'pluginId'>[]> = {};

            Object.entries(data).forEach(([_, vulnerabilityData]) => {
                vulnerabilityData.software.forEach((software) => {
                    if (software.type === 'plugin') {
                        const slug = software.slug;

                        if (!map[slug]) {
                            map[slug] = [];
                        }

                        Object.values(software.affected_versions).forEach((affectedVersion) => {
                            map[slug].push({
                                fromVersion: {
                                    version:
                                        affectedVersion.from_version === '*'
                                            ? '*'
                                            : Utils.formatVersion(affectedVersion.from_version),
                                    inclusive: affectedVersion.from_inclusive,
                                },
                                toVersion: {
                                    version:
                                        affectedVersion.to_version === '*'
                                            ? '*'
                                            : Utils.formatVersion(affectedVersion.to_version),
                                    inclusive: affectedVersion.to_inclusive,
                                },
                                severity: vulnerabilityData.cvss.score,
                                publishedAt: new Date(vulnerabilityData.published),
                                description: vulnerabilityData.description,
                                references: vulnerabilityData.references.join('|') || null,
                            });
                        });
                    }
                });
            });

            this.vulnerabilities = map;
        } catch (e) {
            this.logger.error('Failed to fetch vulnerabilities from WordFence API', {
                error: e.message,
            });

            this.vulnerabilities = {};
        }
    }
}
