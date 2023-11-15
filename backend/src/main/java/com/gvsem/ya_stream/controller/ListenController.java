package com.gvsem.ya_stream.controller;

import com.gvsem.ya_stream.model.user.User;
import com.gvsem.ya_stream.model.user.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import javax.transaction.Transactional;

import static org.springframework.http.HttpStatus.NOT_FOUND;


@RestController()
@Transactional
public class ListenController {

    @Autowired
    UserService userService;

    @Autowired
    SseBus sseBus;

    @GetMapping(path = "/listen/{yandexLogin}", produces= MediaType.TEXT_EVENT_STREAM_VALUE)
    ResponseEntity<SseEmitter> listen(@PathVariable("yandexLogin") String yandexLogin) {
        User user = userService.getUserByYandexLogin(yandexLogin).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
        var emitter = new SseEmitter(-1L);
        sseBus.subscribe(emitter, yandexLogin);
        return ResponseEntity.status(HttpStatus.OK).body(emitter);
    }
}
