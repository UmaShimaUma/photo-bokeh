# 背景ボケシミュレーター仕様

## アプリの目的

「カメラ設定を変えると、正面から見た写真の背景ボケがどう変わるか」を直感的に見せるシミュレーターを作ります。対象はカメラ初心者からレンズ選び中の人で、数値の厳密さよりも写真としての見え方を重視します。

## MVP入力項目

| 入力 | 初期値 | 範囲・説明 |
| --- | --- | --- |
| カメラ | フルサイズ | a7C II想定 |
| 焦点距離 | 50mm | 20〜300mm |
| F値 | F2.8 | F1.4〜F16 |
| 被写体距離 | 2m | カメラから人物まで。MVP範囲は0.5〜10m |
| 背景距離 | 5m | 人物から背景まで。MVP範囲は1〜30m |
| センサーサイズ | フルサイズ | APS-C は将来拡張を想定しつつ計算モデルに含める |

## MVP表示項目

- 写真風プレビュー
  - 被写体は常にピントが合っている状態で表示します。
  - 背景は F値、焦点距離、被写体距離、背景距離、センサーサイズに応じてぼかします。
  - 画角は焦点距離で変化させます。
- ボケ量インジケーター
  - 0〜20: ほぼボケない
  - 21〜50: 少しボケる
  - 51〜75: しっかりボケる
  - 76〜100: 大きくボケる
- 被写界深度
  - ピント範囲の手前、奥、範囲を表示します。

## MVP機能優先度

| 優先度 | 機能 |
| --- | --- |
| 高 | F値スライダー |
| 高 | 背景ボケのリアルタイム変化 |
| 高 | 焦点距離スライダー |
| 高 | 被写体距離・背景距離スライダー |
| 高 | ボケ量スコア |
| 中 | F値比較モード |
| 中 | レンズプリセット |
| 低 | 作例画像アップロード |
| 低 | SNS共有 |

## 計算方針

MVPでは、厳密な物理計算よりも「設定を変えたときに、写真としての変化が直感的に伝わること」を優先します。背景ボケは以下の傾向を満たすようにスコア化します。

| 条件 | 背景ボケ |
| --- | --- |
| F値が小さい | 大きくなる |
| 焦点距離が長い | 大きくなる |
| 被写体に近い | 大きくなる |
| 背景が遠い | 大きくなる |
| センサーが大きい | 大きくなりやすい |

## 技術仕様

| 項目 | 技術 |
| --- | --- |
| フロント | Next.js / React / TypeScript |
| デプロイ | Vercel |
| 状態管理 | MVPでは `useState` / `useMemo` |
| 描画 | CSSによる写真風レイヤー表現。将来 Canvas / SVG / WebGL に拡張可能 |
| テスト | Node.js標準テストランナー + TypeScriptテスト用ローダー |

## データ構造

```ts
type CameraSettings = {
  sensor: "full-frame" | "aps-c";
  focalLength: number;
  aperture: number;
  subjectDistance: number;
  backgroundDistance: number;
};

type CameraSettingsInput = Partial<Omit<CameraSettings, "sensor"> & { sensor: CameraSettings["sensor"] | string }>;

type SimulationResult = {
  settings: CameraSettings;
  depthOfFieldNear: number;
  depthOfFieldFar: number;
  depthOfFieldTotal: number;
  blurScore: number;
  blurLabel: string;
  cssBlurPixels: number;
  angleOfViewDegrees: number;
};
```

## 開発順

1. UIだけ作る。
2. F値で CSS blur を変える。
3. 焦点距離・距離も反映する。
4. 被写界深度計算を追加する。
5. 比較モードを追加する。
6. レンズプリセットを追加する。
