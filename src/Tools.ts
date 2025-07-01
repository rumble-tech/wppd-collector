export default class Tools {
    public static formatVersionToMMP(version: string): string {
        const versionParts = version.split('.');

        while (versionParts.length < 3) {
            versionParts.push('0');
        }

        return versionParts.join('.');
    }

    public static getPluginSlugFromFile(file: string): string | null {
        const split = file.split('/');

        if (split.length !== 2) {
            return null;
        }

        return split[0];
    }
}
