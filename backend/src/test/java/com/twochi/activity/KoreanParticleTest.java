package com.twochi.activity;

import com.twochi.activity.listener.KoreanParticle;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class KoreanParticleTest {
    @Test
    void 받침_없으면_로() {
        assertThat(KoreanParticle.ro("서류")).isEqualTo("로");   // 류: 받침 없음
        assertThat(KoreanParticle.ro("코테")).isEqualTo("로");
    }
    @Test
    void 받침_있으면_으로() {
        assertThat(KoreanParticle.ro("1차면접")).isEqualTo("으로"); // 접: 받침 ㅂ
        assertThat(KoreanParticle.ro("불합격")).isEqualTo("으로");   // 격: 받침 ㄱ
    }
    @Test
    void 빈문자_또는_null_이면_로() {
        assertThat(KoreanParticle.ro("")).isEqualTo("로");
        assertThat(KoreanParticle.ro(null)).isEqualTo("로");
    }
    @Test
    void ㄹ받침은_로() {
        // 'ㄹ' 받침은 '로' (예: 서울로)
        assertThat(KoreanParticle.ro("서울")).isEqualTo("로");
    }
}
