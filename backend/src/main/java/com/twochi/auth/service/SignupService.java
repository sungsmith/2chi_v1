package com.twochi.auth.service;

import com.twochi.auth.dto.SignupRequest;
import com.twochi.auth.dto.SignupResponse;
import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.consent.domain.ConsentLog;
import com.twochi.consent.domain.ConsentType;
import com.twochi.consent.repository.ConsentLogRepository;
import com.twochi.user.domain.User;
import com.twochi.user.repository.UserRepository;
import com.twochi.auth.event.UserSignedUpEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SignupService {

    private static final String CONSENT_VERSION = "v0.1";

    private final UserRepository userRepository;
    private final ConsentLogRepository consentLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;

    public SignupService(UserRepository userRepository,
                         ConsentLogRepository consentLogRepository,
                         PasswordEncoder passwordEncoder,
                         ApplicationEventPublisher eventPublisher) {
        this.userRepository = userRepository;
        this.consentLogRepository = consentLogRepository;
        this.passwordEncoder = passwordEncoder;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public SignupResponse signup(SignupRequest req, String ip, String userAgent) {
        if (!Boolean.TRUE.equals(req.ageConfirmed())) {
            throw new BusinessException(ErrorCode.AGE_NOT_CONFIRMED);
        }
        if (!Boolean.TRUE.equals(req.consents().terms()) || !Boolean.TRUE.equals(req.consents().privacy())) {
            throw new BusinessException(ErrorCode.REQUIRED_CONSENT_MISSING);
        }

        if (userRepository.existsByEmailAndDeletedAtIsNull(req.email())) {
            throw new BusinessException(ErrorCode.EMAIL_DUPLICATE);
        }
        if (userRepository.existsByNicknameAndDeletedAtIsNull(req.nickname())) {
            throw new BusinessException(ErrorCode.NICKNAME_DUPLICATE);
        }

        String hash = passwordEncoder.encode(req.password());
        User user = userRepository.save(User.createEmailUser(req.email(), hash, req.nickname()));

        consentLogRepository.save(ConsentLog.record(user.getId(), ConsentType.TERMS,     req.consents().terms(),     CONSENT_VERSION, ip, userAgent));
        consentLogRepository.save(ConsentLog.record(user.getId(), ConsentType.PRIVACY,   req.consents().privacy(),   CONSENT_VERSION, ip, userAgent));
        consentLogRepository.save(ConsentLog.record(user.getId(), ConsentType.MARKETING, req.consents().marketing(), CONSENT_VERSION, ip, userAgent));

        eventPublisher.publishEvent(new UserSignedUpEvent(user.getId()));

        return new SignupResponse(user.getId(), user.getEmail(), user.getNickname());
    }
}
