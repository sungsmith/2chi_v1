package com.twochi.user.repository;

import com.twochi.user.domain.UserNotiSetting;
import com.twochi.user.domain.UserNotiSettingId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserNotiSettingRepository extends JpaRepository<UserNotiSetting, UserNotiSettingId> {

    List<UserNotiSetting> findAllByUserId(Long userId);

    Optional<UserNotiSetting> findByUserIdAndSettingId(Long userId, String settingId);

    void deleteByUserIdAndSettingId(Long userId, String settingId);
}
