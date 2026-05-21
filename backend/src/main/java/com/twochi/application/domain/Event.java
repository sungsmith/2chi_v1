package com.twochi.application.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "events")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "application_id", nullable = false)
    private Long applicationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EventType type;

    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(name = "event_time")
    private LocalTime eventTime;

    @Column(columnDefinition = "TEXT")
    private String memo;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static Event create(
        Long applicationId, EventType type, LocalDate eventDate,
        LocalTime eventTime, String memo, Instant now
    ) {
        Event e = new Event();
        e.applicationId = applicationId;
        e.type = type;
        e.eventDate = eventDate;
        e.eventTime = eventTime;
        e.memo = memo;
        e.createdAt = now;
        e.updatedAt = now;
        return e;
    }

    public void update(
        EventType type, LocalDate eventDate, LocalTime eventTime, String memo, Instant now
    ) {
        if (type != null) this.type = type;
        if (eventDate != null) this.eventDate = eventDate;
        if (eventTime != null) this.eventTime = eventTime;
        if (memo != null) this.memo = memo;
        this.updatedAt = now;
    }
}
