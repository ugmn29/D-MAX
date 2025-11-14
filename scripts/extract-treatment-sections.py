#!/usr/bin/env python3
"""
PDFから重要な診療行為セクションを抽出するスクリプト
特に以下のセクションに注目：
- 第8部 処置（充填、根管治療など）
- 第9部 手術（抜歯など）
- 第12部 歯冠修復及び欠損補綴（クラウン、ブリッジ、義歯）
"""

import pypdf
import json
import re
from typing import Dict, List, Optional

# 抽出したいキーワード（診療行為名）
TARGET_KEYWORDS = [
    '充填', 'う蝕', 'インレー', 'クラウン', 'ブリッジ',
    '抜髄', '根管', '感染根管', '根管治療',
    '抜歯', '普通抜歯', '難抜歯', '埋伏歯',
    'スケーリング', 'SRP', '歯周',
    '義歯', '有床義歯', '部分床義歯', '全部床義歯',
    '修復', '補綴', 'レジン',
]

# 重要なルール指標キーワード
RULE_KEYWORDS = [
    '算定', '場合に限り', '要件', '条件',
    '歳未満', '歳以上',
    '月1回', '月2回', '年1回',
    '同日', '同月', '同時',
    '初回', '2回目以降',
    '部位', '歯',
    '別に厚生労働大臣が定める',
]

def find_section_pages(reader: pypdf.PdfReader) -> Dict[str, List[int]]:
    """各部のページ範囲を特定"""
    section_map = {}
    current_section = None

    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if not text:
            continue

        # セクション検出（第8部、第9部、第12部）
        section_patterns = [
            (r'第８部\s*処置', '第8部_処置'),
            (r'第９部\s*手術', '第9部_手術'),
            (r'第12部\s*歯冠修復及び欠損補綴', '第12部_歯冠修復'),
            (r'第１部\s*医学管理等', '第1部_医学管理'),
            (r'第７部\s*リハビリテーション', '第7部_リハビリ'),
        ]

        for pattern, section_name in section_patterns:
            if re.search(pattern, text):
                current_section = section_name
                if current_section not in section_map:
                    section_map[current_section] = []
                print(f"セクション検出: {section_name} at ページ {i+1}")

        if current_section:
            section_map[current_section].append(i + 1)

    return section_map

def extract_relevant_content(reader: pypdf.PdfReader, page_num: int) -> Dict:
    """ページから関連するコンテンツを抽出"""
    page = reader.pages[page_num - 1]
    text = page.extract_text()

    if not text:
        return None

    # キーワードマッチング
    matched_keywords = []
    for keyword in TARGET_KEYWORDS:
        if keyword in text:
            matched_keywords.append(keyword)

    matched_rules = []
    for rule in RULE_KEYWORDS:
        if rule in text:
            matched_rules.append(rule)

    # このページが重要かどうか判定
    is_important = len(matched_keywords) > 0 or len(matched_rules) > 2

    return {
        'page': page_num,
        'char_count': len(text),
        'matched_keywords': matched_keywords,
        'matched_rules': matched_rules,
        'is_important': is_important,
        'text_preview': text[:300].strip() if is_important else None,
    }

def extract_treatment_details(text: str) -> List[Dict]:
    """テキストから診療行為の詳細情報を抽出"""
    details = []

    # 区分番号パターン（例: I000, M000など）
    code_pattern = r'([A-Z]\d{3,4}(?:-\d)?)\s+([^\n]{5,50})'

    matches = re.finditer(code_pattern, text)
    for match in matches:
        code = match.group(1)
        name = match.group(2).strip()

        # このコードの周辺テキストを取得（前後200文字）
        start = max(0, match.start() - 200)
        end = min(len(text), match.end() + 500)
        context = text[start:end]

        # 点数を抽出
        points_match = re.search(r'(\d{1,5})点', context)
        points = int(points_match.group(1)) if points_match else None

        # 算定条件を抽出
        conditions = []

        # 年齢制限
        age_match = re.search(r'(\d+)歳(未満|以上|以下)', context)
        if age_match:
            conditions.append(f"年齢: {age_match.group(0)}")

        # 算定回数制限
        freq_match = re.search(r'(月|年)(\d+)回', context)
        if freq_match:
            conditions.append(f"頻度: {freq_match.group(0)}")

        # 「場合に限り」パターン
        limit_pattern = r'([^。]+場合に限り[^。]*)'
        limit_matches = re.findall(limit_pattern, context)
        conditions.extend(limit_matches[:3])  # 最大3つ

        details.append({
            'code': code,
            'name': name,
            'points': points,
            'conditions': conditions,
            'context_preview': context[:200].strip(),
        })

    return details

def main():
    pdf_path = "厚生局　歯科保険点数.pdf"

    print("=" * 80)
    print("PDFから重要な診療行為セクションを抽出")
    print("=" * 80)

    reader = pypdf.PdfReader(pdf_path)

    # ステップ1: セクションページの特定
    print("\n[ステップ1] セクションページの特定...")
    section_map = find_section_pages(reader)

    print("\n検出されたセクション:")
    for section, pages in section_map.items():
        print(f"  {section}: {len(pages)}ページ (ページ {pages[0]}-{pages[-1]})")

    # ステップ2: 重要ページの特定
    print("\n[ステップ2] 重要ページの特定...")
    important_pages = []

    # 各セクションの最初の10ページを詳細分析
    target_sections = ['第8部_処置', '第9部_手術', '第12部_歯冠修復']

    for section in target_sections:
        if section not in section_map:
            continue

        pages = section_map[section][:15]  # 最初の15ページ
        print(f"\n{section} を分析中...")

        for page_num in pages:
            content = extract_relevant_content(reader, page_num)
            if content and content['is_important']:
                important_pages.append(content)
                print(f"  ページ {page_num}: キーワード={len(content['matched_keywords'])}, ルール={len(content['matched_rules'])}")

    # ステップ3: 重要ページから詳細抽出
    print("\n[ステップ3] 診療行為詳細の抽出...")
    all_treatments = []

    for page_info in important_pages[:10]:  # 最初の10ページを詳細分析
        page_num = page_info['page']
        page = reader.pages[page_num - 1]
        text = page.extract_text()

        treatments = extract_treatment_details(text)
        if treatments:
            print(f"\nページ {page_num}: {len(treatments)}件の診療行為を検出")
            for t in treatments[:3]:  # 最初の3件を表示
                print(f"  - {t['code']}: {t['name']}")
                if t['points']:
                    print(f"    点数: {t['points']}点")
                if t['conditions']:
                    print(f"    条件: {t['conditions'][0][:50]}...")

            all_treatments.extend(treatments)

    # 結果を保存
    output = {
        'section_map': {k: {'pages': v, 'start': v[0], 'end': v[-1], 'count': len(v)}
                       for k, v in section_map.items()},
        'important_pages': important_pages,
        'extracted_treatments': all_treatments,
        'summary': {
            'total_sections': len(section_map),
            'total_important_pages': len(important_pages),
            'total_treatments_extracted': len(all_treatments),
        }
    }

    output_file = 'pdf_treatment_extraction.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 80)
    print("抽出完了")
    print("=" * 80)
    print(f"検出セクション数: {len(section_map)}")
    print(f"重要ページ数: {len(important_pages)}")
    print(f"抽出診療行為数: {len(all_treatments)}")
    print(f"\n詳細結果を {output_file} に保存しました")

    # サンプル表示
    if all_treatments:
        print("\n抽出された診療行為のサンプル:")
        for treatment in all_treatments[:5]:
            print(f"\n【{treatment['code']}】 {treatment['name']}")
            if treatment['points']:
                print(f"  点数: {treatment['points']}点")
            if treatment['conditions']:
                print(f"  条件:")
                for cond in treatment['conditions'][:2]:
                    print(f"    - {cond[:80]}")

if __name__ == "__main__":
    main()
