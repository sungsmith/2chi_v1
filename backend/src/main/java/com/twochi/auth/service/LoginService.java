package com.twochi.auth.service;

import com.twochi.auth.dto.LoginRequest;
import com.twochi.auth.dto.LoginResponse;
import com.twochi.auth.jwt.JwtTokenProvider;
import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.user.domain.Profile;
import com.twochi.user.domain.User;
import com.twochi.user.repository.ProfileRepository;
import com.twochi.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

@Service
public class LoginService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final ProfileRepository profileRepository;

    public LoginService(UserRepository userRepository,
                        PasswordEncoder passwordEncoder,
                        JwtTokenProvider jwtTokenProvider,
                        RefreshTokenService refreshTokenService,
                        ProfileRepository profileRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.refreshTokenService = refreshTokenService;
        this.profileRepository = profileRepository;
    }

    public record LoginResult(LoginResponse response, String refreshToken) {}

    @Transactional(noRollbackFor = BusinessException.class)
    public LoginResult login(LoginRequest req) {
        Instant now = Instant.now();

        User user = userRepository.findByEmail(req.email())
            .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));

        if (user.getDeletedAt() != null) {
            Instant graceUntil = user.getDeletedAt().plus(java.time.Duration.ofDays(30));
            if (now.isBefore(graceUntil)) {
                throw new BusinessException(ErrorCode.USER_WITHDRAWN_GRACE);
            }
            throw new BusinessException(ErrorCode.USER_WITHDRAWN);
        }

        if (user.isLocked(now)) {
            throw lockedException(user, now);
        }

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            user.recordLoginFailure(now);
            userRepository.save(user);
            if (user.isLocked(now)) {
                throw lockedException(user, now);
            }
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        user.recordLoginSuccess(now);
        userRepository.save(user);

        String access = jwtTokenProvider.issue(user.getId(), user.getEmail(), user.getNickname(), user.getRole());
        String refresh = refreshTokenService.issue(user.getId());

        boolean onboardingCompleted = profileRepository.findById(user.getId())
            .map(Profile::isOnboardingCompleted)
            .orElse(false);
        LoginResponse response = new LoginResponse(
            access,
            new LoginResponse.UserPayload(user.getId(), user.getEmail(), user.getNickname(), onboardingCompleted)
        );
        return new LoginResult(response, refresh);
    }

    @Transactional
    public LoginResult refresh(String oldRefreshToken) {
        if (oldRefreshToken == null || oldRefreshToken.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        RefreshTokenService.RotateResult rotated = refreshTokenService.rotate(oldRefreshToken);

        User user = userRepository.findById(rotated.userId())
            .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN));

        if (user.getDeletedAt() != null) {
            throw new BusinessException(ErrorCode.USER_WITHDRAWN_GRACE);
        }

        String access = jwtTokenProvider.issue(user.getId(), user.getEmail(), user.getNickname(), user.getRole());

        boolean onboardingCompleted = profileRepository.findById(user.getId())
            .map(Profile::isOnboardingCompleted)
            .orElse(false);
        LoginResponse response = new LoginResponse(
            access,
            new LoginResponse.UserPayload(user.getId(), user.getEmail(), user.getNickname(), onboardingCompleted)
        );
        return new LoginResult(response, rotated.newToken());
    }

    private BusinessException lockedException(User user, Instant now) {
        return new BusinessException(
            ErrorCode.ACCOUNT_LOCKED,
            Map.of("retryAfterSeconds", user.retryAfterSeconds(now))
        );
    }
}
