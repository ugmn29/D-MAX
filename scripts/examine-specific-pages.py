#!/usr/bin/env python3
"""
特定ページの内容を詳細に確認するスクリプト
第8部（処置）、第9部（手術）、第12部（歯冠修復）のサンプルページを表示
"""

import pypdf
import sys

def examine_pages(pdf_path, page_numbers):
    """指定されたページの内容を詳細表示"""

    reader = pypdf.PdfReader(pdf_path)

    for page_num in page_numbers:
        if page_num > len(reader.pages):
            print(f"ページ {page_num} は存在しません")
            continue

        page = reader.pages[page_num - 1]
        text = page.extract_text()

        print("=" * 80)
        print(f"ページ {page_num} の内容")
        print("=" * 80)
        print(text)
        print("\n")

if __name__ == "__main__":
    pdf_path = "厚生局　歯科保険点数.pdf"

    # 各セクションの代表ページを確認
    # 第8部処置: 42-50 → 43, 44を確認
    # 第9部手術: 51-65 → 51, 53を確認
    # 第12部歯冠修復: 66-79 → 66, 67を確認

    target_pages = [43, 44, 51, 53, 66, 67]

    print("重要セクションのサンプルページを詳細表示します\n")
    examine_pages(pdf_path, target_pages)
