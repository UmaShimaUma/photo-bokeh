import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const tsconfig = JSON.parse(readFileSync(new URL('../tsconfig.json', import.meta.url), 'utf8'));
const pageSource = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');

describe('Next.js / TypeScript 構成', () => {
  it('TC-009: Next.js と TypeScript でVercel向けに起動できる構成にする', () => {
    for (const dependency of ['next', 'react', 'react-dom']) {
      assert.ok(packageJson.dependencies[dependency], `${dependency} が dependencies に必要です`);
    }

    assert.ok(packageJson.devDependencies.typescript, 'typescript が devDependencies に必要です');

    for (const script of ['dev', 'build', 'start', 'typecheck', 'test']) {
      assert.ok(packageJson.scripts[script], `${script} スクリプトが必要です`);
    }

    assert.equal(tsconfig.compilerOptions.strict, true);
    assert.ok(existsSync(new URL('../next.config.ts', import.meta.url)));
    assert.ok(existsSync(new URL('../app/page.tsx', import.meta.url)));
  });

  it('TC-010: 横方向イメージ図の日本語UIを表示する', () => {
    assert.match(pageSource, /横から見た距離イメージ/);
    assert.match(pageSource, /カメラ/);
    assert.match(pageSource, /人/);
    assert.match(pageSource, /木/);
    assert.match(pageSource, /人まで/);
    assert.match(pageSource, /木まで/);
  });
});
