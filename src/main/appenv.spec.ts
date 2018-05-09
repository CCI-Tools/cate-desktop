import {expect} from 'chai';
import * as semver from "semver";
import {CATE_WEBAPI_VERSION_RANGE} from "./appenv";

describe('appenv', function () {

    it('has a SemVer-compatible CATE_WEBAPI_VERSION_RANGE', function () {
        const range = semver.validRange(CATE_WEBAPI_VERSION_RANGE);
        //console.log("CATE_WEBAPI_VERSION_RANGE =", range);
        expect(range).to.not.be.null;
        expect(range).to.equal(CATE_WEBAPI_VERSION_RANGE);
    });
});
