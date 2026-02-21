export type TVersionDiffCategory = 'major' | 'minor' | 'patch' | 'same' | 'igl' | 'invalid';

export default class Utils {
    public static formatVersion(version: string): string {
        const parts = version.split('.');

        while (parts.length < 3) {
            parts.push('0');
        }

        const combined = parts.join('.');

        if (!Utils.isValidVersion(combined)) {
            return 'invalid-version';
        }

        return combined;
    }

    public static categorizeVersionDifference(installedVersion: string, latestVersion: string): TVersionDiffCategory {
        if (!Utils.isValidVersion(installedVersion) || !Utils.isValidVersion(latestVersion)) {
            return 'invalid';
        }

        const [installedMajor, installedMinor, installedPatch] = installedVersion.split('.').map(Number);
        const [latestMajor, latestMinor, latestPatch] = latestVersion.split('.').map(Number);

        if (
            installedMajor > latestMajor ||
            (installedMajor === latestMajor && installedMinor > latestMinor) ||
            (installedMajor === latestMajor && installedMinor === latestMinor && installedPatch > latestPatch)
        ) {
            return 'igl';
        }

        if (installedMajor !== latestMajor) {
            return 'major';
        } else if (installedMinor !== latestMinor) {
            return 'minor';
        } else if (installedPatch !== latestPatch) {
            return 'patch';
        }

        return 'same';
    }

    public static getPluginSlugFromFile(file: string): string | null {
        const split = file.split('/');

        if (split.length !== 2) {
            return null;
        }

        return split[0];
    }

    public static compareVersions(versionA: string, versionB: string): 'less' | 'equal' | 'greater' | 'invalid' {
        if (!Utils.isValidVersion(versionA) || !Utils.isValidVersion(versionB)) {
            return 'invalid';
        }

        const partsA = versionA.split('.').map(Number);
        const partsB = versionB.split('.').map(Number);

        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
            const partA = partsA[i] || 0;
            const partB = partsB[i] || 0;

            if (partA < partB) {
                return 'less';
            } else if (partA > partB) {
                return 'greater';
            }
        }

        return 'equal';
    }

    private static isValidVersion(version: string): boolean {
        return /^\d+\.\d+\.\d+(?:\.\d+)?$/.test(version);
    }
}
