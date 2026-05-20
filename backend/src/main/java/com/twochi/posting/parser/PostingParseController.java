package com.twochi.posting.parser;

import com.twochi.auth.jwt.JwtAuthenticationFilter.AuthenticatedUser;
import com.twochi.posting.dto.ParsedPosting;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/postings/parse")
@RequiredArgsConstructor
public class PostingParseController {

    private final PostingParserService parserService;

    public record ParseRequest(@NotBlank String url) {}

    @PostMapping
    public ResponseEntity<ParsedPosting> parse(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @Valid @RequestBody ParseRequest req
    ) {
        ParsedPosting result = parserService.parse(req.url());
        return ResponseEntity.ok(result);
    }
}
