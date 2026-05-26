import { Bell } from "@/components/ui/icons";
import { NotiSettingsRow } from "./noti-settings-row";
import type { NotiSettingItem } from "@/lib/mock/mypage";

interface NotiSettingsViewProps {
  items: NotiSettingItem[];
}

// Group items by category, preserving insertion order
function groupByCategory(items: NotiSettingItem[]): Map<string, NotiSettingItem[]> {
  const map = new Map<string, NotiSettingItem[]>();
  for (const item of items) {
    const group = map.get(item.category) ?? [];
    group.push(item);
    map.set(item.category, group);
  }
  return map;
}

const CATEGORY_SUB: Record<string, string | undefined> = {
  "전형 일정 · 마감": "채용공고와 면접 일정 관련 알림",
  "계정 보안": "중요 안내라 끌 수 없어요",
  "알림 채널": "받고 싶은 채널을 골라주세요",
};

export function NotiSettingsView({ items }: NotiSettingsViewProps) {
  const groups = groupByCategory(items);

  return (
    <>
      <section className="mp-head">
        <h1>알림 설정</h1>
        <div className="sub">받고 싶은 알림 채널과 카테고리를 카테고리별로 정리할 수 있어요.</div>
      </section>

      {/* Web-push banner — static default state (BE 부재, 인터랙션 disabled) */}
      <div className="push-card">
        <span className="ico"><Bell size={24} /></span>
        <div className="body">
          <span className="ttl">웹푸시 알림을 켜시겠어요?</span>
          <span className="desc">
            마감 임박 알림과 면접 일정을 브라우저에서 바로 받아볼 수 있어요.
            브라우저 권한 동의 한 번이면 됩니다.
          </span>
        </div>
        <div className="actions">
          <button className="btn ghost sm" disabled>나중에</button>
          <button className="btn primary sm" disabled>
            <Bell size={12} /> 권한 요청하기
          </button>
        </div>
      </div>

      {/* Category sections */}
      {Array.from(groups.entries()).map(([category, categoryItems]) => (
        <section key={category} className="mp-section">
          <div className="sec-head">
            <span className="sec-title">{category}</span>
            {CATEGORY_SUB[category] && (
              <span className="sec-sub">{CATEGORY_SUB[category]}</span>
            )}
          </div>
          {categoryItems.map((item) => (
            <NotiSettingsRow
              key={item.id}
              nm={item.label}
              desc={item.description}
              defOn={item.defaultOn}
              locked={item.locked}
            />
          ))}
        </section>
      ))}
    </>
  );
}
