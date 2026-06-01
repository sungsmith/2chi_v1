package com.twochi.coverletter.repository;

import com.twochi.coverletter.domain.CoverLetterVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CoverLetterVariantRepository extends JpaRepository<CoverLetterVariant, Long> {

    @Query("""
        SELECT v FROM CoverLetterVariant v
        WHERE v.userId = :userId AND v.deletedAt IS NULL
        ORDER BY v.postingId ASC NULLS LAST, v.updatedAt DESC
    """)
    List<CoverLetterVariant> findAllActiveByUserId(Long userId);

    Optional<CoverLetterVariant> findByIdAndUserIdAndDeletedAtIsNull(Long id, Long userId);

    long countByUserIdAndPostingIdAndDeletedAtIsNull(Long userId, Long postingId);

    long countByUserIdAndStatusAndUpdatedAtBetweenAndDeletedAtIsNull(
        Long userId, CoverLetterVariant.Status status, Instant from, Instant to);

    @Query("""
        SELECT v.id AS variantId, v.userId AS userId, p.company AS company
        FROM CoverLetterVariant v JOIN JobPosting p ON v.postingId = p.id
        WHERE v.status = com.twochi.coverletter.domain.CoverLetterVariant.Status.DRAFT
          AND v.deletedAt IS NULL
          AND v.postingId IS NOT NULL
          AND p.deadline >= :today
          AND v.updatedAt <= :staleBefore
    """)
    List<UnsubmittedRow> findUnsubmittedBefore(LocalDate today, Instant staleBefore);

    interface UnsubmittedRow {
        Long getVariantId();
        Long getUserId();
        String getCompany();
    }
}
