package com.gvsem.ya_stream.model.user;

import lombok.*;
import org.hibernate.Hibernate;

import jakarta.persistence.*;
import java.util.Objects;

@Getter
@Setter
@Builder
@Entity
@Table(
        name = "_user",
        uniqueConstraints = {
                @UniqueConstraint(name = "user_yandex_id_unique", columnNames = "yandex_id"),
                @UniqueConstraint(name = "user_yandex_token_unique", columnNames = "yandex_token"),
                @UniqueConstraint(name = "user_token_unique", columnNames = "token"),
        }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    @Column(name = "yandex_id", nullable = false)
    private String yandexId;

    @Column(name = "yandex_token", nullable = false)
    private String yandexToken;

    @Column(name = "token", nullable = false)
    private String token;

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
