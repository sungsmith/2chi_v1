package com.twochi.auth.controller;

import com.twochi.auth.dto.LoginRequest;
import com.twochi.auth.dto.LoginResponse;
import com.twochi.auth.dto.SignupRequest;
import com.twochi.auth.dto.SignupResponse;
import com.twochi.auth.service.LoginService;
import com.twochi.auth.service.SignupService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final SignupService signupService;
    private final LoginService loginService;

    private final String cookieName;
    private final boolean cookieSecure;
    private final String cookiePath;
    private final Duration cookieTtl;

    public AuthController(
        SignupService signupService,
        LoginService loginService,
        @Value("${app.refresh.cookie-name}") String cookieName,
        @Value("${app.refresh.cookie-secure}") boolean cookieSecure,
        @Value("${app.refresh.cookie-path}") String cookiePath,
        @Value("${app.refresh.ttl}") Duration cookieTtl
    ) {
        this.signupService = signupService;
        this.loginService = loginService;
        this.cookieName = cookieName;
        this.cookieSecure = cookieSecure;
        this.cookiePath = cookiePath;
        this.cookieTtl = cookieTtl;
    }

    @PostMapping("/signup")
    public ResponseEntity<SignupResponse> signup(
            @Valid @RequestBody SignupRequest req,
            HttpServletRequest httpReq
    ) {
        String ip = httpReq.getRemoteAddr();
        String ua = httpReq.getHeader("User-Agent");
        SignupResponse res = signupService.signup(req, ip, ua);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        LoginService.LoginResult result = loginService.login(req);
        ResponseCookie cookie = buildRefreshCookie(result.refreshToken(), cookieTtl);
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, cookie.toString())
            .body(result.response());
    }

    private ResponseCookie buildRefreshCookie(String value, Duration maxAge) {
        return ResponseCookie.from(cookieName, value)
            .httpOnly(true)
            .secure(cookieSecure)
            .sameSite("Strict")
            .path(cookiePath)
            .maxAge(maxAge)
            .build();
    }
}
