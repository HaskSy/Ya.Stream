package com.gvsem.ya_stream.controller;

import com.gvsem.ya_stream.model.event.Event;
import com.gvsem.ya_stream.model.event.EventService;
import com.gvsem.ya_stream.model.user.User;
import com.gvsem.ya_stream.model.user.UserService;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Component
public class SseBus {

    @Autowired
    EventService eventService;

    @Autowired
    UserService userService;

    private final Map<String, Set<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(SseEmitter emitter, String yandexLogin) {
        if (!emitters.containsKey(yandexLogin)) {
            emitters.put(yandexLogin, Collections.synchronizedSet(new HashSet<>()));
        }

        System.out.println("new subscriber for: " + yandexLogin);

        emitters.get(yandexLogin).add(emitter);

        userService.getUserByYandexLogin(yandexLogin).ifPresent((user) -> {
            eventService.lastEventOf(user).ifPresent((event) -> {
                try {
                    emitter.send(eventAsString(event));
                } catch (IOException ignored) {
                }
            });
        });


        emitter.onCompletion(() -> {
            this.emitters.get(yandexLogin).remove(emitter);
        });
        emitter.onTimeout(() -> {
            emitter.complete();
            this.emitters.get(yandexLogin).remove(emitter);
        });
        return emitter;
    }

    private final ExecutorService cachedThreadPool = Executors.newCachedThreadPool();

    public void send(Event event, User user) {
        System.out.println("going to broadcast from user: " + user.getYandexLogin() + " for " + this.emitters.getOrDefault(user.getYandexLogin(), new HashSet<>()).size());
        List<SseEmitter> failedEmitters = new ArrayList<>();
        var es = this.emitters.get(user.getYandexLogin());
        if (es == null) {
            return;
        }
        es.forEach(emitter -> {
            cachedThreadPool.execute(() -> {
                try {
                    emitter.send(eventAsString(event));
                } catch (Exception e) {
                    emitter.completeWithError(e);
                    failedEmitters.add(emitter);
                }
            });
        });
        failedEmitters.forEach(this.emitters.get(user.getYandexLogin())::remove);
    }

    private String eventAsString(Event event) {
        JSONObject object = new JSONObject();
        object.put("event", event.getType());
        object.put("track_id", event.getTrackId());
        object.put("position", event.getTimecode());
        object.put("timestamp", event.getCreationDate().format(DateTimeFormatter.ISO_ZONED_DATE_TIME));
        return object.toString();
    }

}
