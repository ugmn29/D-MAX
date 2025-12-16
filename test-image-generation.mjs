import { createCanvas } from 'canvas';
import fs from 'fs';

console.log('🎨 リッチメニュー画像生成テスト\n');

// キャンバスを作成（リッチメニューの標準サイズ）
const width = 2500;
const height = 1686;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// 背景色
ctx.fillStyle = '#FFFFFF';
ctx.fillRect(0, 0, width, height);

const buttons = [
  { label: '初回登録' },
  { label: 'Webサイト' },
  { label: 'お問合せ' }
];

const menu_type = 'unregistered';

// 各ボタンを描画
buttons.forEach((button, index) => {
  let x, y, cellWidth, cellHeight;

  // 未連携メニュー: 3列
  const cols = 3;
  const rows = 1;
  cellWidth = width / cols;
  cellHeight = height / rows;
  const col = index % cols;
  const row = Math.floor(index / cols);
  x = col * cellWidth;
  y = row * cellHeight;

  console.log(`ボタン${index + 1} (${button.label}):`, {
    x, y, cellWidth, cellHeight
  });

  // ボタンの枠線
  ctx.strokeStyle = '#E0E0E0';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, cellWidth, cellHeight);

  // アイコンとテキストのレイアウトを調整
  const iconSize = Math.min(cellWidth * 0.25, cellHeight * 0.3, 150);
  const iconX = x + (cellWidth - iconSize) / 2;
  const iconY = y + cellHeight * 0.15;

  console.log(`  アイコン:`, { iconSize, iconX, iconY });

  // アイコン（シンプルな丸）
  ctx.fillStyle = '#4A90E2';
  ctx.beginPath();
  ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
  ctx.fill();

  // アイコン内の記号
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${Math.floor(iconSize * 0.6)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let symbol = '●';
  if (button.label.includes('登録')) {
    symbol = '📝';
  } else if (button.label.includes('Web') || button.label.includes('サイト')) {
    symbol = '🌐';
  } else if (button.label.includes('問合')) {
    symbol = '✉';
  }

  ctx.fillText(symbol, iconX + iconSize / 2, iconY + iconSize / 2);

  // ラベル（下部）- サイズと位置を調整
  ctx.fillStyle = '#333333';
  const fontSize = Math.min(cellWidth * 0.08, cellHeight * 0.1, 65);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const labelY = iconY + iconSize + cellHeight * 0.05;

  console.log(`  テキスト:`, { fontSize, labelY, label: button.label });

  // ラベルを改行して表示
  const lines = button.label.split('\n');
  const lineHeight = fontSize * 1.2;

  lines.forEach((line, lineIndex) => {
    const textY = labelY + lineIndex * lineHeight;
    console.log(`    行${lineIndex + 1}: "${line}" at Y=${textY}`);

    // テキストがセルの範囲内にあることを確認
    if (textY + fontSize <= y + cellHeight) {
      ctx.fillText(line, x + cellWidth / 2, textY);
    } else {
      console.log(`    ⚠️  範囲外のため描画スキップ`);
    }
  });

  console.log('');
});

// 画像をファイルに保存
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('/Users/fukunagashindai/Downloads/D-MAX/test-rich-menu.png', buffer);

console.log('✅ テスト画像を保存しました: test-rich-menu.png');
console.log('\nこのファイルを開いて、テキストが正しく表示されているか確認してください。');
