package com.gvsem.ya_stream.model.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByYandexLogin(String yandexLogin);

}
