package com.twochi.application.service;

import com.twochi.application.domain.Application;
import com.twochi.application.domain.Event;
import com.twochi.application.domain.EventType;
import com.twochi.application.repository.ApplicationRepository;
import com.twochi.application.repository.EventRepository;
import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EventService {

    private final ApplicationRepository applicationRepository;
    private final EventRepository eventRepository;

    public Event create(
        Long userId, Long applicationId,
        EventType type, LocalDate eventDate, LocalTime eventTime, String memo
    ) {
        Application app = applicationRepository.findByIdAndUserId(applicationId, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.APPLICATION_NOT_FOUND));
        Event event = Event.create(
            app.getId(), type, eventDate, eventTime, memo, Instant.now()
        );
        return eventRepository.save(event);
    }

    public Event patch(
        Long userId, Long eventId,
        EventType type, LocalDate eventDate, LocalTime eventTime, String memo
    ) {
        Event event = eventRepository.findByIdAndUserId(eventId, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.EVENT_NOT_FOUND));
        event.update(type, eventDate, eventTime, memo, Instant.now());
        return event;
    }

    public void delete(Long userId, Long eventId) {
        Event event = eventRepository.findByIdAndUserId(eventId, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.EVENT_NOT_FOUND));
        eventRepository.delete(event);
    }

    @Transactional(readOnly = true)
    public List<Event> findInRangeByUser(Long userId, LocalDate from, LocalDate to) {
        List<Long> appIds = applicationRepository.findByUserIdOrderByUpdatedAtDesc(userId)
            .stream().map(Application::getId).toList();
        if (appIds.isEmpty()) return List.of();
        return eventRepository.findInRangeByApplicationIds(appIds, from, to);
    }
}
