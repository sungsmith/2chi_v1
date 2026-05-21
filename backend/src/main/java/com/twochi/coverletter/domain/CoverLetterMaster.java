package com.twochi.coverletter.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * 마스터 자소서. V1 Flyway schema 의 cover_letter_master 매핑.
 * master_answer 는 MasterAnswerConverter 로 자동 암호화/복호화.
 */
@Entity
@Table(name = "cover_letter_master")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CoverLetterMaster {

    public enum ItemType {
        MOTIVATION, FUTURE_PLAN, TEAMWORK, CONFLICT,
        ACHIEVEMENT, PROBLEM_SOLVING, STRENGTH, WEAKNESS, OTHER
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 50)
    private ItemType itemType;

    @Column(length = 200)
    private String title;

    @Convert(converter = MasterAnswerConverter.class)
    @Column(name = "master_answer", nullable = false, columnDefinition = "text")
    private String masterAnswer;

    @Column(name = "char_limit_hint")
    private Integer charLimitHint;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static CoverLetterMaster create(
        Long userId, ItemType itemType, String title, String masterAnswer,
        Integer charLimitHint, boolean isDefault, Instant now
    ) {
        CoverLetterMaster m = new CoverLetterMaster();
        m.userId = userId;
        m.itemType = itemType;
        m.title = title;
        m.masterAnswer = masterAnswer;
        m.charLimitHint = charLimitHint;
        m.isDefault = isDefault;
        m.createdAt = now;
        m.updatedAt = now;
        return m;
    }

    public void update(String title, String masterAnswer, Integer charLimitHint, Instant now) {
        this.title = title;
        if (masterAnswer != null) this.masterAnswer = masterAnswer;
        this.charLimitHint = charLimitHint;
        this.updatedAt = now;
    }

    public void setAsDefault(Instant now) {
        this.isDefault = true;
        this.updatedAt = now;
    }

    public void unsetDefault(Instant now) {
        this.isDefault = false;
        this.updatedAt = now;
    }
}
