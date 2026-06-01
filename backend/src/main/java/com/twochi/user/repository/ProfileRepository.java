package com.twochi.user.repository;

import com.twochi.user.domain.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProfileRepository extends JpaRepository<Profile, Long> {

    List<Profile> findByOnboardingCompletedTrue();
}
