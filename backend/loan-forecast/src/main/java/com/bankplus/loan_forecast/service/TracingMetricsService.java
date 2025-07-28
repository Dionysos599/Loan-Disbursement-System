package com.bankplus.loan_forecast.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class TracingMetricsService {
    
    private final Counter traceCounter;
    private final Counter spanCounter;
    private final Timer traceDurationTimer;
    private final Counter errorCounter;
    
    @Autowired
    public TracingMetricsService(MeterRegistry meterRegistry) {
        this.traceCounter = Counter.builder("tracing.traces.total")
                .description("Total number of traces")
                .tag("service", "loan-forecast-service")
                .register(meterRegistry);
                
        this.spanCounter = Counter.builder("tracing.spans.total")
                .description("Total number of spans")
                .tag("service", "loan-forecast-service")
                .register(meterRegistry);
                
        this.traceDurationTimer = Timer.builder("tracing.trace.duration")
                .description("Trace duration")
                .tag("service", "loan-forecast-service")
                .register(meterRegistry);
                
        this.errorCounter = Counter.builder("tracing.errors.total")
                .description("Total number of tracing errors")
                .tag("service", "loan-forecast-service")
                .register(meterRegistry);
    }
    
    public void recordTrace(String traceName) {
        traceCounter.increment();
        spanCounter.increment();
    }
    
    public void recordSpan(String spanName) {
        spanCounter.increment();
    }
    
    public void recordTraceDuration(long durationMs) {
        traceDurationTimer.record(durationMs, TimeUnit.MILLISECONDS);
    }
    
    public void recordError(String errorType) {
        errorCounter.increment();
    }
    
    public Timer.Sample startTimer() {
        return Timer.start();
    }
    
    public void stopTimer(Timer.Sample sample) {
        sample.stop(traceDurationTimer);
    }
} 