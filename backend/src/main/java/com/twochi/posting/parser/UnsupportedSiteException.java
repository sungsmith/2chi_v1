package com.twochi.posting.parser;

public class UnsupportedSiteException extends RuntimeException {
    public UnsupportedSiteException(String url) { super(url); }
}
