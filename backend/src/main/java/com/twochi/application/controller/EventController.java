package com.twochi.application.controller;

import com.twochi.application.domain.Application;
import com.twochi.application.domain.Event;
import com.twochi.application.dto.EventCreateRequest;
import com.twochi.application.dto.EventListItemResponse;
import com.twochi.application.dto.EventPatchRequest;
import com.twochi.application.dto.EventResponse;
import com.twochi.application.repository.ApplicationRepository;
import com.twochi.application.service.EventService;
import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final ApplicationRepository applicationRepository;

    @PostMapping("/api/v1/applications/{applicationId}/events")
    public ResponseEntity<EventResponse> create(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @PathVariable Long applicationId,
        @Valid @RequestBody EventCreateRequest req
    ) {
        Event e = eventService.create(
            principal.userId(), applicationId,
            req.type(), req.eventDate(), req.eventTime(), req.memo()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(EventResponse.from(e));
    }

    @PatchMapping("/api/v1/events/{id}")
    public ResponseEntity<EventResponse> patch(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @PathVariable Long id,
        @Valid @RequestBody EventPatchRequest req
    ) {
        Event e = eventService.patch(
            principal.userId(), id,
            req.type(), req.eventDate(), req.eventTime(), req.memo()
        );
        return ResponseEntity.ok(EventResponse.from(e));
    }

    @DeleteMapping("/api/v1/events/{id}")
    public ResponseEntity<Void> delete(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @PathVariable Long id
    ) {
        eventService.delete(principal.userId(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/v1/events")
    public ResponseEntity<List<EventListItemResponse>> list(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        List<Event> events = eventService.findInRangeByUser(principal.userId(), from, to);
        // application info 조인을 위해 application 사전 로드
        List<Long> appIds = events.stream().map(Event::getApplicationId).distinct().toList();
        Map<Long, Application> appMap = applicationRepository.findAllById(appIds).stream()
            .collect(Collectors.toMap(Application::getId, a -> a));
        return ResponseEntity.ok(events.stream()
            .map(e -> EventListItemResponse.of(e, appMap.get(e.getApplicationId())))
            .toList());
    }
}
