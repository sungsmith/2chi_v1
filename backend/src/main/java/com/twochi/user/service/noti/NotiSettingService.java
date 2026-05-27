package com.twochi.user.service.noti;

import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.user.domain.UserNotiSetting;
import com.twochi.user.domain.noti.NotiSettingDef;
import com.twochi.user.dto.NotiSettingItem;
import com.twochi.user.dto.NotiSettingsResponse;
import com.twochi.user.dto.UpdateNotiSettingsRequest;
import com.twochi.user.repository.UserNotiSettingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
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

    @Transactional
    public NotiSettingsResponse update(Long userId, List<UpdateNotiSettingsRequest.Item> overrides) {
        Instant now = Instant.now();

        // 1. 모든 항목 검증 — 하나라도 잘못되면 변경 없음
        for (UpdateNotiSettingsRequest.Item item : overrides) {
            NotiSettingDef def = NotiSettingDef.fromId(item.id())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNKNOWN_SETTING));
            if (def.locked()) {
                throw new BusinessException(ErrorCode.SETTING_LOCKED);
            }
        }

        // 2. 처리: default 와 같으면 row 삭제, 다르면 upsert
        for (UpdateNotiSettingsRequest.Item item : overrides) {
            NotiSettingDef def = NotiSettingDef.fromId(item.id()).orElseThrow();
            boolean enabled = item.enabled();
            if (enabled == def.defaultOn()) {
                repository.deleteByUserIdAndSettingId(userId, def.id());
            } else {
                UserNotiSetting existing = repository.findByUserIdAndSettingId(userId, def.id()).orElse(null);
                if (existing == null) {
                    repository.save(UserNotiSetting.of(userId, def.id(), enabled, now));
                } else {
                    existing.updateEnabled(enabled, now);
                    repository.save(existing);
                }
            }
        }

        return list(userId);
    }
}
