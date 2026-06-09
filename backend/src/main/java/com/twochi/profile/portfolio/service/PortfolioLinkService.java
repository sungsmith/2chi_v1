package com.twochi.profile.portfolio.service;

import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.profile.portfolio.domain.PortfolioLink;
import com.twochi.profile.portfolio.dto.PortfolioLinkRequest;
import com.twochi.profile.portfolio.repository.PortfolioLinkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PortfolioLinkService {

    private final PortfolioLinkRepository repository;

    @Transactional(readOnly = true)
    public List<PortfolioLink> findAllByUserId(Long userId) {
        return repository.findAllByUserIdOrderByOrderIndexAsc(userId);
    }

    public PortfolioLink create(Long userId, PortfolioLinkRequest req) {
        int order = repository.findMaxOrderIndexByUserId(userId) + 1;
        PortfolioLink p = PortfolioLink.create(userId, req.kind(), req.title(), req.url(), order, Instant.now());
        return repository.save(p);
    }

    public PortfolioLink update(Long userId, Long id, PortfolioLinkRequest req) {
        PortfolioLink p = findOwned(userId, id);
        p.update(req.kind(), req.title(), req.url(), Instant.now());
        return p;
    }

    public void delete(Long userId, Long id) {
        PortfolioLink p = findOwned(userId, id);
        repository.delete(p);
    }

    private PortfolioLink findOwned(Long userId, Long id) {
        return repository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.PORTFOLIO_LINK_NOT_FOUND));
    }
}
