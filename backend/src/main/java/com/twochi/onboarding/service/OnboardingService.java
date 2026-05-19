package com.twochi.onboarding.service;

import com.twochi.onboarding.dto.OnboardingRequest;
import com.twochi.onboarding.dto.OnboardingResponse;
import com.twochi.user.domain.Profile;
import com.twochi.user.repository.ProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class OnboardingService {

    private final ProfileRepository profileRepository;

    public OnboardingService(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    @Transactional
    public OnboardingResponse upsert(Long userId, OnboardingRequest req) {
        Instant now = Instant.now();
        short year = req.careerYear().shortValue();

        Profile profile = profileRepository.findById(userId)
            .map(existing -> {
                existing.updateFromOnboarding(req.target(), year, req.targetJobs(), now);
                return existing;
            })
            .orElseGet(() -> profileRepository.save(
                Profile.create(userId, req.target(), year, req.targetJobs(), now)
            ));

        return new OnboardingResponse(
            userId,
            profile.getTarget(),
            (int) profile.getCareerYear(),
            profile.targetJobs(),
            profile.isOnboardingCompleted()
        );
    }
}
