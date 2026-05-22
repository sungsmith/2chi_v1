package com.twochi.application.repository;

import com.twochi.application.domain.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByApplicationIdOrderByEventDateAsc(Long applicationId);

    List<Event> findByApplicationIdInOrderByEventDateAsc(List<Long> applicationIds);

    @Query("""
        SELECT e FROM Event e
        WHERE e.applicationId IN :applicationIds
          AND e.eventDate >= :from
        ORDER BY e.eventDate ASC, e.eventTime ASC NULLS LAST
    """)
    List<Event> findUpcomingByApplicationIds(List<Long> applicationIds, LocalDate from);

    @Query("""
        SELECT e FROM Event e
        WHERE e.applicationId IN :applicationIds
          AND e.eventDate BETWEEN :from AND :to
        ORDER BY e.eventDate ASC, e.eventTime ASC NULLS LAST
    """)
    List<Event> findInRangeByApplicationIds(List<Long> applicationIds, LocalDate from, LocalDate to);

    /** Event 의 application_id 가 주어진 userId 의 application 소유인지 확인용 조회. */
    @Query("""
        SELECT e FROM Event e
        WHERE e.id = :id
          AND e.applicationId IN (SELECT a.id FROM Application a WHERE a.userId = :userId)
    """)
    Optional<Event> findByIdAndUserId(Long id, Long userId);
}
