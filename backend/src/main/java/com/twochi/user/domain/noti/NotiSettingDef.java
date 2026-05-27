package com.twochi.user.domain.noti;

import java.util.Optional;

/**
 * 알림 설정 정의 — frontend mock NOTI_SETTINGS_MOCK 과 1:1 대응.
 * `id` 는 FE 와 합의된 stable key (DB 의 setting_id 컬럼 값).
 */
public enum NotiSettingDef {

    DEADLINE_D3("deadline-d3", "전형 일정 · 마감", "채용공고 마감 D-3", "마감 3일 전 09:00에 받기", true, false),
    DEADLINE_D1("deadline-d1", "전형 일정 · 마감", "채용공고 마감 D-1", "마감 1일 전 09:00에 받기", true, false),
    INTERVIEW_D1("interview-d1", "전형 일정 · 마감", "면접·일정 D-1", "등록한 일정 하루 전 09:00에 받기", true, false),
    CL_UNSUBMITTED("cl-unsubmitted", "전형 일정 · 마감", "자소서 저장 후 미제출 7일", "저장하고 제출하지 않은 자소서가 있을 때", false, false),

    WEEKLY_SUMMARY("weekly-summary", "제품 안내", "주간 요약", "이번 주 자소서·지원 현황 요약 (매주 월요일 09:00)", false, false),
    NEW_FEATURE("new-feature", "제품 안내", "신기능 안내", "새로 추가된 기능·업데이트 소식", true, false),
    EVENT_PROMO("event-promo", "제품 안내", "이벤트 · 프로모션", "할인·이벤트 안내", false, false),

    SIGNUP_VERIFY("signup-verify", "계정 보안", "회원가입 인증", "가입 직후 이메일 인증 코드 발송", true, true),
    PW_RESET("pw-reset", "계정 보안", "비밀번호 재설정", "비밀번호 재설정 요청 시 발송", true, true),
    NEW_DEVICE("new-device", "계정 보안", "새 기기 로그인 감지", "등록되지 않은 기기에서 로그인 시 안내", true, true),

    CHANNEL_EMAIL("channel-email", "알림 채널", "이메일 알림", "가장 안정적인 채널 · 발송 후 30일간 보관", true, false),
    CHANNEL_PUSH("channel-push", "알림 채널", "웹푸시 알림", "브라우저 알림 권한이 필요해요", false, false);

    private final String id;
    private final String category;
    private final String label;
    private final String description;
    private final boolean defaultOn;
    private final boolean locked;

    NotiSettingDef(String id, String category, String label, String description, boolean defaultOn, boolean locked) {
        this.id = id;
        this.category = category;
        this.label = label;
        this.description = description;
        this.defaultOn = defaultOn;
        this.locked = locked;
    }

    public String id() { return id; }
    public String category() { return category; }
    public String label() { return label; }
    public String description() { return description; }
    public boolean defaultOn() { return defaultOn; }
    public boolean locked() { return locked; }

    public static Optional<NotiSettingDef> fromId(String id) {
        for (NotiSettingDef d : values()) {
            if (d.id.equals(id)) return Optional.of(d);
        }
        return Optional.empty();
    }
}
