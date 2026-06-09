package com.twochi.activity.listener;

public final class KoreanParticle {
    private KoreanParticle() {}

    /** 끝 글자 받침에 따라 "로"(받침 없음/ㄹ) 또는 "으로"(그 외) 반환 */
    public static String ro(String word) {
        if (word == null || word.isEmpty()) return "로";
        char last = word.charAt(word.length() - 1);
        if (last < 0xAC00 || last > 0xD7A3) return "로"; // 한글 음절 아님
        int jong = (last - 0xAC00) % 28;
        if (jong == 0) return "로";   // 받침 없음
        if (jong == 8) return "로";   // ㄹ 받침
        return "으로";
    }
}
