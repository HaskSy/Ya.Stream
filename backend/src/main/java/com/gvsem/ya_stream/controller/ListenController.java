package com.gvsem.ya_stream.controller;

import com.gvsem.ya_stream.model.event.Event;
import com.gvsem.ya_stream.model.event.EventService;
import com.gvsem.ya_stream.model.user.User;
import com.gvsem.ya_stream.model.user.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;


import java.io.IOException;

import static org.springframework.http.HttpStatus.NOT_FOUND;


@Controller
public class ListenController {

    @Autowired
    EventService eventService;

    @Autowired
    UserService userService;

    @Autowired
    SseBus sseBus;

    @GetMapping(path = "/listen/{yandexLogin}", produces= MediaType.TEXT_EVENT_STREAM_VALUE)
    ResponseEntity<SseEmitter> listen(@PathVariable("yandexLogin") String yandexLogin) throws IOException {

        Event lastEvent = null;
        User user = null;
        if (yandexLogin.equals("demo")) {
            var emitter = new SseEmitter(-1L);
            sseBus.demo(emitter);
            return ResponseEntity.status(HttpStatus.OK).body(emitter);
        } else {
            user = userService.getUserByYandexLogin(yandexLogin).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
            lastEvent = eventService.lastEventOf(user).orElse(null);
        }

        var emitter = new SseEmitter(60000L);
        sseBus.subscribe(emitter, yandexLogin);

        if (lastEvent != null) {
            emitter.send(SseBus.eventAsString(lastEvent));
        }

        return ResponseEntity.status(HttpStatus.OK).body(emitter);
    }
}
