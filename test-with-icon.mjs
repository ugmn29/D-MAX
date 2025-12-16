import { createCanvas } from 'canvas';
import fs from 'fs';

const width = 2500;
const height = 843;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// 背景
ctx.fillStyle = '#F3F4F6';
ctx.fillRect(0, 0, width, height);

// ボタン設定
const gap = 8;
const cellWidth = Math.floor((width - gap * 4) / 3);
const cellHeight = cellWidth;
const startY = Math.floor((height - cellHeight) / 2);

const x1 = gap;
const y1 = startY;

// ボタン背景
const gradient = ctx.createLinearGradient(x1, y1, x1 + cellWidth, y1 + cellHeight);
gradient.addColorStop(0, '#EFF6FF');
gradient.addColorStop(1, '#DBEAFE');
ctx.fillStyle = gradient;
ctx.fillRect(x1, y1, cellWidth, cellHeight);

// 枠線
ctx.strokeStyle = '#93C5FD';
ctx.lineWidth = 3;
ctx.strokeRect(x1, y1, cellWidth, cellHeight);

// アイコンとテキスト（実際のコードと同じロジック）
const centerX = x1 + cellWidth / 2;
const centerY = y1 + cellHeight / 2;

const scale = cellHeight / 90;
const iconSize = 32 * scale * 1.5;
const gapSize = 6 * scale * 1.5;
const fontSize = 11 * scale * 4;

console.log('cellHeight:', cellHeight);
console.log('scale:', scale);
console.log('iconSize:', iconSize);
console.log('gap:', gapSize);
console.log('fontSize:', fontSize);

// レイアウト計算
const textHeight = fontSize * 1.2;
const totalHeight = iconSize + gapSize + textHeight;
const layoutStartY = centerY - totalHeight / 2;

console.log('textHeight:', textHeight);
console.log('totalHeight:', totalHeight);
console.log('layoutStartY:', layoutStartY);
console.log('centerY:', centerY);

// アイコン（簡単な円で代用）
const iconY = layoutStartY + iconSize / 2;
ctx.fillStyle = '#1F2937';
ctx.beginPath();
ctx.arc(centerX, iconY, iconSize / 2, 0, Math.PI * 2);
ctx.fill();

console.log('icon Y:', iconY);

// テキスト
const textY = layoutStartY + iconSize + gapSize;
ctx.fillStyle = '#1F2937';
ctx.font = `bold ${fontSize}px sans-serif`;
ctx.textAlign = 'center';
ctx.textBaseline = 'top';
ctx.fillText('初回登録', centerX, textY);

console.log('text Y:', textY);
console.log('text bottom:', textY + textHeight);
console.log('button bottom:', y1 + cellHeight);

// デバッグライン
ctx.strokeStyle = 'red';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(x1, centerY);
ctx.lineTo(x1 + cellWidth, centerY);
ctx.stroke();

// 画像保存
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./test-with-icon.png', buffer);
console.log('✅ 保存: ./test-with-icon.png');
