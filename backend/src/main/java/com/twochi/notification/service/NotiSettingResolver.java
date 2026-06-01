package com.twochi.notification.service;

import com.twochi.notification.domain.NotificationType;
import com.twochi.user.domain.noti.NotiSettingDef;
import com.twochi.user.repository.UserNotiSettingRepository;
import org.springframework.stereotype.Service;

@Service
public class NotiSettingResolver {

    private final UserNotiSettingRepository repository;

    public NotiSettingResolver(UserNotiSettingRepository repository) {
        this.repository = repository;
    }

    /** 사용자가 해당 type 알림을 받기로 했는지. row 없으면 NotiSettingDef.defaultOn. */
    public boolean isEnabled(Long userId, NotificationType type) {
        String settingId = type.settingId();
        boolean defaultOn = NotiSettingDef.fromId(settingId).map(NotiSettingDef::defaultOn).orElse(false);
        return repository.findByUserIdAndSettingId(userId, settingId)
            .map(s -> s.isEnabled())
            .orElse(defaultOn);
    }
}
