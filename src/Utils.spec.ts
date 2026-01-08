import Utils from 'src/Utils';

describe('Utils.formatVersion', () => {
    it('should format version strings correctly', () => {
        expect(Utils.formatVersion('1')).toBe('1.0.0');
        expect(Utils.formatVersion('1.0')).toBe('1.0.0');
        expect(Utils.formatVersion('1.0.0')).toBe('1.0.0');
        expect(Utils.formatVersion('1.0.0.0')).toBe('1.0.0.0');
    });

    it('should return "invalid-version" for invalid version strings', () => {
        expect(Utils.formatVersion('1.a')).toBe('invalid-version');
        expect(Utils.formatVersion('version1')).toBe('invalid-version');
        expect(Utils.formatVersion('1.0.beta')).toBe('invalid-version');
    });
});

describe('Utils.categorizeVersionDifference', () => {
    it('should return "major" for major version difference', () => {
        expect(Utils.categorizeVersionDifference('1.0.0', '2.0.0')).toBe('major');
    });

    it('should return "minor" for minor version difference', () => {
        expect(Utils.categorizeVersionDifference('1.0.0', '1.1.0')).toBe('minor');
    });

    it('should return "patch" for patch version difference', () => {
        expect(Utils.categorizeVersionDifference('1.0.0', '1.0.1')).toBe('patch');
    });

    it('should return "same" for same version', () => {
        expect(Utils.categorizeVersionDifference('1.0.0', '1.0.0')).toBe('same');
    });

    it('should return "igl" for installed version greater than latest', () => {
        expect(Utils.categorizeVersionDifference('2.0.0', '1.0.0')).toBe('igl');
    });

    it('should return "invalid" for invalid version formats', () => {
        expect(Utils.categorizeVersionDifference('invalid', '1.0.0')).toBe('invalid');
        expect(Utils.categorizeVersionDifference('1.0.0', 'invalid')).toBe('invalid');
        expect(Utils.categorizeVersionDifference('invalid', 'invalid')).toBe('invalid');
    });
});
