package com.twochi.company.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.twochi.career.domain.Career;
import com.twochi.career.repository.CareerRepository;
import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
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

class AnalysisAiServiceTest {

    private AnalysisAiClient client;
    private CareerRepository careerRepo;
    private AnalysisAiService service;

    @BeforeEach
    void setUp() {
        client = mock(AnalysisAiClient.class);
        careerRepo = mock(CareerRepository.class);
        service = new AnalysisAiService(client, careerRepo, new ObjectMapper());
    }

    @Test
    void generate_buildsPrompt_includes_company_dart_scraped_career() {
        Career career = Career.create(
            1L, "(주)전직장", "백엔드",
            LocalDate.of(2023, 1, 1), LocalDate.of(2025, 12, 31),
            0, Instant.now()
        );
        when(careerRepo.findAllByUserIdOrderByOrderIndexDesc(1L)).thenReturn(List.of(career));
        when(client.generate(anyString())).thenReturn(
            new AnalysisAiClient.Result(
                "{\"talent_profile\":[\"고객 중심\",\"데이터 기반\"],\"action_points\":[\"포인트1\",\"포인트2\"]}",
                "gpt-4o-mini", 800
            )
        );

        DartFacts dart = new DartFacts("결제·정산 SaaS",
            List.of("TC-Pay", "TC-Settle"), "380억", 120, "서울 강남구", "http://...");

        var result = service.generate(1L, "(주)테크컴퍼니", dart, List.of("홈페이지 본문 abc"));

        ArgumentCaptor<String> promptCaptor = ArgumentCaptor.forClass(String.class);
        verify(client).generate(promptCaptor.capture());
        String prompt = promptCaptor.getValue();
        assertThat(prompt).contains("(주)테크컴퍼니");
        assertThat(prompt).contains("결제·정산 SaaS");
        assertThat(prompt).contains("TC-Pay, TC-Settle");
        assertThat(prompt).contains("380억");
        assertThat(prompt).contains("120명");
        assertThat(prompt).contains("서울 강남구");
        assertThat(prompt).contains("홈페이지 본문 abc");
        assertThat(prompt).contains("(주)전직장");

        assertThat(result.talentProfile()).containsExactly("고객 중심", "데이터 기반");
        assertThat(result.actionPoints()).containsExactly("포인트1", "포인트2");
        assertThat(result.model()).isEqualTo("gpt-4o-mini");
        assertThat(result.tokensUsed()).isEqualTo(800);
    }

    @Test
    void generate_parses_codeblock_wrapped_json() {
        when(careerRepo.findAllByUserIdOrderByOrderIndexDesc(anyLong())).thenReturn(List.of());
        when(client.generate(anyString())).thenReturn(
            new AnalysisAiClient.Result(
                "```json\n{\"talent_profile\":[\"A\"],\"action_points\":[\"B\"]}\n```",
                "gpt-4o-mini", 100
            )
        );

        var result = service.generate(1L, "X", DartFacts.unknown(), List.of());

        assertThat(result.talentProfile()).containsExactly("A");
        assertThat(result.actionPoints()).containsExactly("B");
    }

    @Test
    void generate_invalid_json_throws_ANALYSIS_GENERATION_FAILED() {
        when(careerRepo.findAllByUserIdOrderByOrderIndexDesc(anyLong())).thenReturn(List.of());
        when(client.generate(anyString())).thenReturn(
            new AnalysisAiClient.Result("not a json at all", "gpt-4o-mini", 50)
        );

        assertThatThrownBy(() -> service.generate(1L, "X", DartFacts.unknown(), List.of()))
            .isInstanceOfSatisfying(BusinessException.class, ex ->
                assertThat(ex.code()).isEqualTo(ErrorCode.ANALYSIS_GENERATION_FAILED));
    }

    @Test
    void generate_client_throws_propagates_ANALYSIS_GENERATION_FAILED() {
        when(careerRepo.findAllByUserIdOrderByOrderIndexDesc(anyLong())).thenReturn(List.of());
        when(client.generate(anyString())).thenThrow(new RuntimeException("network"));

        assertThatThrownBy(() -> service.generate(1L, "X", DartFacts.unknown(), List.of()))
            .isInstanceOfSatisfying(BusinessException.class, ex ->
                assertThat(ex.code()).isEqualTo(ErrorCode.ANALYSIS_GENERATION_FAILED));
    }
}
