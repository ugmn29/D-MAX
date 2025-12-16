import { createCanvas } from 'canvas';
import fs from 'fs';

// リッチメニューの標準サイズ
const width = 2500;
const height = 1686;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// 背景
const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
bgGradient.addColorStop(0, '#F3F4F6');
bgGradient.addColorStop(1, '#F9FAFB');
ctx.fillStyle = bgGradient;
ctx.fillRect(0, 0, width, height);

// 未連携メニューを描画
const gap = 8;
const cellWidth = Math.floor((width - gap * 4) / 3);
const cellHeight = height - gap * 2;

// ボタン1: 初回登録
const x1 = gap;
const y1 = gap;

// グラデーション背景
const gradient1 = ctx.createLinearGradient(x1, y1, x1 + cellWidth, y1 + cellHeight);
gradient1.addColorStop(0, '#EFF6FF');
gradient1.addColorStop(1, '#DBEAFE');
ctx.fillStyle = gradient1;
ctx.fillRect(x1, y1, cellWidth, cellHeight);

// 枠線
ctx.strokeStyle = '#93C5FD';
ctx.lineWidth = 3;
ctx.strokeRect(x1, y1, cellWidth, cellHeight);

// テキスト
ctx.fillStyle = '#1F2937';
const fontSize = 120;
ctx.font = `bold ${fontSize}px sans-serif`;
ctx.textAlign = 'center';
ctx.textBaseline = 'bottom';
ctx.fillText('初回登録', x1 + cellWidth / 2, y1 + cellHeight - 50);

console.log('✅ テスト画像生成完了');
console.log('サイズ:', width, 'x', height);
console.log('フォント:', `bold ${fontSize}px sans-serif`);
console.log('ボタンサイズ:', cellWidth, 'x', cellHeight);

// 画像を保存
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./test-rich-menu-local.png', buffer);
console.log('✅ 画像を保存: ./test-rich-menu-local.png');
