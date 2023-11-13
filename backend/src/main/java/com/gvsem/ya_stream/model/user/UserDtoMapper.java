package com.gvsem.ya_stream.model.user;

import org.springframework.stereotype.Service;

import java.util.function.Function;

@Service
public class UserDtoMapper implements Function<User, UserDto> {
    @Override
    public UserDto apply(User user) {
        return new UserDto(user.getId(), user.getYandexId(), user.getToken());
    }

}
