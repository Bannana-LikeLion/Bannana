package com.bannana.backend.recommendation.domain;

/** 후보 지하철역. */
public record Station(String name, GeoPoint location) {
}
