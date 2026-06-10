import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateSideViewLayout, getBlurLabel, normalizeSettings, simulate } from '../src/simulation.ts';

describe('背景ボケシミュレーション', () => {
  it('TC-001: 初期設定で背景がしっかりボケる', () => {
    const result = simulate({
      sensor: 'full-frame',
      focalLength: 50,
      aperture: 2.8,
      subjectDistance: 2,
      backgroundDistance: 5,
    });

    assert.ok(result.blurScore >= 51);
    assert.ok(result.blurScore <= 75);
    assert.equal(result.blurLabel, 'しっかりボケる');
    assert.ok(result.depthOfFieldNear > 0);
    assert.ok(result.depthOfFieldFar > result.depthOfFieldNear);
    assert.ok(result.depthOfFieldTotal > 0);
  });

  it('TC-002: F値を小さくすると背景ボケが大きくなる', () => {
    const brightLens = simulate({ aperture: 1.4 }).blurScore;
    const stoppedDown = simulate({ aperture: 8 }).blurScore;

    assert.ok(brightLens > stoppedDown);
  });

  it('TC-003: 焦点距離を長くすると背景ボケが大きくなる', () => {
    const wide = simulate({ focalLength: 28 }).blurScore;
    const telephoto = simulate({ focalLength: 85 }).blurScore;

    assert.ok(telephoto > wide);
  });

  it('TC-004: 被写体に近づくと背景ボケが大きくなる', () => {
    const closeSubject = simulate({ subjectDistance: 1 }).blurScore;
    const farSubject = simulate({ subjectDistance: 3 }).blurScore;

    assert.ok(closeSubject > farSubject);
  });

  it('TC-005: 背景が遠いほど背景ボケが大きくなる', () => {
    const closeBackground = simulate({ backgroundDistance: 1 }).blurScore;
    const farBackground = simulate({ backgroundDistance: 10 }).blurScore;

    assert.ok(farBackground > closeBackground);
  });

  it('TC-006: ボケ量スコアから日本語ラベルが決まる', () => {
    assert.equal(getBlurLabel(0), 'ほぼボケない');
    assert.equal(getBlurLabel(20), 'ほぼボケない');
    assert.equal(getBlurLabel(21), '少しボケる');
    assert.equal(getBlurLabel(50), '少しボケる');
    assert.equal(getBlurLabel(51), 'しっかりボケる');
    assert.equal(getBlurLabel(75), 'しっかりボケる');
    assert.equal(getBlurLabel(76), '大きくボケる');
    assert.equal(getBlurLabel(100), '大きくボケる');
  });

  it('TC-007: 入力値が範囲外の場合はMVPの許容範囲に丸める', () => {
    const normalized = normalizeSettings({
      sensor: 'unknown',
      focalLength: 500,
      aperture: 0.7,
      subjectDistance: 0.1,
      backgroundDistance: 100,
    });

    assert.equal(normalized.sensor, 'full-frame');
    assert.equal(normalized.focalLength, 300);
    assert.equal(normalized.aperture, 1.4);
    assert.equal(normalized.subjectDistance, 0.5);
    assert.equal(normalized.backgroundDistance, 30);
  });

  it('TC-010: 横方向イメージ図で人と木の距離と木のボケ量を確認できる', () => {
    const closeLayout = calculateSideViewLayout({ subjectDistance: 1, backgroundDistance: 2, aperture: 8 });
    const farLayout = calculateSideViewLayout({ subjectDistance: 4, backgroundDistance: 10, aperture: 1.4 });
    const result = simulate({ subjectDistance: 2, backgroundDistance: 8 });

    assert.ok(closeLayout.cameraPositionPercent < closeLayout.subjectPositionPercent);
    assert.ok(closeLayout.subjectPositionPercent < closeLayout.backgroundPositionPercent);
    assert.ok(farLayout.subjectPositionPercent > closeLayout.subjectPositionPercent);
    assert.ok(farLayout.backgroundPositionPercent > closeLayout.backgroundPositionPercent);
    assert.ok(farLayout.backgroundBlurPixels > closeLayout.backgroundBlurPixels);
    assert.equal(result.sideView.subjectDistanceLabel, '2.0m');
    assert.equal(result.sideView.backgroundDistanceLabel, '8.0m');
  });
});
