package com.gvsem.ya_stream.security;

import com.gvsem.ya_stream.model.user.User;
import com.gvsem.ya_stream.model.user.UserService;
import com.zaxxer.hikari.metrics.PoolStats;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
@Slf4j
public class XHeaderAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String xAuth = request.getHeader("Authorization");
        logger.info("login with header = " + xAuth);
        if (xAuth != null) {
            SecurityContextHolder.getContext().setAuthentication(new AnonymousAuthenticationToken(xAuth, xAuth, List.of(new SimpleGrantedAuthority("basic"))));
        }

        filterChain.doFilter(request, response);

    }

}
