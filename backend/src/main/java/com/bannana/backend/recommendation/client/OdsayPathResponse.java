package com.bannana.backend.recommendation.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record OdsayPathResponse(List<Error> error, Result result) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Error(String code, String message, String msg) {
        public String text() {
            return message != null ? message : msg;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Result(List<Path> path) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Path(Info info) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Info(Integer totalTime) {
    }

    /** ODsay는 오류를 배열로 내려준다. 첫 번째 오류만 있으면 충분하다. */
    public Error firstError() {
        return (error == null || error.isEmpty()) ? null : error.get(0);
    }
}