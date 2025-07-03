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

    private static isValidVersion(version: string): boolean {
        // allow version numbers that have 3 or 4 parts
        return /^\d+\.\d+\.\d+(?:\.\d+)?$/.test(version);
    }
}
