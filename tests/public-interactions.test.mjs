import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const script = await readFile(new URL('../scripts/public-interactions.js', import.meta.url), 'utf8');
function fixture({ email = 'sky@example.com', company = '', response = { ok: true, json: async () => ({ message: 'Saved successfully.' }) } } = {}) {
  const events = {};
  const toggle = { attrs: { 'aria-expanded': 'false' }, setAttribute(key, value) { this.attrs[key] = value; }, getAttribute(key) { return this.attrs[key]; }, addEventListener(type, fn) { events['toggle:' + type] = fn; }, focus() { this.focused = true; } };
  const menu = { classList: { toggle(name, open) { menu.open = open; } }, addEventListener(type, fn) { events['menu:' + type] = fn; } };
  const status = {};
  const button = { disabled: false, textContent: 'Join the waitlist' };
  const form = { querySelector: () => button, addEventListener(type, fn) { events['form:' + type] = fn; }, reset() { this.didReset = true; } };
  const calls = [];
  const document = { querySelector(selector) { return ({ '.menu-toggle': toggle, '#primary-menu': menu, '.waitlist-form': form, '#waitlist-status': status })[selector]; }, addEventListener(type, fn) { events['document:' + type] = fn; } };
  vm.runInNewContext(script, { document, FormData: class { get(key) { return ({ email, company })[key]; } }, fetch: async (...args) => { calls.push(args); return response; }, Error });
  return { events, toggle, menu, status, button, form, calls };
}
const submitEvent = { preventDefault() {} };
test('menu toggles, closes on links and Escape, and restores keyboard focus', () => {
  const f = fixture();
  f.events['toggle:click']();
  assert.equal(f.toggle.attrs['aria-expanded'], 'true');
  assert.equal(f.menu.open, true);
  f.events['document:keydown']({ key: 'Escape' });
  assert.equal(f.menu.open, false);
  assert.equal(f.toggle.focused, true);
  f.events['toggle:click']();
  f.events['menu:click']({ target: { closest: () => ({}) } });
  assert.equal(f.toggle.attrs['aria-expanded'], 'false');
});
test('invalid addresses and honeypot submissions make no network calls', async () => {
  for (const options of [{ email: 'invalid' }, { company: 'bot' }]) {
    const f = fixture(options);
    await f.events['form:submit'](submitEvent);
    assert.equal(f.calls.length, 0);
  }
});
test('waitlist makes exactly one request and shows success', async () => {
  const f = fixture();
  const pending = f.events['form:submit'](submitEvent);
  await f.events['form:submit'](submitEvent);
  await pending;
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0][0], '/api/waitlist');
  assert.deepEqual(JSON.parse(f.calls[0][1].body), { email: 'sky@example.com', source: 'pantrii' });
  assert.equal(f.status.textContent, 'Saved successfully.');
  assert.equal(f.form.didReset, true);
  assert.equal(f.button.disabled, false);
});
test('waitlist errors preserve the form and allow retry', async () => {
  const f = fixture({ response: { ok: false, json: async () => ({ error: 'Please try again.' }) } });
  await f.events['form:submit'](submitEvent);
  assert.equal(f.status.className, 'form-status error');
  assert.equal(f.status.textContent, 'Please try again.');
  assert.equal(f.form.didReset, undefined);
  assert.equal(f.button.disabled, false);
});
