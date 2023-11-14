package com.gvsem.ya_stream.model.event;

import com.gvsem.ya_stream.model.user.User;
import lombok.*;
import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;

import java.time.ZonedDateTime;

@Entity
@Table(name = "event")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter()
    private Long id;

    @Getter @Setter
    @CreatedDate
    @JoinColumn(updatable = false, nullable = false)
    private
    ZonedDateTime creationDate = ZonedDateTime.now();

    @Column(name = "type", nullable = false)
    @Getter() @Setter()
    private String type;

    @Getter() @Setter()
    @Column(name = "track_id", nullable = false)
    private String trackId;

    @Getter() @Setter()
    @Column(name = "timecode", nullable = false)
    private String timecode;

    @ManyToOne(optional = false)
    @JoinColumn(name="user_id")
    @Getter() @Setter()
    private User user;

}

