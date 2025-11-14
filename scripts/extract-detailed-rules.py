#!/usr/bin/env python3
"""
PDFから詳細な算定ルールを抽出してJSON化するスクリプト
- 年齢による加算
- 時間帯加算
- 訪問診療加算
- 特殊条件による点数変動
"""

import pypdf
import json
import re
from typing import Dict, List, Optional

def extract_addition_rules(reader: pypdf.PdfReader, page_num: int) -> Dict:
    """加算ルールを抽出"""
    page = reader.pages[page_num - 1]
    text = page.extract_text()

    rules = {
        "age_based_additions": [],
        "time_based_additions": [],
        "visit_based_additions": [],
        "special_conditions": []
    }

    # 年齢による加算
    age_patterns = [
        (r'６歳未満の乳幼児.*?所定点数の100分の(\d+)に相当する点数', 'under_6_infant'),
        (r'著しく歯科診療が困難な者.*?所定点数の100分の(\d+)に相当する点数', 'difficult_patient'),
    ]

    for pattern, rule_type in age_patterns:
        matches = re.finditer(pattern, text, re.DOTALL)
        for match in matches:
            rate = int(match.group(1)) / 100
            rules["age_based_additions"].append({
                "type": rule_type,
                "rate": rate,
                "description": match.group(0)[:100].replace('\n', ' ').strip()
            })

    # 時間帯加算
    time_patterns = [
        (r'休日.*?所定点数の100分の(\d+)に相当する点数', 'holiday'),
        (r'時間外.*?所定点数の100分の(\d+)に相当する点数', 'overtime'),
        (r'深夜.*?所定点数の100分の(\d+)に相当する点数', 'midnight'),
    ]

    for pattern, rule_type in time_patterns:
        matches = re.finditer(pattern, text, re.DOTALL)
        for match in matches:
            rate = int(match.group(1)) / 100
            rules["time_based_additions"].append({
                "type": rule_type,
                "rate": rate,
                "description": match.group(0)[:100].replace('\n', ' ').strip()
            })

    # 訪問診療加算
    visit_patterns = [
        (r'歯科訪問診療.*?所定点数の100分の(\d+)に相当する点数', 'home_visit'),
    ]

    for pattern, rule_type in visit_patterns:
        matches = re.finditer(pattern, text, re.DOTALL)
        for match in matches:
            rate = int(match.group(1)) / 100
            rules["visit_based_additions"].append({
                "type": rule_type,
                "rate": rate,
                "description": match.group(0)[:100].replace('\n', ' ').strip()
            })

    return rules

def extract_treatment_details_v2(reader: pypdf.PdfReader, page_nums: List[int]) -> List[Dict]:
    """診療行為の詳細を抽出（改良版）"""
    treatments = []

    for page_num in page_nums:
        page = reader.pages[page_num - 1]
        text = page.extract_text()

        # パターン1: I000形式のコード
        # 例: I005 抜髄（１歯につき）
        pattern1 = r'([IJ][\d０-９]{3,4}(?:-\d)?)\s+([^\n]{5,50})'

        matches = re.finditer(pattern1, text)
        for match in matches:
            code = match.group(1)
            name = match.group(2).strip()

            # このコードの周辺テキスト（前後1000文字）
            start = max(0, match.start() - 100)
            end = min(len(text), match.end() + 1000)
            context = text[start:end]

            # サブ項目を抽出（1, 2, 3などの番号付き）
            sub_items = []
            sub_pattern = r'(\d)\s+([^\n]{5,80}?)\s+(\d{1,5})点'
            sub_matches = re.finditer(sub_pattern, context)

            for sub_match in sub_matches:
                sub_num = sub_match.group(1)
                sub_name = sub_match.group(2).strip()
                points = int(sub_match.group(3))

                # 条件を抽出
                conditions = extract_conditions_from_text(context, sub_match.start())

                sub_items.append({
                    "sub_number": sub_num,
                    "name": sub_name,
                    "points": points,
                    "conditions": conditions
                })

            if sub_items:
                treatments.append({
                    "code": code,
                    "name": name,
                    "page": page_num,
                    "sub_items": sub_items,
                    "context": context[:300].replace('\n', ' ').strip()
                })

    return treatments

def extract_conditions_from_text(text: str, position: int) -> List[str]:
    """テキストから算定条件を抽出"""
    conditions = []

    # positionから前後500文字を取得
    start = max(0, position - 500)
    end = min(len(text), position + 500)
    context = text[start:end]

    # 条件パターン
    condition_patterns = [
        r'([^\n。]*?歳[未以][満上下][^\n。]{0,50})',
        r'([^\n。]*?月[以内から][^\n。]{0,50})',
        r'([^\n。]*?場合に限り[^\n。]{0,50})',
        r'([^\n。]*?回.*?算定[^\n。]{0,50})',
        r'([^\n。]*?要件[^\n。]{0,50})',
        r'([^\n。]*?基準[^\n。]{0,50})',
    ]

    for pattern in condition_patterns:
        matches = re.findall(pattern, context)
        for match in matches[:3]:  # 最大3つまで
            clean_match = match.strip().replace('\n', ' ')
            if len(clean_match) > 10 and clean_match not in conditions:
                conditions.append(clean_match)

    return conditions

def main():
    pdf_path = "厚生局　歯科保険点数.pdf"
    reader = pypdf.PdfReader(pdf_path)

    print("=" * 80)
    print("PDFから詳細な算定ルールを抽出")
    print("=" * 80)

    # ステップ1: 加算ルールの抽出（通則部分）
    print("\n[ステップ1] 加算ルールの抽出...")

    # 処置の通則（ページ43）
    treatment_rules = extract_addition_rules(reader, 43)
    print(f"処置の加算ルール: 年齢={len(treatment_rules['age_based_additions'])}, "
          f"時間={len(treatment_rules['time_based_additions'])}, "
          f"訪問={len(treatment_rules['visit_based_additions'])}")

    # 手術の通則（ページ51, 53）
    surgery_rules_51 = extract_addition_rules(reader, 51)
    surgery_rules_53 = extract_addition_rules(reader, 53)
    print(f"手術の加算ルール: ページ51={len(surgery_rules_51['age_based_additions'])}, "
          f"ページ53={len(surgery_rules_53['age_based_additions'])}")

    # 歯冠修復の通則（ページ66, 67）
    crown_rules_66 = extract_addition_rules(reader, 66)
    crown_rules_67 = extract_addition_rules(reader, 67)
    print(f"歯冠修復の加算ルール: ページ66={len(crown_rules_66['age_based_additions'])}, "
          f"ページ67={len(crown_rules_67['age_based_additions'])}")

    # ステップ2: 具体的な診療行為の抽出
    print("\n[ステップ2] 具体的な診療行為の抽出...")

    # 処置（ページ44-50）
    treatment_pages = list(range(44, 51))
    treatments = extract_treatment_details_v2(reader, treatment_pages)
    print(f"処置の診療行為: {len(treatments)}件")

    # 手術（ページ51-65）
    surgery_pages = list(range(51, 66))
    surgeries = extract_treatment_details_v2(reader, surgery_pages)
    print(f"手術の診療行為: {len(surgeries)}件")

    # 歯冠修復（ページ66-79）
    crown_pages = list(range(66, 80))
    crowns = extract_treatment_details_v2(reader, crown_pages)
    print(f"歯冠修復の診療行為: {len(crowns)}件")

    # 結果を統合
    result = {
        "extraction_date": "2025-11-12",
        "source": "厚生局　歯科保険点数.pdf",
        "rules": {
            "treatment_additions": treatment_rules,
            "surgery_additions": {
                **surgery_rules_51,
                "age_based_additions": surgery_rules_51["age_based_additions"] + surgery_rules_53["age_based_additions"],
                "time_based_additions": surgery_rules_51["time_based_additions"] + surgery_rules_53["time_based_additions"],
                "visit_based_additions": surgery_rules_51["visit_based_additions"] + surgery_rules_53["visit_based_additions"],
            },
            "crown_additions": {
                **crown_rules_66,
                "age_based_additions": crown_rules_66["age_based_additions"] + crown_rules_67["age_based_additions"],
                "time_based_additions": crown_rules_66["time_based_additions"] + crown_rules_67["time_based_additions"],
                "visit_based_additions": crown_rules_66["visit_based_additions"] + crown_rules_67["visit_based_additions"],
            }
        },
        "treatments": {
            "treatment_procedures": treatments,
            "surgeries": surgeries,
            "crown_restorations": crowns
        },
        "summary": {
            "total_treatment_procedures": len(treatments),
            "total_surgeries": len(surgeries),
            "total_crown_restorations": len(crowns),
            "total_items": len(treatments) + len(surgeries) + len(crowns)
        }
    }

    # JSON保存
    output_file = 'pdf_detailed_rules.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 80)
    print("抽出完了")
    print("=" * 80)
    print(f"詳細ルールを {output_file} に保存しました")
    print(f"\n統計:")
    print(f"  処置の診療行為: {len(treatments)}件")
    print(f"  手術の診療行為: {len(surgeries)}件")
    print(f"  歯冠修復の診療行為: {len(crowns)}件")
    print(f"  合計: {len(treatments) + len(surgeries) + len(crowns)}件")

    # サンプル表示
    if treatments:
        print("\n処置の診療行為サンプル:")
        for t in treatments[:3]:
            print(f"\n【{t['code']}】 {t['name']}")
            for sub in t['sub_items'][:2]:
                print(f"  {sub['sub_number']}. {sub['name']}: {sub['points']}点")
                if sub['conditions']:
                    print(f"     条件: {sub['conditions'][0][:60]}...")

    if surgeries:
        print("\n手術の診療行為サンプル:")
        for s in surgeries[:3]:
            print(f"\n【{s['code']}】 {s['name']}")
            for sub in s['sub_items'][:2]:
                print(f"  {sub['sub_number']}. {sub['name']}: {sub['points']}点")
                if sub['conditions']:
                    print(f"     条件: {sub['conditions'][0][:60]}...")

if __name__ == "__main__":
    main()
