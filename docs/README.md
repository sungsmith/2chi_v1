# docs/ — 학습·포트폴리오·이슈 기록

CLAUDE.md §5에 정의된 학습·포트폴리오 자료 보관 디렉토리. Claude Code가 매 작업마다 자동 참조하지 않으며, 필요 시 명시적으로 첨부하거나 작업 종료 시 사용자가 요청해 기록한다.

## 폴더 구성

| 폴더 | 용도 | 파일 명명 |
|---|---|---|
| `issues/` | 트러블슈팅·에러 추적 (재현·원인·해결·학습 4단) | `NNNN-snake-case-제목.md` |
| `learning/` | 학습 노트 (개념·적용·함정) | `주제-한글-또는-영문.md` |
| `portfolio/` | 정량 성과 모음 (PRAR 형식, 자소서·면접에 그대로 활용) | `achievements.md` (누적 파일) |
| `devlog/` | (선택) 일/주 단위 개발 일지 | `YYYY-MM-DD.md` 또는 `YYYY-WNN.md` |

각 폴더에 `TEMPLATE.md`가 있어 신규 항목 작성 시 복사해서 사용한다.

```bash
# 새 이슈 기록 예
cp docs/issues/TEMPLATE.md docs/issues/0002-jpa-n-plus-one.md
```

## 메타데이터 권장 연결

기록 시 다음 필드를 가능한 한 채워두면 자소서 작성·회고에 재활용이 쉽다.

- **역량 ID**: `docs/_refs/competency_matrix_v0.1.json` (또는 outputs/csv/) 의 `BE-XXX-NNN` 형식
- **자소서 항목 후보**: `MOTIVATION` / `FUTURE_PLAN` / `TEAMWORK` / `CONFLICT` / `ACHIEVEMENT` / `PROBLEM_SOLVING` / `STRENGTH` / `WEAKNESS` / `OTHER`
- **직군 권장 구조**: `PRAR`(백엔드) / `UX-Driven`(프론트) / `Ops-Result`(인프라) / `Design Thinking`(디자이너)

## Claude Code 활용 패턴

작업 종료 시 다음과 같이 요청하면 Claude Code가 본 템플릿에 맞춰 자동 정리한다.

- *"방금 해결한 N+1 쿼리 문제를 `docs/issues/`에 ISSUE 템플릿으로 기록해줘. 역량 매트릭스에서 관련 ID도 매칭해줘."*
- *"오늘 LCP 개선 작업을 `docs/portfolio/achievements.md`에 PRAR 형식으로 추가. `outputs/csv/competency_matrix_v0.1.json`에서 관련 역량 ID 매핑."*
- *"이번 주 `docs/issues/`와 `docs/portfolio/` 추가분을 모아 주간 회고 1장으로 정리. `docs/devlog/2026-W21.md`로 저장."*

## 자소서·이력 활용 워크플로

1. 개발 중 정량 성과 발생 → 즉시 `portfolio/achievements.md`에 PRAR 형식으로 기록
2. 이슈 해결 후 → `issues/NNNN-*.md`에 4단 기록, 자소서 후보 메타 함께
3. 학습이 있을 때 → `learning/*.md`에 개념·적용·함정 정리
4. 분기/연간 회고 → 모든 성과 모아 카탈로그화
5. 이직 시 → 2chi 서비스의 마스터 자소서 입력으로 그대로 활용 (도그푸딩)
