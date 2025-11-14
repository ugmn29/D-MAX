-- PDFから抽出した詳細算定ルールの統合
-- 生成日時: 2025-11-12T06:38:19.831Z
-- ソース: 厚生局　歯科保険点数.pdf

BEGIN;


-- =====================================================
-- 抜髄（I005）の詳細ルール
-- =====================================================

-- 単根管
UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"detailed_rules":{"unit":"1歯につき","conditional_points":{"after_pulp_preservation_3months":42,"after_direct_pulp_protection_1month":80},"conditions":["歯髄温存療法を行った日から起算して3月以内の場合は42点","直接歯髄保護処置を行った日から起算して1月以内の場合は80点"]},"addition_rules":{"age_based_additions":[{"type":"under_6_infant","rate":0.5,"description":"６歳未満の乳幼児又は著しく歯科診療が困難な者に対して、処置を行った場合は、全身麻酔 下で行った場合を除き、次に掲げる点数を、それぞれ当該処置の所定点数に加算する。ただし 、通則第８号又は第９号に掲げる"},{"type":"difficult_patient","rate":0.5,"description":"著しく歯科診療が困難な者に対して、処置を行った場合は、全身麻酔 下で行った場合を除き、次に掲げる点数を、それぞれ当該処置の所定点数に加算する。ただし 、通則第８号又は第９号に掲げる加算を算定する場合は"}],"time_based_additions":[{"type":"holiday","rate":1.6,"description":"休日に処置を行った場合又は処置の開始時間が保険医療機関の表示する診療時 間以外の時間若しくは深夜である場合は、次に掲げる点数を、それぞれ所定点数に加算した点 数により算定する。 イ 処置の所定点数が1"},{"type":"holiday","rate":0.8,"description":"休日加算２ 所定点数の100分の80に相当する点数"},{"type":"overtime","rate":0.8,"description":"時間外加算１（入院中の患者以外の患者に対して行われる場合に限る。） 所定点数の100分の80に相当する点数"},{"type":"overtime","rate":0.4,"description":"時間外加算２ 所定点数の100分の40に相当する点数"},{"type":"midnight","rate":1.6,"description":"深夜である場合は、次に掲げる点数を、それぞれ所定点数に加算した点 数により算定する。 イ 処置の所定点数が1,000点以上の場合であって、別に厚生労働大臣が定める施設基準に適 合しているものとして地方"},{"type":"midnight","rate":1.6,"description":"深夜加算１ 所定点数の100分の160に相当する点数"},{"type":"midnight","rate":0.8,"description":"深夜加算２ 所定点数の100分の80に相当する点数"}],"visit_based_additions":[{"type":"home_visit","rate":0.5,"description":"歯科訪問診療料を算定する患者であって、同注６に規定する加算 を算定しないものに対して、歯科訪問診療時に処置を行った場合は、次に掲げる点数を、それ ぞれ当該処置の所定点数に加算する。 イ 区分番号Ｉ００"},{"type":"home_visit","rate":0.5,"description":"歯科訪問診療料及び同注６に規定する加算を算定する患者に対し て、歯科訪問診療時に処置を行った場合は、次に掲げる点数を、それぞれ当該処置の所定点数 に加算する。 イ 処置（区分番号Ｉ００５（１及び２に限"}],"special_conditions":[]}}'::jsonb
WHERE name ILIKE '%抜髄%' AND name ILIKE '%単根管%';

-- 2根管
UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"detailed_rules":{"unit":"1歯につき","conditional_points":{"after_pulp_preservation_3months":234,"after_direct_pulp_protection_1month":272},"conditions":["歯髄温存療法を行った日から起算して3月以内の場合は234点","直接歯髄保護処置を行った日から起算して1月以内の場合は272点"]},"addition_rules":{"age_based_additions":[{"type":"under_6_infant","rate":0.5,"description":"６歳未満の乳幼児又は著しく歯科診療が困難な者に対して、処置を行った場合は、全身麻酔 下で行った場合を除き、次に掲げる点数を、それぞれ当該処置の所定点数に加算する。ただし 、通則第８号又は第９号に掲げる"},{"type":"difficult_patient","rate":0.5,"description":"著しく歯科診療が困難な者に対して、処置を行った場合は、全身麻酔 下で行った場合を除き、次に掲げる点数を、それぞれ当該処置の所定点数に加算する。ただし 、通則第８号又は第９号に掲げる加算を算定する場合は"}],"time_based_additions":[{"type":"holiday","rate":1.6,"description":"休日に処置を行った場合又は処置の開始時間が保険医療機関の表示する診療時 間以外の時間若しくは深夜である場合は、次に掲げる点数を、それぞれ所定点数に加算した点 数により算定する。 イ 処置の所定点数が1"},{"type":"holiday","rate":0.8,"description":"休日加算２ 所定点数の100分の80に相当する点数"},{"type":"overtime","rate":0.8,"description":"時間外加算１（入院中の患者以外の患者に対して行われる場合に限る。） 所定点数の100分の80に相当する点数"},{"type":"overtime","rate":0.4,"description":"時間外加算２ 所定点数の100分の40に相当する点数"},{"type":"midnight","rate":1.6,"description":"深夜である場合は、次に掲げる点数を、それぞれ所定点数に加算した点 数により算定する。 イ 処置の所定点数が1,000点以上の場合であって、別に厚生労働大臣が定める施設基準に適 合しているものとして地方"},{"type":"midnight","rate":1.6,"description":"深夜加算１ 所定点数の100分の160に相当する点数"},{"type":"midnight","rate":0.8,"description":"深夜加算２ 所定点数の100分の80に相当する点数"}],"visit_based_additions":[{"type":"home_visit","rate":0.5,"description":"歯科訪問診療料を算定する患者であって、同注６に規定する加算 を算定しないものに対して、歯科訪問診療時に処置を行った場合は、次に掲げる点数を、それ ぞれ当該処置の所定点数に加算する。 イ 区分番号Ｉ００"},{"type":"home_visit","rate":0.5,"description":"歯科訪問診療料及び同注６に規定する加算を算定する患者に対し て、歯科訪問診療時に処置を行った場合は、次に掲げる点数を、それぞれ当該処置の所定点数 に加算する。 イ 処置（区分番号Ｉ００５（１及び２に限"}],"special_conditions":[]}}'::jsonb
WHERE name ILIKE '%抜髄%' AND name ILIKE '%2根管%';

-- 3根管以上
UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"detailed_rules":{"unit":"1歯につき","conditional_points":{"after_pulp_preservation_3months":408,"after_direct_pulp_protection_1month":446},"conditions":["歯髄温存療法を行った日から起算して3月以内の場合は408点","直接歯髄保護処置を行った日から起算して1月以内の場合は446点"]},"addition_rules":{"age_based_additions":[{"type":"under_6_infant","rate":0.5,"description":"６歳未満の乳幼児又は著しく歯科診療が困難な者に対して、処置を行った場合は、全身麻酔 下で行った場合を除き、次に掲げる点数を、それぞれ当該処置の所定点数に加算する。ただし 、通則第８号又は第９号に掲げる"},{"type":"difficult_patient","rate":0.5,"description":"著しく歯科診療が困難な者に対して、処置を行った場合は、全身麻酔 下で行った場合を除き、次に掲げる点数を、それぞれ当該処置の所定点数に加算する。ただし 、通則第８号又は第９号に掲げる加算を算定する場合は"}],"time_based_additions":[{"type":"holiday","rate":1.6,"description":"休日に処置を行った場合又は処置の開始時間が保険医療機関の表示する診療時 間以外の時間若しくは深夜である場合は、次に掲げる点数を、それぞれ所定点数に加算した点 数により算定する。 イ 処置の所定点数が1"},{"type":"holiday","rate":0.8,"description":"休日加算２ 所定点数の100分の80に相当する点数"},{"type":"overtime","rate":0.8,"description":"時間外加算１（入院中の患者以外の患者に対して行われる場合に限る。） 所定点数の100分の80に相当する点数"},{"type":"overtime","rate":0.4,"description":"時間外加算２ 所定点数の100分の40に相当する点数"},{"type":"midnight","rate":1.6,"description":"深夜である場合は、次に掲げる点数を、それぞれ所定点数に加算した点 数により算定する。 イ 処置の所定点数が1,000点以上の場合であって、別に厚生労働大臣が定める施設基準に適 合しているものとして地方"},{"type":"midnight","rate":1.6,"description":"深夜加算１ 所定点数の100分の160に相当する点数"},{"type":"midnight","rate":0.8,"description":"深夜加算２ 所定点数の100分の80に相当する点数"}],"visit_based_additions":[{"type":"home_visit","rate":0.5,"description":"歯科訪問診療料を算定する患者であって、同注６に規定する加算 を算定しないものに対して、歯科訪問診療時に処置を行った場合は、次に掲げる点数を、それ ぞれ当該処置の所定点数に加算する。 イ 区分番号Ｉ００"},{"type":"home_visit","rate":0.5,"description":"歯科訪問診療料及び同注６に規定する加算を算定する患者に対し て、歯科訪問診療時に処置を行った場合は、次に掲げる点数を、それぞれ当該処置の所定点数 に加算する。 イ 処置（区分番号Ｉ００５（１及び２に限"}],"special_conditions":[]}}'::jsonb
WHERE name ILIKE '%抜髄%' AND name ILIKE '%3根管%';


-- =====================================================
-- 抜歯手術（J000）の詳細ルール
-- =====================================================

-- 乳歯
UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"detailed_rules":{"unit":"1歯につき","conditions":[]},"addition_rules":{"age_based_additions":[],"time_based_additions":[],"visit_based_additions":[{"type":"home_visit","rate":0.5,"description":"歯科訪問診療時に手術を行った場合は、次に掲 げる点数をそれぞれ当該手術の所定点数に加算する。 イ 区分番号Ｊ０００（１、２及び３に限る。）に掲げる抜歯手術を行った場合（注１の加算 を算定した場合を除く"},{"type":"home_visit","rate":0.5,"description":"歯科訪問診療料及び同注６に規定する歯科診療特別対応加算を算 定する患者に対して、歯科訪問診療時に手術を行った場合は、次に掲げる点数を、それぞれ当 該手術の所定点数に加算する。 イ 区分番号Ｊ０１３（１"}],"special_conditions":[]}}'::jsonb
WHERE name ILIKE '%抜歯%' AND name ILIKE '%乳歯%';

-- 前歯
UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"detailed_rules":{"unit":"1歯につき","additions":{"difficult_extraction":210},"conditions":["難抜歯加算: 歯根肥大、骨の癒着歯等の場合 +210点"]},"addition_rules":{"age_based_additions":[],"time_based_additions":[],"visit_based_additions":[{"type":"home_visit","rate":0.5,"description":"歯科訪問診療時に手術を行った場合は、次に掲 げる点数をそれぞれ当該手術の所定点数に加算する。 イ 区分番号Ｊ０００（１、２及び３に限る。）に掲げる抜歯手術を行った場合（注１の加算 を算定した場合を除く"},{"type":"home_visit","rate":0.5,"description":"歯科訪問診療料及び同注６に規定する歯科診療特別対応加算を算 定する患者に対して、歯科訪問診療時に手術を行った場合は、次に掲げる点数を、それぞれ当 該手術の所定点数に加算する。 イ 区分番号Ｊ０１３（１"}],"special_conditions":[]}}'::jsonb
WHERE name ILIKE '%抜歯%' AND name ILIKE '%前歯%' AND name NOT ILIKE '%埋伏%';

-- 臼歯
UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"detailed_rules":{"unit":"1歯につき","additions":{"difficult_extraction":210},"conditions":["難抜歯加算: 歯根肥大、骨の癒着歯等の場合 +210点"]},"addition_rules":{"age_based_additions":[],"time_based_additions":[],"visit_based_additions":[{"type":"home_visit","rate":0.5,"description":"歯科訪問診療時に手術を行った場合は、次に掲 げる点数をそれぞれ当該手術の所定点数に加算する。 イ 区分番号Ｊ０００（１、２及び３に限る。）に掲げる抜歯手術を行った場合（注１の加算 を算定した場合を除く"},{"type":"home_visit","rate":0.5,"description":"歯科訪問診療料及び同注６に規定する歯科診療特別対応加算を算 定する患者に対して、歯科訪問診療時に手術を行った場合は、次に掲げる点数を、それぞれ当 該手術の所定点数に加算する。 イ 区分番号Ｊ０１３（１"}],"special_conditions":[]}}'::jsonb
WHERE name ILIKE '%抜歯%' AND name ILIKE '%臼歯%' AND name NOT ILIKE '%埋伏%';

-- 埋伏歯
UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"detailed_rules":{"unit":"1歯につき","additions":{"mandibular_impacted":120},"conditions":["完全埋伏歯（骨性）又は水平埋伏智歯に限り算定","下顎完全埋伏智歯（骨性）又は下顎水平埋伏智歯の場合 +120点"]},"addition_rules":{"age_based_additions":[],"time_based_additions":[],"visit_based_additions":[{"type":"home_visit","rate":0.5,"description":"歯科訪問診療時に手術を行った場合は、次に掲 げる点数をそれぞれ当該手術の所定点数に加算する。 イ 区分番号Ｊ０００（１、２及び３に限る。）に掲げる抜歯手術を行った場合（注１の加算 を算定した場合を除く"},{"type":"home_visit","rate":0.5,"description":"歯科訪問診療料及び同注６に規定する歯科診療特別対応加算を算 定する患者に対して、歯科訪問診療時に手術を行った場合は、次に掲げる点数を、それぞれ当 該手術の所定点数に加算する。 イ 区分番号Ｊ０１３（１"}],"special_conditions":[]}}'::jsonb
WHERE name ILIKE '%抜歯%' AND name ILIKE '%埋伏%';


-- =====================================================
-- 歯髄保護処置（I001）の詳細ルール
-- =====================================================

-- 歯髄温存療法
UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"detailed_rules":{"unit":"1歯につき","conditions":["経過観察中のう蝕処置は所定点数に含まれる"]},"addition_rules":{"age_based_additions":[{"type":"under_6_infant","rate":0.5,"description":"６歳未満の乳幼児又は著しく歯科診療が困難な者に対して、処置を行った場合は、全身麻酔 下で行った場合を除き、次に掲げる点数を、それぞれ当該処置の所定点数に加算する。ただし 、通則第８号又は第９号に掲げる"},{"type":"difficult_patient","rate":0.5,"description":"著しく歯科診療が困難な者に対して、処置を行った場合は、全身麻酔 下で行った場合を除き、次に掲げる点数を、それぞれ当該処置の所定点数に加算する。ただし 、通則第８号又は第９号に掲げる加算を算定する場合は"}],"time_based_additions":[{"type":"holiday","rate":1.6,"description":"休日に処置を行った場合又は処置の開始時間が保険医療機関の表示する診療時 間以外の時間若しくは深夜である場合は、次に掲げる点数を、それぞれ所定点数に加算した点 数により算定する。 イ 処置の所定点数が1"},{"type":"holiday","rate":0.8,"description":"休日加算２ 所定点数の100分の80に相当する点数"},{"type":"overtime","rate":0.8,"description":"時間外加算１（入院中の患者以外の患者に対して行われる場合に限る。） 所定点数の100分の80に相当する点数"},{"type":"overtime","rate":0.4,"description":"時間外加算２ 所定点数の100分の40に相当する点数"},{"type":"midnight","rate":1.6,"description":"深夜である場合は、次に掲げる点数を、それぞれ所定点数に加算した点 数により算定する。 イ 処置の所定点数が1,000点以上の場合であって、別に厚生労働大臣が定める施設基準に適 合しているものとして地方"},{"type":"midnight","rate":1.6,"description":"深夜加算１ 所定点数の100分の160に相当する点数"},{"type":"midnight","rate":0.8,"description":"深夜加算２ 所定点数の100分の80に相当する点数"}],"visit_based_additions":[{"type":"home_visit","rate":0.5,"description":"歯科訪問診療料を算定する患者であって、同注６に規定する加算 を算定しないものに対して、歯科訪問診療時に処置を行った場合は、次に掲げる点数を、それ ぞれ当該処置の所定点数に加算する。 イ 区分番号Ｉ００"},{"type":"home_visit","rate":0.5,"description":"歯科訪問診療料及び同注６に規定する加算を算定する患者に対し て、歯科訪問診療時に処置を行った場合は、次に掲げる点数を、それぞれ当該処置の所定点数 に加算する。 イ 処置（区分番号Ｉ００５（１及び２に限"}],"special_conditions":[]}}'::jsonb
WHERE name ILIKE '%歯髄%温存%';

-- 直接歯髄保護処置
UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"detailed_rules":{"unit":"1歯につき","conditions":[]},"addition_rules":{"age_based_additions":[{"type":"under_6_infant","rate":0.5,"description":"６歳未満の乳幼児又は著しく歯科診療が困難な者に対して、処置を行った場合は、全身麻酔 下で行った場合を除き、次に掲げる点数を、それぞれ当該処置の所定点数に加算する。ただし 、通則第８号又は第９号に掲げる"},{"type":"difficult_patient","rate":0.5,"description":"著しく歯科診療が困難な者に対して、処置を行った場合は、全身麻酔 下で行った場合を除き、次に掲げる点数を、それぞれ当該処置の所定点数に加算する。ただし 、通則第８号又は第９号に掲げる加算を算定する場合は"}],"time_based_additions":[{"type":"holiday","rate":1.6,"description":"休日に処置を行った場合又は処置の開始時間が保険医療機関の表示する診療時 間以外の時間若しくは深夜である場合は、次に掲げる点数を、それぞれ所定点数に加算した点 数により算定する。 イ 処置の所定点数が1"},{"type":"holiday","rate":0.8,"description":"休日加算２ 所定点数の100分の80に相当する点数"},{"type":"overtime","rate":0.8,"description":"時間外加算１（入院中の患者以外の患者に対して行われる場合に限る。） 所定点数の100分の80に相当する点数"},{"type":"overtime","rate":0.4,"description":"時間外加算２ 所定点数の100分の40に相当する点数"},{"type":"midnight","rate":1.6,"description":"深夜である場合は、次に掲げる点数を、それぞれ所定点数に加算した点 数により算定する。 イ 処置の所定点数が1,000点以上の場合であって、別に厚生労働大臣が定める施設基準に適 合しているものとして地方"},{"type":"midnight","rate":1.6,"description":"深夜加算１ 所定点数の100分の160に相当する点数"},{"type":"midnight","rate":0.8,"description":"深夜加算２ 所定点数の100分の80に相当する点数"}],"visit_based_additions":[{"type":"home_visit","rate":0.5,"description":"歯科訪問診療料を算定する患者であって、同注６に規定する加算 を算定しないものに対して、歯科訪問診療時に処置を行った場合は、次に掲げる点数を、それ ぞれ当該処置の所定点数に加算する。 イ 区分番号Ｉ００"},{"type":"home_visit","rate":0.5,"description":"歯科訪問診療料及び同注６に規定する加算を算定する患者に対し て、歯科訪問診療時に処置を行った場合は、次に掲げる点数を、それぞれ当該処置の所定点数 に加算する。 イ 処置（区分番号Ｉ００５（１及び２に限"}],"special_conditions":[]}}'::jsonb
WHERE name ILIKE '%直接%歯髄%保護%';

-- 間接歯髄保護処置
UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"detailed_rules":{"unit":"1歯につき","conditions":[]},"addition_rules":{"age_based_additions":[{"type":"under_6_infant","rate":0.5,"description":"６歳未満の乳幼児又は著しく歯科診療が困難な者に対して、処置を行った場合は、全身麻酔 下で行った場合を除き、次に掲げる点数を、それぞれ当該処置の所定点数に加算する。ただし 、通則第８号又は第９号に掲げる"},{"type":"difficult_patient","rate":0.5,"description":"著しく歯科診療が困難な者に対して、処置を行った場合は、全身麻酔 下で行った場合を除き、次に掲げる点数を、それぞれ当該処置の所定点数に加算する。ただし 、通則第８号又は第９号に掲げる加算を算定する場合は"}],"time_based_additions":[{"type":"holiday","rate":1.6,"description":"休日に処置を行った場合又は処置の開始時間が保険医療機関の表示する診療時 間以外の時間若しくは深夜である場合は、次に掲げる点数を、それぞれ所定点数に加算した点 数により算定する。 イ 処置の所定点数が1"},{"type":"holiday","rate":0.8,"description":"休日加算２ 所定点数の100分の80に相当する点数"},{"type":"overtime","rate":0.8,"description":"時間外加算１（入院中の患者以外の患者に対して行われる場合に限る。） 所定点数の100分の80に相当する点数"},{"type":"overtime","rate":0.4,"description":"時間外加算２ 所定点数の100分の40に相当する点数"},{"type":"midnight","rate":1.6,"description":"深夜である場合は、次に掲げる点数を、それぞれ所定点数に加算した点 数により算定する。 イ 処置の所定点数が1,000点以上の場合であって、別に厚生労働大臣が定める施設基準に適 合しているものとして地方"},{"type":"midnight","rate":1.6,"description":"深夜加算１ 所定点数の100分の160に相当する点数"},{"type":"midnight","rate":0.8,"description":"深夜加算２ 所定点数の100分の80に相当する点数"}],"visit_based_additions":[{"type":"home_visit","rate":0.5,"description":"歯科訪問診療料を算定する患者であって、同注６に規定する加算 を算定しないものに対して、歯科訪問診療時に処置を行った場合は、次に掲げる点数を、それ ぞれ当該処置の所定点数に加算する。 イ 区分番号Ｉ００"},{"type":"home_visit","rate":0.5,"description":"歯科訪問診療料及び同注６に規定する加算を算定する患者に対し て、歯科訪問診療時に処置を行った場合は、次に掲げる点数を、それぞれ当該処置の所定点数 に加算する。 イ 処置（区分番号Ｉ００５（１及び２に限"}],"special_conditions":[]}}'::jsonb
WHERE name ILIKE '%間接%歯髄%保護%';


-- =====================================================
-- う蝕処置（I000）の詳細ルール
-- =====================================================

UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"detailed_rules":{"unit":"1歯1回につき","inclusions":["貼薬","仮封","特定薬剤"],"note":"貼薬、仮封及び特定薬剤の費用並びに特定保険医療材料料は、所定点数に含まれる"},"addition_rules":{"age_based_additions":[{"type":"under_6_infant","rate":0.5,"description":"６歳未満の乳幼児又は著しく歯科診療が困難な者に対して、処置を行った場合は、全身麻酔 下で行った場合を除き、次に掲げる点数を、それぞれ当該処置の所定点数に加算する。ただし 、通則第８号又は第９号に掲げる"},{"type":"difficult_patient","rate":0.5,"description":"著しく歯科診療が困難な者に対して、処置を行った場合は、全身麻酔 下で行った場合を除き、次に掲げる点数を、それぞれ当該処置の所定点数に加算する。ただし 、通則第８号又は第９号に掲げる加算を算定する場合は"}],"time_based_additions":[{"type":"holiday","rate":1.6,"description":"休日に処置を行った場合又は処置の開始時間が保険医療機関の表示する診療時 間以外の時間若しくは深夜である場合は、次に掲げる点数を、それぞれ所定点数に加算した点 数により算定する。 イ 処置の所定点数が1"},{"type":"holiday","rate":0.8,"description":"休日加算２ 所定点数の100分の80に相当する点数"},{"type":"overtime","rate":0.8,"description":"時間外加算１（入院中の患者以外の患者に対して行われる場合に限る。） 所定点数の100分の80に相当する点数"},{"type":"overtime","rate":0.4,"description":"時間外加算２ 所定点数の100分の40に相当する点数"},{"type":"midnight","rate":1.6,"description":"深夜である場合は、次に掲げる点数を、それぞれ所定点数に加算した点 数により算定する。 イ 処置の所定点数が1,000点以上の場合であって、別に厚生労働大臣が定める施設基準に適 合しているものとして地方"},{"type":"midnight","rate":1.6,"description":"深夜加算１ 所定点数の100分の160に相当する点数"},{"type":"midnight","rate":0.8,"description":"深夜加算２ 所定点数の100分の80に相当する点数"}],"visit_based_additions":[{"type":"home_visit","rate":0.5,"description":"歯科訪問診療料を算定する患者であって、同注６に規定する加算 を算定しないものに対して、歯科訪問診療時に処置を行った場合は、次に掲げる点数を、それ ぞれ当該処置の所定点数に加算する。 イ 区分番号Ｉ００"},{"type":"home_visit","rate":0.5,"description":"歯科訪問診療料及び同注６に規定する加算を算定する患者に対し て、歯科訪問診療時に処置を行った場合は、次に掲げる点数を、それぞれ当該処置の所定点数 に加算する。 イ 処置（区分番号Ｉ００５（１及び２に限"}],"special_conditions":[]}}'::jsonb
WHERE name ILIKE '%う蝕%処置%' OR name ILIKE '%う窩%処置%';


-- =====================================================
-- 充填関連の詳細ルール
-- =====================================================

UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"addition_rules":{"age_based_additions":[{"type":"under_6_infant","rate":0.5,"description":"６歳未満の乳幼児又は著しく歯科診療が困難な者に対して、処置を行った場合は、全身麻酔 下で行った場合を除き、次に掲げる点数を、それぞれ当該処置の所定点数に加算する。ただし 、通則第８号又は第９号に掲げる"},{"type":"difficult_patient","rate":0.5,"description":"著しく歯科診療が困難な者に対して、処置を行った場合は、全身麻酔 下で行った場合を除き、次に掲げる点数を、それぞれ当該処置の所定点数に加算する。ただし 、通則第８号又は第９号に掲げる加算を算定する場合は"}],"time_based_additions":[{"type":"holiday","rate":1.6,"description":"休日に処置を行った場合又は処置の開始時間が保険医療機関の表示する診療時 間以外の時間若しくは深夜である場合は、次に掲げる点数を、それぞれ所定点数に加算した点 数により算定する。 イ 処置の所定点数が1"},{"type":"holiday","rate":0.8,"description":"休日加算２ 所定点数の100分の80に相当する点数"},{"type":"overtime","rate":0.8,"description":"時間外加算１（入院中の患者以外の患者に対して行われる場合に限る。） 所定点数の100分の80に相当する点数"},{"type":"overtime","rate":0.4,"description":"時間外加算２ 所定点数の100分の40に相当する点数"},{"type":"midnight","rate":1.6,"description":"深夜である場合は、次に掲げる点数を、それぞれ所定点数に加算した点 数により算定する。 イ 処置の所定点数が1,000点以上の場合であって、別に厚生労働大臣が定める施設基準に適 合しているものとして地方"},{"type":"midnight","rate":1.6,"description":"深夜加算１ 所定点数の100分の160に相当する点数"},{"type":"midnight","rate":0.8,"description":"深夜加算２ 所定点数の100分の80に相当する点数"}],"visit_based_additions":[{"type":"home_visit","rate":0.5,"description":"歯科訪問診療料を算定する患者であって、同注６に規定する加算 を算定しないものに対して、歯科訪問診療時に処置を行った場合は、次に掲げる点数を、それ ぞれ当該処置の所定点数に加算する。 イ 区分番号Ｉ００"},{"type":"home_visit","rate":0.5,"description":"歯科訪問診療料及び同注６に規定する加算を算定する患者に対し て、歯科訪問診療時に処置を行った場合は、次に掲げる点数を、それぞれ当該処置の所定点数 に加算する。 イ 処置（区分番号Ｉ００５（１及び２に限"}],"special_conditions":[]}}'::jsonb
WHERE name ILIKE '%充填%' OR name ILIKE '%CR%' OR name ILIKE '%レジン%充%';


-- =====================================================
-- 根管治療関連の詳細ルール
-- =====================================================

UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"addition_rules":{"age_based_additions":[{"type":"under_6_infant","rate":0.5,"description":"６歳未満の乳幼児又は著しく歯科診療が困難な者に対して、処置を行った場合は、全身麻酔 下で行った場合を除き、次に掲げる点数を、それぞれ当該処置の所定点数に加算する。ただし 、通則第８号又は第９号に掲げる"},{"type":"difficult_patient","rate":0.5,"description":"著しく歯科診療が困難な者に対して、処置を行った場合は、全身麻酔 下で行った場合を除き、次に掲げる点数を、それぞれ当該処置の所定点数に加算する。ただし 、通則第８号又は第９号に掲げる加算を算定する場合は"}],"time_based_additions":[{"type":"holiday","rate":1.6,"description":"休日に処置を行った場合又は処置の開始時間が保険医療機関の表示する診療時 間以外の時間若しくは深夜である場合は、次に掲げる点数を、それぞれ所定点数に加算した点 数により算定する。 イ 処置の所定点数が1"},{"type":"holiday","rate":0.8,"description":"休日加算２ 所定点数の100分の80に相当する点数"},{"type":"overtime","rate":0.8,"description":"時間外加算１（入院中の患者以外の患者に対して行われる場合に限る。） 所定点数の100分の80に相当する点数"},{"type":"overtime","rate":0.4,"description":"時間外加算２ 所定点数の100分の40に相当する点数"},{"type":"midnight","rate":1.6,"description":"深夜である場合は、次に掲げる点数を、それぞれ所定点数に加算した点 数により算定する。 イ 処置の所定点数が1,000点以上の場合であって、別に厚生労働大臣が定める施設基準に適 合しているものとして地方"},{"type":"midnight","rate":1.6,"description":"深夜加算１ 所定点数の100分の160に相当する点数"},{"type":"midnight","rate":0.8,"description":"深夜加算２ 所定点数の100分の80に相当する点数"}],"visit_based_additions":[{"type":"home_visit","rate":0.5,"description":"歯科訪問診療料を算定する患者であって、同注６に規定する加算 を算定しないものに対して、歯科訪問診療時に処置を行った場合は、次に掲げる点数を、それ ぞれ当該処置の所定点数に加算する。 イ 区分番号Ｉ００"},{"type":"home_visit","rate":0.5,"description":"歯科訪問診療料及び同注６に規定する加算を算定する患者に対し て、歯科訪問診療時に処置を行った場合は、次に掲げる点数を、それぞれ当該処置の所定点数 に加算する。 イ 処置（区分番号Ｉ００５（１及び２に限"}],"special_conditions":[]}}'::jsonb
WHERE name ILIKE '%根管%' OR name ILIKE '%感染根管%';


COMMIT;

-- 更新結果の確認
SELECT
  code,
  name,
  points,
  metadata->'detailed_rules' as detailed_rules,
  metadata->'addition_rules' as addition_rules
FROM treatment_codes
WHERE metadata->'detailed_rules' IS NOT NULL
ORDER BY code
LIMIT 20;
