import {expect} from 'chai';
import * as semver from "semver";
import {APP_CLI_VERSION_RANGE} from "./appenv";

describe('appenv', function () {

    it('has a SemVer-compatible APP_CLI_VERSION_RANGE', function () {
        const range = semver.validRange(APP_CLI_VERSION_RANGE);
        //console.log("APP_CLI_VERSION_RANGE =", range);
        expect(range).to.not.be.null;
        expect(range).to.equal(APP_CLI_VERSION_RANGE);
    });
});
