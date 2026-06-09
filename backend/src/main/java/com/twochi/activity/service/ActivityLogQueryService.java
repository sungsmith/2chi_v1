package com.twochi.activity.service;

import com.twochi.activity.domain.ActivityCategory;
import com.twochi.activity.domain.ActivityLog;
import com.twochi.activity.domain.ActivityType;
import com.twochi.activity.dto.ActivityItemResponse;
import com.twochi.activity.dto.ActivityListResponse;
import com.twochi.activity.repository.ActivityLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ActivityLogQueryService {

    private final ActivityLogRepository repository;

    public ActivityLogQueryService(ActivityLogRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public ActivityListResponse list(Long userId, ActivityCategory category, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size);
        Page<ActivityLog> result = (category == null)
            ? repository.findByUserIdOrderByOccurredAtDesc(userId, pageable)
            : repository.findByUserIdAndTypeInOrderByOccurredAtDesc(userId, typesOf(category), pageable);

        List<ActivityItemResponse> items = result.getContent().stream()
            .map(ActivityItemResponse::from).toList();

        return new ActivityListResponse(
            items, result.getTotalElements(), page, size, result.hasNext(), counts(userId));
    }

    private List<ActivityType> typesOf(ActivityCategory category) {
        return Arrays.stream(ActivityType.values())
            .filter(t -> t.category() == category).toList();
    }

    private Map<String, Long> counts(Long userId) {
        Map<ActivityCategory, Long> byCat = new EnumMap<>(ActivityCategory.class);
        for (ActivityCategory c : ActivityCategory.values()) byCat.put(c, 0L);
        for (var tc : repository.countByType(userId)) {
            ActivityCategory c = tc.getType().category();
            byCat.merge(c, tc.getCnt(), Long::sum);
        }
        Map<String, Long> out = new LinkedHashMap<>();
        for (var entry : byCat.entrySet()) out.put(entry.getKey().name(), entry.getValue());
        return out;
    }
}
