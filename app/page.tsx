'use client';

import { useMemo, useState } from 'react';
import { DEFAULT_SETTINGS, LIMITS, simulate } from '../src/simulation';
import type { CameraSettings, SensorSize } from '../src/simulation-types';

type SliderDefinition = {
  key: keyof Pick<CameraSettings, 'focalLength' | 'aperture' | 'subjectDistance' | 'backgroundDistance'>;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
};

const sliders: SliderDefinition[] = [
  { key: 'aperture', label: 'F値', min: LIMITS.aperture.min, max: LIMITS.aperture.max, step: 0.1, unit: '' },
  { key: 'focalLength', label: '焦点距離', min: LIMITS.focalLength.min, max: LIMITS.focalLength.max, step: 1, unit: 'mm' },
  { key: 'subjectDistance', label: '被写体距離', min: LIMITS.subjectDistance.min, max: LIMITS.subjectDistance.max, step: 0.1, unit: 'm' },
  { key: 'backgroundDistance', label: '背景距離', min: LIMITS.backgroundDistance.min, max: LIMITS.backgroundDistance.max, step: 0.1, unit: 'm' },
];

function formatValue(key: SliderDefinition['key'], value: number, unit: string): string {
  if (key === 'aperture') return `F${value.toFixed(1)}`;
  if (unit === 'm') return `${value.toFixed(1)}${unit}`;

  return `${Math.round(value)}${unit}`;
}

function formatDepth(value: number): string {
  if (!Number.isFinite(value)) return '∞';

  return `${value.toFixed(2)}m`;
}

export default function SimulatorPage() {
  const [settings, setSettings] = useState<CameraSettings>({ ...DEFAULT_SETTINGS, sensor: DEFAULT_SETTINGS.sensor as SensorSize });
  const result = useMemo(() => simulate(settings), [settings]);
  const previewScale = Math.min(1.28, Math.max(1, settings.focalLength / 85));

  function updateSetting<K extends keyof CameraSettings>(key: K, value: CameraSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Photo Bokeh Simulator</p>
          <h1>カメラ設定で背景ボケがどう変わるかを写真風に確認</h1>
          <p className="lead">
            F値・焦点距離・被写体距離・背景距離を動かすと、背景のぼけ量とピント範囲がリアルタイムに変わります。
          </p>
        </div>
        <div className="sensor-toggle" aria-label="センサーサイズ">
          {(['full-frame', 'aps-c'] satisfies SensorSize[]).map((sensor) => (
            <button
              className={settings.sensor === sensor ? 'active' : ''}
              key={sensor}
              onClick={() => updateSetting('sensor', sensor)}
              type="button"
            >
              {sensor === 'full-frame' ? 'フルサイズ' : 'APS-C'}
            </button>
          ))}
        </div>
      </section>

      <section className="simulator-grid">
        <div className="preview-card" aria-label="写真風プレビュー">
          <div className="photo-preview">
            <div
              className="background-layer"
              style={{ filter: `blur(${result.cssBlurPixels}px)`, transform: `scale(${1.08 * previewScale})` }}
            />
            <div className="depth-lines" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="subject-layer">
              <div className="person-head" />
              <div className="person-body" />
            </div>
          </div>
          <p className="preview-caption">
            被写体はくっきり、背景は {result.blurLabel}。焦点距離が長いほど画角は狭く見えます。
          </p>
        </div>

        <div className="controls-card">
          {sliders.map((slider) => (
            <label className="slider-row" key={slider.key}>
              <span className="slider-label">
                {slider.label}
                <strong>{formatValue(slider.key, settings[slider.key], slider.unit)}</strong>
              </span>
              <input
                max={slider.max}
                min={slider.min}
                onChange={(event) => updateSetting(slider.key, Number(event.target.value))}
                step={slider.step}
                type="range"
                value={settings[slider.key]}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="result-grid">
        <article className="result-card highlight">
          <p>背景ボケ</p>
          <h2>{result.blurLabel}</h2>
          <div className="score-line">
            <span>{'★'.repeat(Math.ceil(result.blurScore / 20)).padEnd(5, '☆')}</span>
            <strong>{result.blurScore} / 100</strong>
          </div>
        </article>
        <article className="result-card">
          <p>ピント範囲</p>
          <dl>
            <div><dt>手前</dt><dd>{formatDepth(result.depthOfFieldNear)}</dd></div>
            <div><dt>奥</dt><dd>{formatDepth(result.depthOfFieldFar)}</dd></div>
            <div><dt>範囲</dt><dd>{formatDepth(result.depthOfFieldTotal)}</dd></div>
          </dl>
        </article>
        <article className="result-card">
          <p>画角の目安</p>
          <h2>{result.angleOfViewDegrees.toFixed(1)}°</h2>
          <span className="hint">望遠側ほど背景が近く、大きく見える印象になります。</span>
        </article>
      </section>
    </main>
  );
}
