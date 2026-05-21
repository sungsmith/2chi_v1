package com.twochi.coverletter.repository;

import com.twochi.coverletter.domain.CoverLetterMaster;
import com.twochi.coverletter.domain.CoverLetterMaster.ItemType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CoverLetterMasterRepository extends JpaRepository<CoverLetterMaster, Long> {

    List<CoverLetterMaster> findAllByUserIdOrderByItemTypeAscIsDefaultDescUpdatedAtDesc(Long userId);

    List<CoverLetterMaster> findAllByUserIdAndItemTypeOrderByIsDefaultDescUpdatedAtDesc(
        Long userId, ItemType itemType
    );

    Optional<CoverLetterMaster> findByIdAndUserId(Long id, Long userId);

    Optional<CoverLetterMaster> findFirstByUserIdAndItemTypeAndIsDefaultTrue(
        Long userId, ItemType itemType
    );

    Optional<CoverLetterMaster> findFirstByUserIdAndItemTypeOrderByUpdatedAtDesc(
        Long userId, ItemType itemType
    );

    long countByUserIdAndItemType(Long userId, ItemType itemType);
}
