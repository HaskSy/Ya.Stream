package com.gvsem.ya_stream.model.user;

public record UserDto (
        Long id,
        String yandexId,
        String token
) { }
