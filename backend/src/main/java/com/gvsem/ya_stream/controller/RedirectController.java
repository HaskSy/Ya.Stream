package com.gvsem.ya_stream.controller;

import com.gvsem.ya_stream.model.user.User;
import com.gvsem.ya_stream.model.user.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletResponse;
import javax.transaction.Transactional;
import javax.validation.constraints.NotNull;

@Controller
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
