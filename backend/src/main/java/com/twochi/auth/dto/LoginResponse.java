package com.twochi.auth.dto;

public record LoginResponse(String accessToken, UserPayload user) {
    public record UserPayload(Long userId, String email, String nickname) {}
}
