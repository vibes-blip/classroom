import test from 'node:test';
import assert from 'node:assert/strict';

test('server health endpoint is available', async () => {
  const response = await fetch('http://localhost:4000/api/health');
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
});
