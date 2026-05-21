package com.twochi.posting.parser;

import com.twochi.posting.dto.ParsedPosting;

import java.net.URI;

public interface PostingParser {
    boolean supports(URI url);
    ParsedPosting parse(URI url);
}
