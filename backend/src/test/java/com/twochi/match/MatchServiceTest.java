package com.twochi.match;

import com.twochi.match.dto.DashboardMatchResponse;
import com.twochi.match.service.MatchService;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class MatchServiceTest {

    @Test
    void matchOne_퍼센트와_미스_계산() {
        String corpus = "spring redis 결제 정산 경험".toLowerCase();
        MatchService.MatchOutcome o = MatchService.matchOne(corpus,
            new String[]{"Spring", "Redis", "Kafka", "MSA"});
        assertThat(o.matched()).isEqualTo(2);
        assertThat(o.total()).isEqualTo(4);
        assertThat(o.missing()).containsExactly("Kafka", "MSA");
    }

    @Test
    void matchOne_빈키워드_무시() {
        MatchService.MatchOutcome o = MatchService.matchOne("spring",
            new String[]{"Spring", "", null});
        assertThat(o.total()).isEqualTo(1);
        assertThat(o.matched()).isEqualTo(1);
    }

    @Test
    void aggregateDashboard_평균퍼센트와_gaps_랭킹() {
        String corpus = "spring 경험";
        var p1 = MatchService.matchOne(corpus, new String[]{"Spring", "Kafka"});
        var p2 = MatchService.matchOne(corpus, new String[]{"Kafka", "MSA"});
        DashboardMatchResponse r = MatchService.aggregate(java.util.List.of(p1, p2));
        assertThat(r.percent()).isEqualTo(25);
        assertThat(r.postingCount()).isEqualTo(2);
        assertThat(r.gaps()).hasSize(2);
        assertThat(r.gaps().get(0).keyword()).isEqualTo("Kafka");
        assertThat(r.gaps().get(0).hitCount()).isEqualTo(2);
        assertThat(r.gaps().get(1).keyword()).isEqualTo("MSA");
    }

    @Test
    void aggregateDashboard_빈입력_0() {
        DashboardMatchResponse r = MatchService.aggregate(java.util.List.of());
        assertThat(r.percent()).isEqualTo(0);
        assertThat(r.postingCount()).isEqualTo(0);
        assertThat(r.gaps()).isEmpty();
    }

    @Test
    void gaps_동률은_사전순() {
        var p1 = MatchService.matchOne("", new String[]{"Beta", "Alpha"});
        DashboardMatchResponse r = MatchService.aggregate(java.util.List.of(p1));
        assertThat(r.gaps().get(0).keyword()).isEqualTo("Alpha");
        assertThat(r.gaps().get(1).keyword()).isEqualTo("Beta");
    }
}
