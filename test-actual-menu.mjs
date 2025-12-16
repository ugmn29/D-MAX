import { createCanvas } from 'canvas';
import fs from 'fs';

// 実際のリッチメニューと同じサイズと構造でテスト
const width = 2500;
const height = 843;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// 背景
const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
bgGradient.addColorStop(0, '#F3F4F6');
bgGradient.addColorStop(1, '#F9FAFB');
ctx.fillStyle = bgGradient;
ctx.fillRect(0, 0, width, height);

// ボタン設定（実際のコードと同じ）
const gap = 8;
const cellWidth = Math.floor((width - gap * 4) / 3);
const cellHeight = cellWidth;
const startY = Math.floor((height - cellHeight) / 2);

console.log('ボタンサイズ:', cellWidth, 'x', cellHeight);
console.log('開始Y位置:', startY);

// ボタン1: 初回登録
const x1 = gap;
const y1 = startY;

// グラデーション
const gradient1 = ctx.createLinearGradient(x1, y1, x1 + cellWidth, y1 + cellHeight);
gradient1.addColorStop(0, '#EFF6FF');
gradient1.addColorStop(1, '#DBEAFE');
ctx.fillStyle = gradient1;
ctx.fillRect(x1, y1, cellWidth, cellHeight);

// 枠線
ctx.strokeStyle = '#93C5FD';
ctx.lineWidth = 3;
ctx.strokeRect(x1, y1, cellWidth, cellHeight);

// テキスト描画（実際のコードと同じ計算）
const centerX = x1 + cellWidth / 2;
const centerY = y1 + cellHeight / 2;

const scale = cellHeight / 90;
const fontSize = 11 * scale * 4;

console.log('Scale:', scale);
console.log('Font size:', fontSize);

ctx.fillStyle = '#1F2937';
ctx.font = `bold ${fontSize}px sans-serif`;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

const label = '初回登録';
ctx.fillText(label, centerX, centerY);

console.log(`テキスト "${label}" を (${centerX}, ${centerY}) に描画`);

// 画像を保存
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./test-actual-menu.png', buffer);
console.log('✅ テスト画像を保存: ./test-actual-menu.png');

// ファイルサイズ確認
const stats = fs.statSync('./test-actual-menu.png');
console.log('ファイルサイズ:', Math.round(stats.size / 1024), 'KB');
