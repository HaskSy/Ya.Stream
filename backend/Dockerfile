FROM gradle:8.4.0-jdk17-alpine AS cache
RUN mkdir -p /home/gradle/cache_home
ENV GRADLE_USER_HOME /home/gradle/cache_home
COPY build.gradle /home/gradle/src/
COPY src/main/resources/static/api /home/gradle/src/src/main/resources/static/api
WORKDIR /home/gradle/src/
RUN gradle clean build -i --stacktrace

FROM gradle:8.4.0-jdk17-alpine AS build
COPY --from=cache /home/gradle/cache_home /home/gradle/.gradle
COPY --chown=gradle:gradle . /home/gradle/src
WORKDIR /home/gradle/src
RUN gradle bootJar -x test --no-daemon

FROM openjdk:17-jdk-slim
RUN useradd -ms /bin/bash app

EXPOSE 7001
COPY --from=build /home/gradle/src/build/libs/*.jar /home/app/spring-boot-application.jar
RUN chown app:app /home/app/spring-boot-application.jar
RUN chmod 770 /home/app/spring-boot-application.jar

RUN cd /home/app

USER app
WORKDIR /home/app
ENTRYPOINT ["java", "-jar","/home/app/spring-boot-application.jar"]