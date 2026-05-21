-- (user_id, company) UNIQUE. 재분석은 in-place 갱신.
-- 기존 V1 의 idx_analysis_user_company 는 일반 인덱스이므로 별도 unique 추가.
CREATE UNIQUE INDEX uq_company_analysis_user_company
  ON company_analysis (user_id, company);
