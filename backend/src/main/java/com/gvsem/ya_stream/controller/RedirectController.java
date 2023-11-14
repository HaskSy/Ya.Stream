package com.gvsem.ya_stream.controller;

import com.gvsem.ya_stream.model.user.User;
import com.gvsem.ya_stream.model.user.UserService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.configurationprocessor.json.JSONException;
import org.springframework.boot.configurationprocessor.json.JSONObject;
import org.springframework.data.repository.query.Param;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.view.RedirectView;

import javax.validation.constraints.NotNull;
import javax.ws.rs.BadRequestException;
import javax.ws.rs.NotAuthorizedException;
import java.io.IOException;
import java.util.Collections;

@RestController
@RequestMapping("/auth/")
public class RedirectController {

    @Autowired
    UserService userService;

    @GetMapping("/redirect")
    RedirectView redirect(@NotNull @RequestParam("access_token") String token) {
        User user = this.userService.authenticateByYandexToken(token);
        return new RedirectView("/finalredirect.html?token=" + user.getToken());
    }

}
