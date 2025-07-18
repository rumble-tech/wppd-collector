import Tools from './Tools';

describe('Tools', () => {
    describe('Tools.formatVersionToMMP', () => {
        it('should format version to MMP format', () => {
            expect(Tools.formatVersionToMMP('1.2')).toBe('1.2.0');
            expect(Tools.formatVersionToMMP('1.2.3')).toBe('1.2.3');
        });

        it('should return "invalid-version-format"', () => {
            expect(Tools.formatVersionToMMP('invalid')).toBe('invalid-version-format');
        });
    });

    describe('Tools.getPluginSlugFromFile', () => {
        it('should return the correct slug', () => {
            const file = 'plugin-name/plugin-file.js';
            const result = Tools.getPluginSlugFromFile(file);
            expect(result).toBe('plugin-name');
        });

        it('should return null for invalid file format', () => {
            const file = 'invalid-file-format.js';
            const result = Tools.getPluginSlugFromFile(file);
            expect(result).toBeNull();
        });
    });

    describe('Tools.categorizeVersionDiff', () => {
        it('should return "major" for major version difference', () => {
            expect(Tools.categorizeVersionDiff('1.0.0', '2.0.0')).toBe('major');
        });

        it('should return "minor" for minor version difference', () => {
            expect(Tools.categorizeVersionDiff('1.0.0', '1.1.0')).toBe('minor');
        });

        it('should return "patch" for patch version difference', () => {
            expect(Tools.categorizeVersionDiff('1.0.0', '1.0.1')).toBe('patch');
        });

        it('should return "same" for same version', () => {
            expect(Tools.categorizeVersionDiff('1.0.0', '1.0.0')).toBe('same');
        });

        it('should return "igl" for installed version greater than latest', () => {
            expect(Tools.categorizeVersionDiff('2.0.0', '1.0.0')).toBe('igl');
        });

        it('should return "invalid" for invalid version formats', () => {
            expect(Tools.categorizeVersionDiff('invalid', '1.0.0')).toBe('invalid');
            expect(Tools.categorizeVersionDiff('1.0.0', 'invalid')).toBe('invalid');
            expect(Tools.categorizeVersionDiff('invalid', 'invalid')).toBe('invalid');
        });
    });

    describe('Tools.compareVersions', () => {
        it('should return a positive number for version1 > version2', () => {
            expect(Tools.compareVersions('1.0.1', '1.0.0')).toBeGreaterThan(0);
        });

        it('should return a negative number for version1 < version2', () => {
            expect(Tools.compareVersions('1.0.0', '1.0.1')).toBeLessThan(0);
        });

        it('should return 0 for equal versions', () => {
            expect(Tools.compareVersions('1.0.0', '1.0.0')).toBe(0);
        });

        it('should return null for invalid version formats', () => {
            expect(Tools.compareVersions('invalid', '1.0.0')).toBeNull();
            expect(Tools.compareVersions('1.0.0', 'invalid')).toBeNull();
            expect(Tools.compareVersions('invalid', 'invalid')).toBeNull();
        });
    });
});
