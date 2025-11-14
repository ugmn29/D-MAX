#!/usr/bin/env python3
"""
PDFの構造を分析するスクリプト
厚生局の歯科保険点数PDFの内容を理解するための初期分析
"""

import pypdf
import sys
import json

def analyze_pdf(pdf_path):
    """PDFの基本情報と最初の数ページを分析"""

    try:
        reader = pypdf.PdfReader(pdf_path)

        # 基本情報
        print("=" * 80)
        print("PDF基本情報")
        print("=" * 80)
        print(f"ページ数: {len(reader.pages)}")

        # メタデータ
        if reader.metadata:
            print("\nメタデータ:")
            for key, value in reader.metadata.items():
                print(f"  {key}: {value}")

        # ページごとのサンプル抽出（最初の5ページ）
        print("\n" + "=" * 80)
        print("サンプルテキスト抽出（最初の5ページ）")
        print("=" * 80)

        max_pages = min(5, len(reader.pages))

        for i in range(max_pages):
            page = reader.pages[i]
            text = page.extract_text()

            print(f"\n--- ページ {i+1} ---")
            print(f"文字数: {len(text)}")

            # 最初の500文字を表示
            if text:
                preview = text[:500].strip()
                print(f"プレビュー:\n{preview}")
                if len(text) > 500:
                    print("...(続く)")
            else:
                print("(テキストが抽出できませんでした)")

            print("-" * 80)

        # 全ページの文字数統計
        print("\n" + "=" * 80)
        print("ページ別文字数統計")
        print("=" * 80)

        page_stats = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            char_count = len(text) if text else 0
            page_stats.append({
                'page': i + 1,
                'chars': char_count
            })

        # 統計サマリー
        total_chars = sum(s['chars'] for s in page_stats)
        avg_chars = total_chars / len(page_stats) if page_stats else 0

        print(f"総文字数: {total_chars:,}")
        print(f"平均文字数/ページ: {avg_chars:.0f}")
        print(f"最大文字数: {max(s['chars'] for s in page_stats):,} (ページ {max(page_stats, key=lambda x: x['chars'])['page']})")
        print(f"最小文字数: {min(s['chars'] for s in page_stats):,} (ページ {min(page_stats, key=lambda x: x['chars'])['page']})")

        # 空ページや短いページの検出
        short_pages = [s for s in page_stats if s['chars'] < 100]
        if short_pages:
            print(f"\n文字数が少ないページ（100文字未満）: {len(short_pages)}ページ")
            for s in short_pages[:10]:  # 最初の10ページのみ表示
                print(f"  ページ {s['page']}: {s['chars']}文字")

        # 統計データをJSONで保存
        output_file = 'pdf_analysis_stats.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump({
                'total_pages': len(reader.pages),
                'total_chars': total_chars,
                'avg_chars_per_page': avg_chars,
                'page_stats': page_stats
            }, f, ensure_ascii=False, indent=2)

        print(f"\n詳細統計を {output_file} に保存しました")

        return reader

    except Exception as e:
        print(f"エラー: {e}", file=sys.stderr)
        return None

if __name__ == "__main__":
    pdf_path = "厚生局　歯科保険点数.pdf"
    analyze_pdf(pdf_path)
