package com.gvsem.ya_stream.model.user;

import lombok.extern.slf4j.Slf4j;
import org.apache.tomcat.util.codec.binary.Base64;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import javax.security.enterprise.credential.Password;
import javax.transaction.Transactional;
import javax.validation.constraints.NotNull;
import javax.ws.rs.NotAuthorizedException;
import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;
import java.time.Duration;

@Service
//@Transactional
@Slf4j
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public Optional<User> getUserByYandexId(Long yandexId) {
        return userRepository.findById(yandexId);
    }

    public Optional<User> getUserByYandexLogin(String yandexLogin) {
        return userRepository.findByYandexLogin(yandexLogin);
    }

    public Optional<User> authenticateByToken(String token) {
        return userRepository.findByToken(token);
    }


    public User authenticateByYandexToken(@NotNull String yandexToken) throws NotAuthorizedException {
        log.info("performing verification of yandex token");
        YandexUserDto yandexUser = verifyYandexUserIdentity(yandexToken).orElseThrow(() ->
                new ResponseStatusException(HttpStatusCode.valueOf(403), "Wrong yandex auth"));
        User user = this.getUserByYandexId(yandexUser.id()).orElse(null);
        if (user == null) {
            user = new User();
            user.setId(yandexUser.id());
            user.setYandexLogin(yandexUser.login());
        }
        user.setToken(generateAuthenticationToken(yandexToken));
        return userRepository.save(user);
    }

    private static String generateAuthenticationToken(String seed) {
        return new BCryptPasswordEncoder().encode(seed + ZonedDateTime.now());
    }

    private static synchronized Optional<YandexUserDto> verifyYandexUserIdentity(@NotNull String yandexToken) {
        log.info("Authenticating ya.id with token starting with " + yandexToken.substring(0, 10));
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
            var r = Optional.of(new YandexUserDto(json.getLong("id"), json.getString("login")));
            log.info("finished authentication, found: " + r.get().login());
            return r;
        } catch (JSONException e) {
            log.info("problems with response json", e);
            return Optional.empty();
        } catch (RestClientException e) {
            log.info("yandex request didn't finish normally", e);
            throw new ResponseStatusException(HttpStatusCode.valueOf(503), "Yandex identity failed to verify");
        }
    }


}
