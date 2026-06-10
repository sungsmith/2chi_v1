package com.twochi.profile.portfolio.service;

import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.profile.portfolio.domain.PortfolioFile;
import com.twochi.profile.portfolio.repository.PortfolioFileRepository;
import com.twochi.profile.portfolio.storage.FileStorage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PortfolioFileService {

    private static final long MAX_SIZE = 10L * 1024 * 1024;
    private static final int MAX_COUNT = 10;
    private static final Map<String, String> EXT = Map.of(
        "application/pdf", "pdf", "image/png", "png", "image/jpeg", "jpg");

    private final PortfolioFileRepository repository;
    private final FileStorage storage;

    public PortfolioFile upload(Long userId, MultipartFile file) {
        String contentType = file.getContentType();
        String ext = contentType == null ? null : EXT.get(contentType);
        if (ext == null) throw new BusinessException(ErrorCode.UNSUPPORTED_FILE_TYPE);
        if (file.getSize() > MAX_SIZE) throw new BusinessException(ErrorCode.FILE_TOO_LARGE);
        if (repository.countByUserId(userId) >= MAX_COUNT) throw new BusinessException(ErrorCode.FILE_LIMIT_EXCEEDED);

        String objectKey = userId + "/" + UUID.randomUUID() + "." + ext;
        try {
            storage.put(objectKey, file.getInputStream(), file.getSize(), contentType);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR);
        }
        String filename = file.getOriginalFilename() == null ? ("portfolio." + ext) : file.getOriginalFilename();
        return repository.save(PortfolioFile.create(userId, filename, contentType, file.getSize(), objectKey, Instant.now()));
    }

    @Transactional(readOnly = true)
    public List<PortfolioFile> list(Long userId) {
        return repository.findAllByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public String downloadUrl(Long userId, Long id) {
        PortfolioFile f = findOwned(userId, id);
        return storage.presignedGetUrl(f.getObjectKey(), f.getFilename());
    }

    public void delete(Long userId, Long id) {
        PortfolioFile f = findOwned(userId, id);
        storage.remove(f.getObjectKey());
        repository.delete(f);
    }

    private PortfolioFile findOwned(Long userId, Long id) {
        return repository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.PORTFOLIO_FILE_NOT_FOUND));
    }
}
