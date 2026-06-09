import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const agentsMd = readFileSync(new URL('../AGENTS.md', import.meta.url), 'utf8');

describe('リポジトリ文書の内容検査', () => {
  it('TC-008: AGENTS.md にアプリと無関係な情報を含めない', () => {
    assert.ok(!agentsMd.includes('pic_location'));
    assert.ok(!agentsMd.includes('淡路島'));
    assert.match(agentsMd, /関係しない.*記載しない/);
  });
});
