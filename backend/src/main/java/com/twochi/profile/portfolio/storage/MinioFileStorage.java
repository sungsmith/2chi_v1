package com.twochi.profile.portfolio.storage;

import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.http.Method;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Component
public class MinioFileStorage implements FileStorage {

    private final MinioClient client;
    private final String bucket;

    public MinioFileStorage(MinioClient client, @Value("${minio.bucket}") String bucket) {
        this.client = client;
        this.bucket = bucket;
    }

    @Override
    public void put(String objectKey, InputStream data, long size, String contentType) {
        try {
            client.putObject(PutObjectArgs.builder()
                .bucket(bucket).object(objectKey)
                .stream(data, size, -1)
                .contentType(contentType)
                .build());
        } catch (Exception e) {
            throw new RuntimeException("파일 저장에 실패했어요.", e);
        }
    }

    @Override
    public String presignedGetUrl(String objectKey, String downloadFilename) {
        String encoded = URLEncoder.encode(downloadFilename, StandardCharsets.UTF_8).replace("+", "%20");
        String disposition = "attachment; filename*=UTF-8''" + encoded;
        try {
            return client.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                .method(Method.GET)
                .bucket(bucket).object(objectKey)
                .expiry(5, TimeUnit.MINUTES)
                .extraQueryParams(Map.of("response-content-disposition", disposition))
                .build());
        } catch (Exception e) {
            throw new RuntimeException("다운로드 URL 생성에 실패했어요.", e);
        }
    }

    @Override
    public void remove(String objectKey) {
        try {
            client.removeObject(RemoveObjectArgs.builder().bucket(bucket).object(objectKey).build());
        } catch (Exception e) {
            throw new RuntimeException("파일 삭제에 실패했어요.", e);
        }
    }
}
