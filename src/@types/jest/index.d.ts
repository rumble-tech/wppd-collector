import Plugin from 'src/entities/Plugin';
import PluginVulnerability from 'src/entities/PluginVulnerability';
import Site from 'src/entities/Site';
import SitePlugin from 'src/entities/SitePlugin';

declare global {
    namespace jest {
        export interface Matchers<R> {
            toEqualSiteEntity(expected: Site): R;
            toEqualPluginEntity(expected: Plugin): R;
            toEqualSitePluginEntity(expected: SitePlugin): R;
            toEqualPluginVulnerabilityEntity(expected: PluginVulnerability): R;
        }
    }
}
