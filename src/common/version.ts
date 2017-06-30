/**
 * Converts a version string from Python PEP-440 format (https://www.python.org/dev/peps/pep-0440/)
 * into a Semantic Version string (http://semver.org/).
 *
 * @param pep440 Python PEP-440 version string
 * @returns {string} Semantic Version string
 */
export function pep440ToSemver(pep440: string): string {
    let semver = '';
    let preReleaseSeen = false;
    let wasDigit = false;
    let lastChar = null;
    for (let i = 0; i < pep440.length; i++) {
        if (pep440.startsWith(".dev", i)) {
            if (preReleaseSeen) {
                semver += '.dev';
            } else {
                semver += '-dev';
            }
            preReleaseSeen = true;
            wasDigit = false;
            lastChar = 'v';
            i += 3;
            continue;
        }
        let currChar = pep440[i];
        let isAlpha = currChar >= "a" && currChar <= "z" || currChar >= "A" && currChar <= "Z";
        let isDigit = currChar >= "0" && currChar <= "9";
        if (!preReleaseSeen) {
            if (isAlpha) {
                semver += '-';
                preReleaseSeen = true;
            }
        } else {
            if (isDigit && !wasDigit && lastChar !== '.') {
                semver += '.';
            }
        }
        wasDigit = isDigit;
        lastChar = currChar;
        semver += currChar;
    }
    return semver;
}
