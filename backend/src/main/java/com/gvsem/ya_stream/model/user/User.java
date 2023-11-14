package com.gvsem.ya_stream.model.user;

import com.gvsem.ya_stream.model.event.Event;
import lombok.*;
import org.hibernate.Hibernate;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "_user")
public class User {

    public User() {

    }

    @Id
    @Column(name = "yandex_id", nullable = false)
    @Getter() @Setter()
    private Long id;

    @Column(name = "yandex_login", nullable = false)
    @Getter() @Setter()
    private String yandexLogin;

    @Getter() @Setter()
    @Column(name = "token", nullable = false)
    private String token;

    @OneToMany()
    @Getter() @Setter()
    private List<Event> events = new ArrayList<>();

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        User that = (User) o;
        return id != null && Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

}
