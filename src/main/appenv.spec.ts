import { expect } from 'chai';
import * as semver from 'semver';
import { CATE_WEBAPI_VERSION_RANGE, getProxySettings, getSessionProxyConfig } from './appenv';

describe('appenv', function () {

    it('has a SemVer-compatible CATE_WEBAPI_VERSION_RANGE', function () {
        const range = semver.validRange(CATE_WEBAPI_VERSION_RANGE);
        //console.log("CATE_WEBAPI_VERSION_RANGE =", range);
        expect(range).to.not.be.null;
        expect(range).to.equal(CATE_WEBAPI_VERSION_RANGE);
    });

    it('implements getProxySettings() correctly', function () {
        expect(getProxySettings({})).to.be.null;

        expect(getProxySettings({http_proxy: 'http://ofsquid.dwd.de:8080'})).to.deep.equal(
            {
                proxyServer: 'http://ofsquid.dwd.de:8080',
                proxyBypassList: '<local>;dev.virtualearth.net'
            });
        expect(getProxySettings({HTTP_PROXY: 'http://ofsquid.dwd.de:8080'})).to.deep.equal(
            {
                proxyServer: 'http://ofsquid.dwd.de:8080',
                proxyBypassList: '<local>;dev.virtualearth.net'
            });
        expect(getProxySettings({
                                    HTTP_PROXY: 'http://ofsquid.dwd.de:8080',
                                    no_proxy: 'www.google.de'
                                })).to.deep.equal(
            {
                proxyServer: 'http://ofsquid.dwd.de:8080',
                proxyBypassList: '<local>;dev.virtualearth.net;www.google.de'
            });
        expect(getProxySettings({
                                    socks_proxy: 'ws:ws.bc.com',
                                    HTTP_PROXY: 'http://ofsquid.dwd.de:8080',
                                    no_proxy: '127.0.0.1, dwd.de, localhost'
                                })).to.deep.equal(
            {
                proxyServer: 'http://ofsquid.dwd.de:8080',
                proxyBypassList: '<local>;dev.virtualearth.net;dwd.de'
            });
    });

    it('implements getSessionProxyConfig() correctly', function () {
        expect(getSessionProxyConfig({})).to.be.null;
        expect(getSessionProxyConfig({http_proxy: 'http://ofsquid.dwd.de:8080'})).to.deep.equal(
            {
                pacScript: '',
                proxyRules: 'http://ofsquid.dwd.de:8080',
                proxyBypassRules: '<local>;dev.virtualearth.net'
            });
        expect(getSessionProxyConfig({HTTP_PROXY: 'http://ofsquid.dwd.de:8080'})).to.deep.equal(
            {
                pacScript: '',
                proxyRules: 'http://ofsquid.dwd.de:8080',
                proxyBypassRules: '<local>;dev.virtualearth.net'
            });
        expect(getSessionProxyConfig({
                                         HTTP_PROXY: 'http://ofsquid.dwd.de:8080',
                                         no_proxy: 'www.google.de'
                                     })).to.deep.equal(
            {
                pacScript: '',
                proxyRules: 'http://ofsquid.dwd.de:8080',
                proxyBypassRules: '<local>;dev.virtualearth.net;www.google.de'
            });
        expect(getSessionProxyConfig({
                                         socks_proxy: 'ws:ws.bc.com',
                                         https_proxy: 'https://ofsquid.dwd.de:80',
                                         HTTP_PROXY: 'http://ofsquid.dwd.de:8080',
                                         no_proxy: '127.0.0.1, dwd.de, localhost',
                                         NO_PROXY: '*.foogle.com'
                                     })).to.deep.equal(
            {
                pacScript: '',
                proxyRules: 'http://ofsquid.dwd.de:8080;https://ofsquid.dwd.de:80;ws:ws.bc.com',
                proxyBypassRules: '<local>;dev.virtualearth.net;dwd.de;*.foogle.com'
            });
    });
});
