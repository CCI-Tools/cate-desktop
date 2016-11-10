import * as React from 'react';
import {getRandomGreeting} from './app';
import assert = require("assert");

describe('app', function () {
    it('#getRandomGreeting', function () {
        assert.ok(getRandomGreeting());
        assert.ok(getRandomGreeting());
        assert.ok(getRandomGreeting());
    });
});
