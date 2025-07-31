export default class Tools {
    public static formatVersionToMMP(version: string): string {
        const versionParts = version.split('.');

        while (versionParts.length < 3) {
            versionParts.push('0');
        }

        const constructedVersion = versionParts.join('.');

        if (!Tools.isValidVersion(constructedVersion)) {
            return 'invalid-version-format';
        }

        return constructedVersion;
    }

    public static getPluginSlugFromFile(file: string): string | null {
        const split = file.split('/');

        if (split.length !== 2) {
            return null;
        }

        return split[0];
    }

    public static categorizeVersionDiff(
        installedVersion: string,
        latestVersion: string
    ): 'major' | 'minor' | 'patch' | 'same' | 'igl' | 'invalid' {
        if (!Tools.isValidVersion(installedVersion) || !Tools.isValidVersion(latestVersion)) {
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

    public static compareVersions(version1: string, version2: string): number | null {
        if (!Tools.isValidVersion(version1) || !Tools.isValidVersion(version2)) {
            return null;
        }

        const parts1 = version1.split('.').map((n) => parseInt(n, 10) || 0);
        const parts2 = version2.split('.').map((n) => parseInt(n, 10) || 0);

        const len = Math.max(parts1.length, parts2.length);

        for (let i = 0; i < len; i++) {
            const na = parts1[i] || 0;
            const nb = parts2[i] || 0;

            if (na > nb) return 1;
            if (na < nb) return -1;
        }

        return 0;
    }

    private static isValidVersion(version: string): boolean {
        // allow version numbers that have 3 or 4 parts
        return /^\d+\.\d+\.\d+(?:\.\d+)?$/.test(version);
    }
}
