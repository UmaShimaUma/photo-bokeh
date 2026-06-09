export type SensorSize = 'full-frame' | 'aps-c';

export type CameraSettings = {
  sensor: SensorSize;
  focalLength: number;
  aperture: number;
  subjectDistance: number;
  backgroundDistance: number;
};

export type CameraSettingsInput = Partial<Omit<CameraSettings, 'sensor'> & { sensor: SensorSize | string }>;

export type SimulationResult = {
  settings: CameraSettings;
  depthOfFieldNear: number;
  depthOfFieldFar: number;
  depthOfFieldTotal: number;
  blurScore: number;
  blurLabel: string;
  cssBlurPixels: number;
  angleOfViewDegrees: number;
};
