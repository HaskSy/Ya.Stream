package com.gvsem.ya_stream.controller;

import com.gvsem.ya_stream.model.event.Event;
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
        if (yandexLogin.equals("demo")) {
            User demoUser = new User();
            demoUser.setId(1L);
            demoUser.setYandexLogin("demo");
            (new Thread(() -> {
                try {
                    Thread.sleep(1000);
                    sseBus.send(Event.play(demoUser, "23157104:106317038", "120"), demoUser);
                    Thread.sleep(11000);
                    sseBus.send(Event.play(demoUser, "5551948:42125196", "169"), demoUser);
                    Thread.sleep(11000);
                    sseBus.send(Event.play(demoUser, "3369429:28192686", "150"), demoUser);
                    Thread.sleep(25000);
                    sseBus.send(Event.stop(demoUser, "3369429:28192686", "0"), demoUser);
                } catch (InterruptedException e) {
                    throw new RuntimeException(e);
                }
            })).start();
        } else {
            userService.getUserByYandexLogin(yandexLogin).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
        }

        var emitter = new SseEmitter(-1L);
        sseBus.subscribe(emitter, yandexLogin);
        return ResponseEntity.status(HttpStatus.OK).body(emitter);
    }
}
