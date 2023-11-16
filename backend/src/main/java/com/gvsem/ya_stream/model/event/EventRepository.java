package com.gvsem.ya_stream.model.event;

import com.gvsem.ya_stream.model.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {

    Optional<Event> findTopByUserOrderByCreationDateDesc(User user);

}
