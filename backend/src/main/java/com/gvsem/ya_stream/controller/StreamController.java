package com.gvsem.ya_stream.controller;

import com.gvsem.ya_stream.api.StreamApiDelegate;
import com.gvsem.ya_stream.model.event.Event;
import com.gvsem.ya_stream.model.event.EventService;
import com.gvsem.ya_stream.model.user.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import javax.transaction.Transactional;
import javax.validation.constraints.NotNull;
import javax.ws.rs.QueryParam;


@Controller
public class StreamController {

    @Autowired
    private EventService eventService;

    @Autowired
    private SseBus sseBus;


    @GetMapping("/stream")
    public ResponseEntity<Void> streamGet(@NotNull @QueryParam("event") String event, @NotNull @QueryParam("track_id") String track_id, @QueryParam("position") String position) throws Exception {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication instanceof AnonymousAuthenticationToken) || !(authentication.getPrincipal() instanceof User)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Your token is not provided or expired");
        }

        User user = (User) authentication.getPrincipal();
        Event e = eventService.submitEvent(user, event, track_id, position);
        sseBus.send(e, user);
        return ResponseEntity.status(201).body(null);
    }
}
