package com.twochi.profile.service;

import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.profile.dto.ProfileBasicUpdateRequest;
import com.twochi.profile.dto.ProfileResponse;
import com.twochi.user.domain.Profile;
import com.twochi.user.repository.ProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class ProfileBasicInfoService {

    private final ProfileRepository profileRepository;

    public ProfileBasicInfoService(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(Long userId) {
        Profile profile = profileRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.PROFILE_NOT_FOUND));
        return ProfileResponse.from(profile);
    }

    @Transactional
    public ProfileResponse updateBasicInfo(Long userId, ProfileBasicUpdateRequest req) {
        Profile profile = profileRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.PROFILE_NOT_FOUND));
        profile.updateBasicInfo(req.name(), req.birthDate(), req.phone(), req.region(), req.introduction(), Instant.now());
        return ProfileResponse.from(profile);
    }
}
