package com.twochi.coverletter.service;

import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.coverletter.domain.CoverLetterMaster;
import com.twochi.coverletter.domain.CoverLetterMaster.ItemType;
import com.twochi.coverletter.dto.DeleteResult;
import com.twochi.coverletter.dto.MasterPatchRequest;
import com.twochi.coverletter.dto.MasterRequest;
import com.twochi.coverletter.repository.CoverLetterMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CoverLetterMasterService {

    private final CoverLetterMasterRepository repository;

    @Transactional(readOnly = true)
    public List<CoverLetterMaster> findAll(Long userId) {
        return repository.findAllByUserIdOrderByItemTypeAscIsDefaultDescUpdatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<CoverLetterMaster> findByItemType(Long userId, ItemType itemType) {
        return repository.findAllByUserIdAndItemTypeOrderByIsDefaultDescUpdatedAtDesc(userId, itemType);
    }

    @Transactional(readOnly = true)
    public CoverLetterMaster findOwned(Long userId, Long id) {
        return repository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.MASTER_NOT_FOUND));
    }

    public CoverLetterMaster create(Long userId, MasterRequest req) {
        Instant now = Instant.now();
        if (req.isDefault()) {
            repository.findFirstByUserIdAndItemTypeAndIsDefaultTrue(userId, req.itemType())
                .ifPresent(existing -> {
                    existing.unsetDefault(now);
                    repository.flush();  // uq_master_default 위반 방지: UPDATE 를 INSERT 전 강제
                });
        }
        CoverLetterMaster m = CoverLetterMaster.create(
            userId, req.itemType(), req.title(), req.masterAnswer(),
            req.charLimitHint(), req.isDefault(), now
        );
        return repository.save(m);
    }

    public CoverLetterMaster patch(Long userId, Long id, MasterPatchRequest req) {
        CoverLetterMaster m = findOwned(userId, id);
        Instant now = Instant.now();
        if (req.isDefault() != null) {
            if (req.isDefault() && !m.isDefault()) {
                repository.findFirstByUserIdAndItemTypeAndIsDefaultTrue(userId, m.getItemType())
                    .ifPresent(existing -> {
                        existing.unsetDefault(now);
                        repository.flush();
                    });
                m.setAsDefault(now);
            } else if (!req.isDefault() && m.isDefault()) {
                m.unsetDefault(now);
            }
        }
        m.update(
            req.title() != null ? req.title() : m.getTitle(),
            req.masterAnswer(),
            req.charLimitHint() != null ? req.charLimitHint() : m.getCharLimitHint(),
            now
        );
        return m;
    }

    public CoverLetterMaster copy(Long userId, Long id) {
        CoverLetterMaster src = findOwned(userId, id);
        String newTitle = (src.getTitle() != null ? src.getTitle() : "마스터") + " 사본";
        CoverLetterMaster copy = CoverLetterMaster.create(
            userId, src.getItemType(), newTitle, src.getMasterAnswer(),
            src.getCharLimitHint(), false,
            Instant.now()
        );
        return repository.save(copy);
    }

    public DeleteResult delete(Long userId, Long id) {
        CoverLetterMaster m = findOwned(userId, id);
        boolean wasDefault = m.isDefault();
        ItemType itemType = m.getItemType();
        repository.delete(m);
        if (!wasDefault) return new DeleteResult(null);
        return repository.findFirstByUserIdAndItemTypeOrderByUpdatedAtDesc(userId, itemType)
            .map(next -> {
                next.setAsDefault(Instant.now());
                return new DeleteResult(next.getId());
            })
            .orElse(new DeleteResult(null));
    }
}
