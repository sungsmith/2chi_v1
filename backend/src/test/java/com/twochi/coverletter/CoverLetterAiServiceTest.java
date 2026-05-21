package com.twochi.coverletter;

import com.twochi.career.domain.Career;
import com.twochi.career.repository.CareerRepository;
import com.twochi.coverletter.domain.CoverLetterMaster.ItemType;
import com.twochi.coverletter.service.CoverLetterAiClient;
import com.twochi.coverletter.service.CoverLetterAiService;
import com.twochi.posting.domain.JobPosting;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class CoverLetterAiServiceTest {

    private CoverLetterAiClient client;
    private CareerRepository careerRepo;
    private CoverLetterAiService service;

    @BeforeEach
    void setUp() {
        client = mock(CoverLetterAiClient.class);
        careerRepo = mock(CareerRepository.class);
        service = new CoverLetterAiService(client, careerRepo);
    }

    @Test
    void generateDraft_buildsPrompt_includes_company_keywords_career_userRequest() {
        JobPosting posting = JobPosting.create(
            1L, JobPosting.Source.MANUAL,
            "(주)테크컴퍼니", "백엔드 개발자", "백엔드",
            "Spring·MSA 경험", "Kafka 우대", "API 설계",
            LocalDate.of(2026, 6, 30), null,
            new String[]{"Spring Boot", "MSA", "Kafka", "PostgreSQL"},
            Instant.now()
        );
        Career career = Career.create(
            1L, "(주)전직장", "백엔드",
            LocalDate.of(2023, 1, 1), LocalDate.of(2025, 12, 31),
            0, Instant.now()
        );
        when(careerRepo.findAllByUserIdOrderByOrderIndexDesc(1L)).thenReturn(List.of(career));
        when(client.generate(anyString())).thenReturn(
            new CoverLetterAiClient.Result("AI 초안 본문", "gpt-4o-mini", 1200)
        );

        var draft = service.generateDraft(
            1L, posting, ItemType.MOTIVATION,
            "우리 회사에 지원한 이유를 작성해주세요.", 500, "정량 강조"
        );

        ArgumentCaptor<String> promptCaptor = ArgumentCaptor.forClass(String.class);
        verify(client).generate(promptCaptor.capture());
        String prompt = promptCaptor.getValue();
        assertThat(prompt).contains("지원동기");
        assertThat(prompt).contains("우리 회사에 지원한 이유를 작성해주세요.");
        assertThat(prompt).contains("(주)테크컴퍼니");
        assertThat(prompt).contains("Spring Boot, MSA, Kafka, PostgreSQL");
        assertThat(prompt).contains("(주)전직장");
        assertThat(prompt).contains("정량 강조");
        assertThat(prompt).contains("500자 이내");

        assertThat(draft.text()).isEqualTo("AI 초안 본문");
        assertThat(draft.model()).isEqualTo("gpt-4o-mini");
        assertThat(draft.tokensUsed()).isEqualTo(1200);
    }

    @Test
    void generateDraft_clientThrows_propagates_AI_DRAFT_FAILED_BusinessException() {
        JobPosting posting = JobPosting.create(
            1L, JobPosting.Source.MANUAL, "X", "Y", null, null, null, null,
            null, null, new String[0], Instant.now()
        );
        when(careerRepo.findAllByUserIdOrderByOrderIndexDesc(anyLong())).thenReturn(List.of());
        when(client.generate(anyString())).thenThrow(new RuntimeException("network"));

        assertThatThrownBy(() ->
            service.generateDraft(1L, posting, ItemType.MOTIVATION, "Q", 500, null)
        )
        .isInstanceOf(com.twochi.common.exception.BusinessException.class)
        .hasMessageContaining("AI 초안 생성에 실패");
    }
}
