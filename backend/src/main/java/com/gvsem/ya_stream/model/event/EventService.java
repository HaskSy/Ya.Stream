package com.gvsem.ya_stream.model.event;

import com.gvsem.ya_stream.model.user.User;
import com.gvsem.ya_stream.model.user.UserRepository;
import com.gvsem.ya_stream.model.user.YandexUserDto;
import org.apache.tomcat.util.codec.binary.Base64;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.transaction.Transactional;
import javax.validation.constraints.NotNull;
import javax.ws.rs.NotAuthorizedException;
import java.util.Collections;
import java.util.Optional;
import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;

@Service
//@Transactional
public class EventService {

    @Autowired
    private EventRepository eventRepository;

    public Event submitEvent(@NotNull User user, @NotNull String type, @NotNull String trackId, @NotNull String timecode) {
        Event event = new Event();
        event.setUser(user);
        event.setType(type);
        event.setTrackId(trackId);
        event.setTimecode(timecode);
        return this.eventRepository.save(event);
    }

    public Optional<Event> lastEventOf(@NotNull User user) {
        return this.eventRepository.findTopByUserOrderByCreationDateDesc(user);
    }


}
