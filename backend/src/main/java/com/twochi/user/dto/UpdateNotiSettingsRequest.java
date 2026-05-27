package com.twochi.user.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record UpdateNotiSettingsRequest(

    @NotNull
    @Valid
    List<Item> overrides

) {
    public record Item(
        @NotBlank String id,
        @NotNull Boolean enabled
    ) {}
}
