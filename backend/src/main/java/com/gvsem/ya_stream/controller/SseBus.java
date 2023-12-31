package com.gvsem.ya_stream.controller;

import com.gvsem.ya_stream.model.event.Event;
import com.gvsem.ya_stream.model.user.User;
import org.json.JSONObject;
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

    private final Map<String, Set<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(SseEmitter emitter, String yandexLogin) {
        if (!emitters.containsKey(yandexLogin)) {
            emitters.put(yandexLogin, Collections.synchronizedSet(new HashSet<>()));
        }

        System.out.println("new subscriber for: " + yandexLogin);

        emitters.get(yandexLogin).add(emitter);

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

    public void demo(SseEmitter emitter) {

        System.out.println("new demo");

        emitter.onTimeout(emitter::complete);

        User demoUser = new User();
        demoUser.setId(1L);
        demoUser.setYandexLogin("demo");
        (new Thread(() -> {
            try {
                Thread.sleep(1000);
                emitter.send(eventAsString(Event.play(demoUser, "23157104:106317038", "120")));
                Thread.sleep(11000);
                emitter.send(eventAsString(Event.play(demoUser, "5551948:42125196", "169")));
                Thread.sleep(11000);
                emitter.send(eventAsString(Event.play(demoUser, "3369429:28192686", "160")));
                Thread.sleep(16000);
                emitter.send(eventAsString(Event.stop(demoUser, "3369429:28192686", "160")));
            } catch (InterruptedException | IOException e) {
                throw new RuntimeException(e);
            }
        })).start();
    }


    public static String eventAsString(Event event) {
        JSONObject object = new JSONObject();
        object.put("event", event.getType());
        object.put("track_id", event.getTrackId());
        object.put("position", event.getTimecode());
        object.put("timestamp", event.getCreationDate().format(DateTimeFormatter.ISO_ZONED_DATE_TIME));
        return object.toString();
    }

}
