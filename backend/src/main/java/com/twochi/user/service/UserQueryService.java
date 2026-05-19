package com.twochi.user.service;

import com.twochi.user.domain.Profile;
import com.twochi.user.dto.MeResponse;
import com.twochi.user.repository.ProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserQueryService {

    private final ProfileRepository profileRepository;

    public UserQueryService(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    @Transactional(readOnly = true)
    public MeResponse buildMe(Long userId, String email, String nickname, String role) {
        boolean completed = profileRepository.findById(userId)
            .map(Profile::isOnboardingCompleted)
            .orElse(false);
        return new MeResponse(userId, email, nickname, role, completed);
    }
}
