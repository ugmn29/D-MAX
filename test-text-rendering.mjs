import { createCanvas } from 'canvas';
import fs from 'fs';

// テスト用の簡単な画像生成
const width = 2500;
const height = 843;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// 背景
ctx.fillStyle = '#F3F4F6';
ctx.fillRect(0, 0, width, height);

// 1つのボタンをテスト
const buttonWidth = 800;
const buttonHeight = 800;
const x = 50;
const y = 20;

// ボタン背景
ctx.fillStyle = '#EFF6FF';
ctx.fillRect(x, y, buttonWidth, buttonHeight);

// 枠線
ctx.strokeStyle = '#93C5FD';
ctx.lineWidth = 3;
ctx.strokeRect(x, y, buttonWidth, buttonHeight);

// テキスト描画テスト - 複数のフォントサイズで試す
const centerX = x + buttonWidth / 2;
const testSizes = [100, 200, 300, 400, 500];

testSizes.forEach((size, index) => {
  const textY = y + 100 + (index * 150);

  // フォント設定
  ctx.fillStyle = '#1F2937';
  ctx.font = `bold ${size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // テキスト描画
  const text = `${size}px: 初回登録`;
  ctx.fillText(text, centerX, textY);

  console.log(`✅ テキスト描画: ${text} at (${centerX}, ${textY})`);
});

// 画像を保存
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./test-text-rendering.png', buffer);
console.log('✅ テスト画像を保存: ./test-text-rendering.png');
console.log('画像サイズ:', width, 'x', height);
console.log('ボタンサイズ:', buttonWidth, 'x', buttonHeight);
