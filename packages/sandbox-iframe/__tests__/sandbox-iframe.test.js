'use strict';

const sandboxIframe = require('..');
const assert = require('assert').strict;

assert.strictEqual(sandboxIframe(), 'Hello from sandboxIframe');
console.info("sandboxIframe tests passed");
