package com.bannana.recommendation.config;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * ODsay 호출용 executor. 참여자 3명 × 후보 8곳이면 24콜인데 순차로 돌리면 10초를 넘기기 쉬워서
 * 병렬로 돌리되, ODsay 쪽 부하와 호출량 제한을 감안해 동시 실행 수를 고정 풀로 묶어둔다.
 */
@Configuration
public class ExecutorConfig {

    @Bean(destroyMethod = "shutdown")
    public ExecutorService travelTimeExecutor(RecommendationProperties properties) {
        AtomicInteger counter = new AtomicInteger();
        ThreadFactory threadFactory = runnable -> {
            Thread thread = new Thread(runnable, "travel-time-" + counter.incrementAndGet());
            thread.setDaemon(true);
            return thread;
        };
        return Executors.newFixedThreadPool(properties.concurrency(), threadFactory);
    }
}
