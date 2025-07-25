package com.bankplus.loan_forecast.controller;

import com.bankplus.loan_forecast.service.CsvProcessingService;
import com.bankplus.loan_forecast.service.ReactiveUploadService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

@TestConfiguration
public class TestConfig {
    @Bean
    public MeterRegistry meterRegistry() {
        return new SimpleMeterRegistry();
    }

    @Bean
    @Primary
    public CsvProcessingService csvProcessingService(MeterRegistry meterRegistry) {
        return new CsvProcessingService(meterRegistry);
    }

    @Bean
    public ReactiveUploadService reactiveUploadService() {
        return new ReactiveUploadService();
    }

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        return mapper;
    }
} 