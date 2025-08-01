package com.bankplus.loan_forecast.controller;

import com.bankplus.loan_forecast.service.CsvProcessingService;
import com.bankplus.loan_forecast.service.LoanProcessingMetrics;
import com.bankplus.loan_forecast.service.ReactiveUploadService;
import com.bankplus.loan_forecast.service.TracingMetricsService;
import com.bankplus.loan_forecast.service.algorithm.AlgorithmFactory;
import com.bankplus.loan_forecast.service.algorithm.SimpleForecastAlgorithm;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import io.opentelemetry.api.trace.Tracer;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.mockito.Mockito;

@TestConfiguration
public class TestConfig {
    @Bean
    public MeterRegistry meterRegistry() {
        return new SimpleMeterRegistry();
    }

    @Bean
    public LoanProcessingMetrics loanProcessingMetrics(MeterRegistry meterRegistry) {
        return new LoanProcessingMetrics(meterRegistry);
    }

    @Bean
    public SimpleForecastAlgorithm simpleForecastAlgorithm() {
        return new SimpleForecastAlgorithm();
    }

    @Bean
    public AlgorithmFactory algorithmFactory(SimpleForecastAlgorithm simpleAlgorithm) {
        return new AlgorithmFactory(simpleAlgorithm);
    }

    @Bean
    @Primary
    public CsvProcessingService csvProcessingService(LoanProcessingMetrics loanProcessingMetrics, 
                                                   AlgorithmFactory algorithmFactory) {
        return new CsvProcessingService(loanProcessingMetrics, algorithmFactory);
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

    @Bean
    public Tracer tracer() {
        return Mockito.mock(Tracer.class);
    }
    
    @Bean
    public TracingMetricsService tracingMetricsService(MeterRegistry meterRegistry) {
        return new TracingMetricsService(meterRegistry);
    }
} 