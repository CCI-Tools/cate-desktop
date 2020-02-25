import { pep440ToSemver } from './version'
import { satisfies } from 'semver'

import { expect } from 'chai';

describe('Version-related utilities', function () {

    it('can convert from PEP-440 to semver', function () {
        expect(pep440ToSemver('1')).to.equal('1');
        expect(pep440ToSemver('1.6')).to.equal('1.6');
        expect(pep440ToSemver('1.6.43')).to.equal('1.6.43');

        expect(pep440ToSemver('1.0.0')).to.equal('1.0.0');

        expect(pep440ToSemver('1.6.2a11')).to.equal('1.6.2-a.11');
        expect(pep440ToSemver('0.9.0.dev1')).to.equal('0.9.0-dev.1');
        expect(pep440ToSemver('1.6.12.dev21')).to.equal('1.6.12-dev.21');
        expect(pep440ToSemver('1.6.2a11.dev104')).to.equal('1.6.2-a.11.dev.104');
        expect(pep440ToSemver('1.6.2rc2')).to.equal('1.6.2-rc.2');
        expect(pep440ToSemver('1.6.2rc2.dev5')).to.equal('1.6.2-rc.2.dev.5');

        expect(pep440ToSemver('2.1.0.dev0')).to.equal('2.1.0-dev.0');
    });

    it('uses semver correctly', function () {
        let requiredVersion = '>=0.8.0-rc.3 <0.9';
        expect(satisfies('0.8.0-rc.3', requiredVersion)).to.be.true;
        expect(satisfies('0.8.0-rc.4', requiredVersion)).to.be.true;
        expect(satisfies('0.8.0-rc.4.dev.2', requiredVersion)).to.be.true;
        expect(satisfies('0.8.0', requiredVersion)).to.be.true;
        expect(satisfies('0.8.1', requiredVersion)).to.be.true;
        expect(satisfies('0.8.24', requiredVersion)).to.be.true;

        requiredVersion = '1.0.x';
        expect(satisfies('0.9.9', requiredVersion)).to.be.false;
        expect(satisfies('1.0.0-dev.3', requiredVersion)).to.be.false;
        expect(satisfies('1.0.0', requiredVersion)).to.be.true;
        expect(satisfies('1.0.1', requiredVersion)).to.be.true;
        expect(satisfies('1.0.21', requiredVersion)).to.be.true;
        expect(satisfies('1.0.1-dev.2', requiredVersion)).to.be.false;
        expect(satisfies('1.1.0', requiredVersion)).to.be.false;

        expect(satisfies('0.9.0-dev.1', '0.9.0-dev.1')).to.be.true;

        // out of range
        expect(satisfies('0.8.0-rc.2', requiredVersion)).to.be.false;
        // pre-releases allowed only within exact version by major.minor.patch (=0.8.0)
        expect(satisfies('0.8.1-rc.1', requiredVersion)).to.be.false;
        // out of range
        expect(satisfies('0.9.0', requiredVersion)).to.be.false;
        expect(satisfies('0.9.0-dev.1', requiredVersion)).to.be.false;

        requiredVersion = '>=2.1.0-dev.0 <=2.1.0';
        expect(satisfies('2.1.0-dev.0', requiredVersion)).to.be.true;
        expect(satisfies('2.0.0', requiredVersion)).to.be.false;
        expect(satisfies('2.2.0-dev.1', requiredVersion)).to.be.false;
        expect(satisfies('2.2.2', requiredVersion)).to.be.false;
    });
});


