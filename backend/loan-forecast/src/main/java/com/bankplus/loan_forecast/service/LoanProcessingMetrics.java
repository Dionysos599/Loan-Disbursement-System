package com.bankplus.loan_forecast.service;

import io.micrometer.core.instrument.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@Slf4j
public class LoanProcessingMetrics {
    
    private final MeterRegistry registry;
    private final Timer processingTimer;
    private final Counter successCounter;
    private final Counter errorCounter;
    private final Gauge activeBatchesGauge;
    private final Counter recordsProcessedCounter;
    private final Gauge amountProcessedGauge;
    private final AtomicInteger activeBatchCount;
    
    @Autowired
    public LoanProcessingMetrics(MeterRegistry registry) {
        this.registry = registry;
        this.activeBatchCount = new AtomicInteger(0);
        
        // Processing duration
        this.processingTimer = Timer.builder("loan.processing.duration")
            .description("Loan processing duration")
            .tag("service", "forecast")
            .register(registry);
            
        // Success counter
        this.successCounter = Counter.builder("loan.processing.success")
            .description("Number of successful processing")
            .register(registry);
            
        // Error counter  
        this.errorCounter = Counter.builder("loan.processing.errors")
            .description("Number of processing errors")
            .tag("error.type", "unknown")
            .register(registry);
            
        // Real-time active batch count
        this.activeBatchesGauge = Gauge.builder("loan.batches.active", activeBatchCount, AtomicInteger::get)
            .description("Number of active batches")
            .register(registry);
            
        // Number of processed records
        this.recordsProcessedCounter = Counter.builder("loan.records.processed")
            .description("Number of processed loan records")
            .register(registry);
            
        // Processing amount - using dynamic gauge
        this.amountProcessedGauge = null; // We will use registry.gauge to dynamically update
    }
    
    public void onProcessingStart() {
        activeBatchCount.incrementAndGet();
        log.info("Processing started. Active batches: {}", activeBatchCount.get());
    }
    
    public void onProcessingComplete(long durationMs, int recordCount, BigDecimal totalAmount) {
        activeBatchCount.decrementAndGet();
        processingTimer.record(durationMs, java.util.concurrent.TimeUnit.MILLISECONDS);
        successCounter.increment();
        recordsProcessedCounter.increment(recordCount);
        
        // Update processing amount
        registry.gauge("loan.amount.processed", 
            totalAmount != null ? totalAmount.doubleValue() : 0.0);
        
        log.info("Processing completed. Duration: {}ms, Records: {}, Amount: {}, Active batches: {}", 
            durationMs, recordCount, totalAmount, activeBatchCount.get());
    }
    
    public void onProcessingError(String errorType, int batchSize) {
        activeBatchCount.decrementAndGet();
        errorCounter.increment();
        log.error("Processing error. Type: {}, Batch size: {}, Active batches: {}", 
            errorType, batchSize, activeBatchCount.get());
    }
    
    public Timer.Sample startTimer() {
        return Timer.start(registry);
    }
    
    public long recordProcessingTime(Timer.Sample sample) {
        return sample.stop(processingTimer);
    }
    
    public Timer getProcessingTimer() {
        return processingTimer;
    }
    
    public void incrementSuccess() {
        successCounter.increment();
    }
    
    public void incrementError(String errorType) {
        errorCounter.increment();
    }
    
    public void incrementRecordsProcessed(int count) {
        recordsProcessedCounter.increment(count);
    }
    
    public void updateAmountProcessed(BigDecimal amount) {
        if (amount != null) {
            registry.gauge("loan.amount.processed", amount.doubleValue());
        }
    }
    
    public int getActiveBatchCount() {
        return activeBatchCount.get();
    }
} 