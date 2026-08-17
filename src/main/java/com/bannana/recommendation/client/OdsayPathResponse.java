package com.bannana.recommendation.client;

import java.util.List;

/**
 * ODsay 대중교통 경로검색(searchPubTransPathT) 응답.
 * ODsay는 오류도 HTTP 200 + 본문의 error 필드로 내려주기 때문에 error를 반드시 확인해야 한다.
 * 오류 메시지 필드명이 버전에 따라 message / msg로 갈려서 둘 다 받는다.
 */
public record OdsayPathResponse(Error error, Result result) {

    public record Error(String code, String message, String msg) {
        public String text() {
            return message != null ? message : msg;
        }
    }

    public record Result(List<Path> path) {
    }

    public record Path(Info info) {
    }

    public record Info(Integer totalTime) {
    }
}
