package com.twochi.posting.parser;

import com.twochi.common.exception.BusinessException;
import com.twochi.common.exception.ErrorCode;
import com.twochi.posting.dto.ParsedPosting;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostingParserService {

    private final List<PostingParser> parsers;

    public ParsedPosting parse(String urlString) {
        URI url;
        try {
            url = new URI(urlString);
        } catch (URISyntaxException e) {
            throw new BusinessException(ErrorCode.UNSUPPORTED_PARSE_SITE);
        }
        PostingParser parser = parsers.stream()
            .filter(p -> p.supports(url))
            .findFirst()
            .orElseThrow(() -> new BusinessException(ErrorCode.UNSUPPORTED_PARSE_SITE));
        try {
            return parser.parse(url);
        } catch (ParsingException e) {
            throw new BusinessException(ErrorCode.PARSE_FAILED);
        }
    }
}
