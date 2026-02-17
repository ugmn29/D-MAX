#!/usr/bin/env python3
"""
Prismaスキーマから auth と storage スキーマのモデルを削除し、
public スキーマのみを残します。
"""

import re

# スキーマファイルのパス
SCHEMA_PATH = "prisma/schema.prisma"

def main():
    with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    print(f"元のファイルサイズ: {len(content)} 文字")

    # ジェネレーターとデータソース定義を保持
    lines = content.split('\n')
    result_lines = []

    in_model = False
    in_enum = False
    current_block = []
    skip_block = False

    for line in lines:
        # generator と datasource のブロックは常に保持
        if line.startswith('generator ') or line.startswith('datasource '):
            result_lines.append(line)
            continue

        # モデルまたはenumの開始
        if line.startswith('model ') or line.startswith('enum '):
            in_model = True
            current_block = [line]
            skip_block = False
            continue

        # モデル/enumブロック内
        if in_model:
            current_block.append(line)

            # auth または storage スキーマのマーカーを検出
            if '@@schema("auth")' in line or '@@schema("storage")' in line:
                skip_block = True

            # ブロックの終了（閉じ括弧のみの行）
            if line.strip() == '}':
                if not skip_block:
                    # public スキーマまたはスキーマ指定なし（public がデフォルト）のブロックを保持
                    result_lines.extend(current_block)
                    result_lines.append('')  # 空行を追加
                else:
                    print(f"削除: {current_block[0][:50]}...")

                in_model = False
                current_block = []
                skip_block = False
                continue
        else:
            # モデル/enumブロック外の行は保持
            result_lines.append(line)

    # 結果を書き込み
    result_content = '\n'.join(result_lines)

    # 連続する空行を1つにまとめる
    result_content = re.sub(r'\n{3,}', '\n\n', result_content)

    print(f"新しいファイルサイズ: {len(result_content)} 文字")
    print(f"削減: {len(content) - len(result_content)} 文字")

    with open(SCHEMA_PATH, 'w', encoding='utf-8') as f:
        f.write(result_content)

    print(f"✅ {SCHEMA_PATH} を更新しました")

if __name__ == '__main__':
    main()
