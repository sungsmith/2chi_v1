package com.twochi.user.service.noti;

import com.twochi.user.domain.UserNotiSetting;
import com.twochi.user.domain.noti.NotiSettingDef;
import com.twochi.user.dto.NotiSettingItem;
import com.twochi.user.dto.NotiSettingsResponse;
import com.twochi.user.repository.UserNotiSettingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class NotiSettingService {

    private final UserNotiSettingRepository repository;

    public NotiSettingService(UserNotiSettingRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public NotiSettingsResponse list(Long userId) {
        Map<String, Boolean> overrides = new HashMap<>();
        for (UserNotiSetting s : repository.findAllByUserId(userId)) {
            overrides.put(s.getSettingId(), s.isEnabled());
        }

        List<NotiSettingItem> items = new ArrayList<>();
        for (NotiSettingDef def : NotiSettingDef.values()) {
            boolean enabled = def.locked()
                ? def.defaultOn()                                       // locked 는 override 불가, 항상 default
                : overrides.getOrDefault(def.id(), def.defaultOn());
            items.add(new NotiSettingItem(def.id(), def.category(), def.label(), def.description(), enabled, def.locked()));
        }
        return new NotiSettingsResponse(items);
    }
}
