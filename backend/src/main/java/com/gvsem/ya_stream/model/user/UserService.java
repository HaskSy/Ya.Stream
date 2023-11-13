package com.gvsem.ya_stream.model.user;

import lombok.RequiredArgsConstructor;
import org.springdoc.api.OpenApiResourceNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserDtoMapper userDtoMapper;

    UserDto getUserByYandexId(String yandexId) {
        return userRepository.findByYandexId(yandexId)
                .map(userDtoMapper)
                .orElseThrow(() -> new OpenApiResourceNotFoundException(
                        "User with yandexId [%s] not found".formatted(yandexId)
                ));
    }

}
