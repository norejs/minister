/**
 * @jest-environment jsdom
 */

test('use jsdom in this test file', () => {
    const sandboxIframe = require('..');
    const sandbox = new sandboxIframe();
    expect(sandbox).toBeInstanceOf(sandboxIframe);
});
