import type { CameraSettings, CameraSettingsInput, SensorSize, SideViewLayout, SimulationResult } from './simulation-types';

const SENSOR_CONFIG: Record<SensorSize, {
  cropFactor: number;
  circleOfConfusionMm: number;
  sensorWidthMm: number;
}> = {
  'full-frame': {
    cropFactor: 1,
    circleOfConfusionMm: 0.03,
    sensorWidthMm: 36,
  },
  'aps-c': {
    cropFactor: 1.5,
    circleOfConfusionMm: 0.02,
    sensorWidthMm: 23.5,
  },
};

const DEFAULT_SETTINGS: CameraSettings = Object.freeze({
  sensor: 'full-frame',
  focalLength: 50,
  aperture: 2.8,
  subjectDistance: 2,
  backgroundDistance: 5,
});

const MAX_CSS_BLUR_PIXELS = 36;

const LIMITS = Object.freeze({
  focalLength: { min: 20, max: 300 },
  aperture: { min: 1.4, max: 16 },
  subjectDistance: { min: 0.5, max: 10 },
  backgroundDistance: { min: 1, max: 30 },
});

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeSettings(settings: CameraSettingsInput = {}): CameraSettings {
  const merged = { ...DEFAULT_SETTINGS, ...settings };
  const sensor: SensorSize = merged.sensor && merged.sensor in SENSOR_CONFIG ? (merged.sensor as SensorSize) : DEFAULT_SETTINGS.sensor;

  return {
    sensor,
    focalLength: clamp(Number(merged.focalLength), LIMITS.focalLength.min, LIMITS.focalLength.max),
    aperture: clamp(Number(merged.aperture), LIMITS.aperture.min, LIMITS.aperture.max),
    subjectDistance: clamp(Number(merged.subjectDistance), LIMITS.subjectDistance.min, LIMITS.subjectDistance.max),
    backgroundDistance: clamp(Number(merged.backgroundDistance), LIMITS.backgroundDistance.min, LIMITS.backgroundDistance.max),
  };
}

function getBlurLabel(score: number): string {
  if (score <= 20) return 'ほぼボケない';
  if (score <= 50) return '少しボケる';
  if (score <= 75) return 'しっかりボケる';
  return '大きくボケる';
}

function calculateBlurScore(settings: CameraSettingsInput): number {
  const normalized = normalizeSettings(settings);
  const sensorFactor = SENSOR_CONFIG[normalized.sensor].cropFactor === 1 ? 1 : 0.82;
  const apertureFactor = Math.sqrt(2.8 / normalized.aperture);
  const focalFactor = Math.sqrt(normalized.focalLength / 50);
  const subjectFactor = Math.sqrt(2 / normalized.subjectDistance);
  const backgroundSeparation = Math.max(0.1, normalized.backgroundDistance - normalized.subjectDistance);
  const backgroundFactor = Math.log1p(backgroundSeparation * 1.8) / Math.log1p(3 * 1.8);
  const rawScore = 62 * apertureFactor * focalFactor * subjectFactor * backgroundFactor * sensorFactor;

  return Math.round(clamp(rawScore, 0, 100));
}

function calculateDepthOfField(settings: CameraSettingsInput): Pick<SimulationResult, 'depthOfFieldNear' | 'depthOfFieldFar' | 'depthOfFieldTotal'> {
  const normalized = normalizeSettings(settings);
  const { circleOfConfusionMm } = SENSOR_CONFIG[normalized.sensor];
  const focalLengthMm = normalized.focalLength;
  const subjectDistanceMm = normalized.subjectDistance * 1000;
  const hyperfocalMm = (focalLengthMm ** 2) / (normalized.aperture * circleOfConfusionMm) + focalLengthMm;
  const nearMm = (hyperfocalMm * subjectDistanceMm) / (hyperfocalMm + (subjectDistanceMm - focalLengthMm));
  const farDenominator = hyperfocalMm - (subjectDistanceMm - focalLengthMm);
  const farMm = farDenominator <= 0
    ? Number.POSITIVE_INFINITY
    : (hyperfocalMm * subjectDistanceMm) / farDenominator;

  const near = nearMm / 1000;
  const far = farMm / 1000;
  const total = Number.isFinite(far) ? far - near : Number.POSITIVE_INFINITY;

  return {
    depthOfFieldNear: roundMetric(near),
    depthOfFieldFar: Number.isFinite(far) ? roundMetric(far) : Number.POSITIVE_INFINITY,
    depthOfFieldTotal: Number.isFinite(total) ? roundMetric(total) : Number.POSITIVE_INFINITY,
  };
}

function roundMetric(value: number): number {
  return Math.round(value * 100) / 100;
}

function calculateCssBlurPixels(score: number): number {
  const normalizedScore = clamp(score, 0, 100) / 100;

  return Math.round((normalizedScore ** 1.2) * MAX_CSS_BLUR_PIXELS);
}

function formatDistanceLabel(value: number): string {
  return `${value.toFixed(1)}m`;
}

function calculateSideViewLayout(settings: CameraSettingsInput, blurPixels?: number): SideViewLayout {
  const normalized = normalizeSettings(settings);
  const resolvedBlurPixels = blurPixels ?? calculateCssBlurPixels(calculateBlurScore(normalized));
  const cameraPositionPercent = 8;
  const subjectRatio = (normalized.subjectDistance - LIMITS.subjectDistance.min)
    / (LIMITS.subjectDistance.max - LIMITS.subjectDistance.min);
  const backgroundRatio = (normalized.backgroundDistance - LIMITS.backgroundDistance.min)
    / (LIMITS.backgroundDistance.max - LIMITS.backgroundDistance.min);
  const subjectPositionPercent = roundMetric(24 + subjectRatio * 34);
  const backgroundFromDistance = 38 + backgroundRatio * 52;
  const backgroundPositionPercent = roundMetric(clamp(backgroundFromDistance, subjectPositionPercent + 8, 90));

  return {
    cameraPositionPercent,
    subjectPositionPercent,
    backgroundPositionPercent,
    subjectDistanceLabel: formatDistanceLabel(normalized.subjectDistance),
    backgroundDistanceLabel: formatDistanceLabel(normalized.backgroundDistance),
    backgroundBlurPixels: Math.round(resolvedBlurPixels),
    backgroundBlurPercent: Math.round((resolvedBlurPixels / MAX_CSS_BLUR_PIXELS) * 100),
  };
}

function calculateAngleOfView(settings: CameraSettingsInput): number {
  const normalized = normalizeSettings(settings);
  const { sensorWidthMm } = SENSOR_CONFIG[normalized.sensor];
  const radians = 2 * Math.atan(sensorWidthMm / (2 * normalized.focalLength));

  return roundMetric(radians * (180 / Math.PI));
}

function simulate(settings: CameraSettingsInput = {}): SimulationResult {
  const normalized = normalizeSettings(settings);
  const blurScore = calculateBlurScore(normalized);
  const depthOfField = calculateDepthOfField(normalized);

  const cssBlurPixels = calculateCssBlurPixels(blurScore);

  return {
    settings: normalized,
    ...depthOfField,
    blurScore,
    blurLabel: getBlurLabel(blurScore),
    cssBlurPixels,
    angleOfViewDegrees: calculateAngleOfView(normalized),
    sideView: calculateSideViewLayout(normalized, cssBlurPixels),
  };
}

export {
  DEFAULT_SETTINGS,
  LIMITS,
  calculateAngleOfView,
  calculateBlurScore,
  calculateDepthOfField,
  calculateCssBlurPixels,
  calculateSideViewLayout,
  getBlurLabel,
  normalizeSettings,
  simulate,
};
