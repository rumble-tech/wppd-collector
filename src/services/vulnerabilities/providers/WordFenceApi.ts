import axios, { AxiosRequestConfig } from 'axios';
import Config from 'src/config/Config';
import { TPlugin, TPluginVulnerability } from 'src/models/Plugin';
import { VulnerabilitiesProviderInterface } from 'src/services/vulnerabilities/VulnerabilitiesProviderInterface';

type TWordFenceApiResponse = {
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
};

export default class WordFenceApiVulnerabilitiesProvider implements VulnerabilitiesProviderInterface {
    private vulnerabilities: Record<string, Omit<TPluginVulnerability, 'id' | 'pluginId'>[]> = {};

    public getVulnerabilities(slug: TPlugin['slug']): Omit<TPluginVulnerability, 'id' | 'pluginId'>[] | null {
        const pluginVulnerabilities = this.vulnerabilities[slug];

        if (!pluginVulnerabilities) {
            return null;
        }

        return pluginVulnerabilities;
    }

    public async fetchVulnerabilities(): Promise<void> {
        const requestConfig: AxiosRequestConfig = {
            method: 'GET',
            url: Config.get<string>('WORDFENCE_API_URL'),
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const response = await axios(requestConfig);
        const data = response.data as Record<string, TWordFenceApiResponse>;
        const map: Record<string, Omit<TPluginVulnerability, 'id' | 'pluginId'>[]> = {};

        Object.entries(data).forEach(([_, vulnData]) => {
            vulnData.software.forEach((software) => {
                if (software.type === 'plugin') {
                    const slug = software.slug;

                    if (!map[slug]) {
                        map[slug] = [];
                    }

                    Object.values(software.affected_versions).forEach((affectedVersion) => {
                        map[slug].push({
                            from: {
                                version: affectedVersion.from_version,
                                inclusive: affectedVersion.from_inclusive,
                            },
                            to: {
                                version: affectedVersion.to_version,
                                inclusive: affectedVersion.to_inclusive,
                            },
                            score: vulnData.cvss.score,
                        });
                    });
                }
            });
        });

        this.vulnerabilities = map;
    }
}
