package com.gvsem.ya_stream.model.user;

import org.apache.tomcat.util.codec.binary.Base64;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import javax.transaction.Transactional;
import javax.validation.constraints.NotNull;
import javax.ws.rs.NotAuthorizedException;
import java.util.Collections;
import java.util.Optional;
import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;
import java.time.Duration;

@Service
@Transactional
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public Optional<User> getUserByYandexLogin(String yandexLogin) {
        return userRepository.findByYandexLogin(yandexLogin);
    }

    public Optional<User> authenticateByToken(String token) {
        return userRepository.findByToken(token);
    }

    public User authenticateByYandexToken(@NotNull String yandexToken) throws NotAuthorizedException {
        YandexUserDto yandexUser = verifyYandexUserIdentity(yandexToken).orElseThrow(() ->
                new ResponseStatusException(HttpStatusCode.valueOf(403), "Wrong yandex auth"));
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
            RestTemplateBuilder builder = new RestTemplateBuilder();
            builder.setConnectTimeout(Duration.ofMillis(500));
            builder.setReadTimeout(Duration.ofMillis(500));
            RestTemplate restTemplate = builder.build();
            HttpHeaders headers = new HttpHeaders();
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            headers.add("Authorization", "OAuth " + yandexToken);
            HttpEntity<String> entity = new HttpEntity<>("parameters", headers);
            ResponseEntity<String> result = restTemplate.exchange("https://login.yandex.ru/info?format=json", HttpMethod.GET, entity, String.class);
            JSONObject json = new JSONObject(result.getBody());
            return Optional.of(new YandexUserDto(json.getLong("id"), json.getString("login")));
        } catch (JSONException e) {
            e.printStackTrace();
            return Optional.empty();
        } catch (RestClientException e) {
            e.printStackTrace();
            throw new ResponseStatusException(HttpStatusCode.valueOf(503), "Yandex identity failed to verify");
        }
    }


}
