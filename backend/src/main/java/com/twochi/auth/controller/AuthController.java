package com.twochi.auth.controller;

import com.twochi.auth.dto.SignupRequest;
import com.twochi.auth.dto.SignupResponse;
import com.twochi.auth.service.SignupService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final SignupService signupService;

    public AuthController(SignupService signupService) {
        this.signupService = signupService;
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
}
