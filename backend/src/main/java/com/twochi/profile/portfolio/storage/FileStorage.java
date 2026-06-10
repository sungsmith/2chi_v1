package com.twochi.profile.portfolio.storage;

import java.io.InputStream;

public interface FileStorage {
    void put(String objectKey, InputStream data, long size, String contentType);
    String presignedGetUrl(String objectKey, String downloadFilename);
    void remove(String objectKey);
}
