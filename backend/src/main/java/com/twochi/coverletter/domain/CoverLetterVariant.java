package com.twochi.coverletter.domain;

import com.twochi.coverletter.domain.CoverLetterMaster.ItemType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

/**
 * 회사별 자소서 변형본. V1 Flyway schema 의 cover_letter_variant 매핑.
 * ai_draft / user_edit 는 MasterAnswerEncryptor 로 자동 암호화/복호화 (각각 별도 converter).
 * status: DRAFT (작성 중) / COMPLETED (완료).
 */
@Entity
@Table(name = "cover_letter_variant")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CoverLetterVariant {

    public enum Status { DRAFT, COMPLETED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "posting_id")
    private Long postingId;

    @Column(name = "analysis_id")
    private Long analysisId;

    @Column(name = "master_id")
    private Long masterId;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 50)
    private ItemType itemType;

    @Column(nullable = false, length = 500)
    private String question;

    @Column(name = "char_limit", nullable = false)
    private Integer charLimit;

    @Convert(converter = AiDraftConverter.class)
    @Column(name = "ai_draft", columnDefinition = "text")
    private String aiDraft;

    @Convert(converter = UserEditConverter.class)
    @Column(name = "user_edit", columnDefinition = "text")
    private String userEdit;

    @Column(name = "user_request", columnDefinition = "text")
    private String userRequest;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "validation_json", columnDefinition = "jsonb")
    private String validationJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    @Column(name = "ai_model", length = 50)
    private String aiModel;

    @Column(name = "ai_tokens_used")
    private Integer aiTokensUsed;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static CoverLetterVariant createDraft(
        Long userId, Long postingId, Long analysisId, ItemType itemType,
        String question, Integer charLimit, String aiDraft, String userRequest,
        String aiModel, Integer aiTokensUsed, Instant now
    ) {
        CoverLetterVariant v = new CoverLetterVariant();
        v.userId = userId;
        v.postingId = postingId;
        v.analysisId = analysisId;
        v.itemType = itemType;
        v.question = question;
        v.charLimit = charLimit;
        v.aiDraft = aiDraft;
        v.userEdit = aiDraft;          // 초안 생성 시 user_edit 도 초안과 동일 (사용자가 우측에서 곧장 편집 시작)
        v.userRequest = userRequest;
        v.status = Status.DRAFT;
        v.aiModel = aiModel;
        v.aiTokensUsed = aiTokensUsed;
        v.createdAt = now;
        v.updatedAt = now;
        return v;
    }

    public void update(String userEdit, String userRequest, String validationJson, Status status, Instant now) {
        if (userEdit != null) this.userEdit = userEdit;
        if (userRequest != null) this.userRequest = userRequest;
        if (validationJson != null) this.validationJson = validationJson;
        if (status != null) this.status = status;
        this.updatedAt = now;
    }
}
