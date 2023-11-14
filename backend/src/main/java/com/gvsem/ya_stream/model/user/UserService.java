package com.gvsem.ya_stream.model.user;

import lombok.RequiredArgsConstructor;
import org.apache.tomcat.util.codec.binary.Base64;
import org.springdoc.api.OpenApiResourceNotFoundException;
import org.springframework.boot.configurationprocessor.json.JSONException;
import org.springframework.boot.configurationprocessor.json.JSONObject;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.validation.constraints.NotNull;
import javax.ws.rs.NotAuthorizedException;
import java.util.Collections;
import java.util.Optional;
import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public Optional<User> getUserByYandexLogin(String yandexLogin) {
        return userRepository.findByYandexLogin(yandexLogin);
    }

    public User authenticateByYandexToken(@NotNull String yandexToken) throws NotAuthorizedException {
        YandexUserDto yandexUser = verifyYandexUserIdentity(yandexToken).orElseThrow(() -> new NotAuthorizedException("Yandex identity failed to verify"));
        User user = userRepository.findById(yandexUser.id()).orElse(null);
        if (user == null) {
            user = new User();
            user.setId(yandexUser.id());
            user.setYandexLogin(yandexUser.login());
        }
        user.setToken(generateAuthenticationToken());
        return userRepository.save(user);
    }

    private static String generateAuthenticationToken() {
        Random random = ThreadLocalRandom.current();
        byte[] r = new byte[128];
        random.nextBytes(r);
        return Base64.encodeBase64String(r);
    }

    private Optional<YandexUserDto> verifyYandexUserIdentity(@NotNull String yandexToken) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            headers.add("Authorization", "OAuth " + yandexToken);
            HttpEntity<String> entity = new HttpEntity<>("parameters", headers);
            ResponseEntity<String> result = restTemplate.exchange("https://login.yandex.ru/info?format=json", HttpMethod.GET, entity, String.class);
            JSONObject json = new JSONObject(result.getBody());
            return Optional.of(new YandexUserDto(json.getLong("id"), json.getString("login")));
        } catch (JSONException e) {
            return Optional.empty();
        }
    }


}
