package com.twochi.user.service;

import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.user.domain.Profile;
import com.twochi.user.domain.User;
import com.twochi.user.dto.MeResponse;
import com.twochi.user.repository.ProfileRepository;
import com.twochi.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserQueryService {

    private static final String DEFAULT_PLAN = "free";

    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;

    public UserQueryService(ProfileRepository profileRepository, UserRepository userRepository) {
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public MeResponse buildMe(Long userId, String email, String nickname, String role) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHENTICATED));
        boolean completed = profileRepository.findById(userId)
            .map(Profile::isOnboardingCompleted)
            .orElse(false);
        return new MeResponse(
            userId,
            email,
            nickname,
            role,
            completed,
            user.getCreatedAt(),
            user.getPasswordChangedAt(),
            DEFAULT_PLAN
        );
    }
}
