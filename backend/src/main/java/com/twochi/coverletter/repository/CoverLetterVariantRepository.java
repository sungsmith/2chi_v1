package com.twochi.coverletter.repository;

import com.twochi.coverletter.domain.CoverLetterVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

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
}
