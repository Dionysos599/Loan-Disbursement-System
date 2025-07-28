package com.bankplus.loan_forecast.controller;

import com.bankplus.loan_forecast.dto.LoanForecastData;
import com.bankplus.loan_forecast.service.CsvProcessingService;
import com.bankplus.loan_forecast.service.LoanProcessingMetrics;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.Tracer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/loan-processing")
@Slf4j
public class LoanProcessingController {
    
    private final CsvProcessingService csvProcessingService;
    private final LoanProcessingMetrics metrics;
    private final Tracer tracer;
    
    @Autowired
    public LoanProcessingController(CsvProcessingService csvProcessingService, 
                                   LoanProcessingMetrics metrics,
                                   Tracer tracer) {
        this.csvProcessingService = csvProcessingService;
        this.metrics = metrics;
        this.tracer = tracer;
    }
    
    @PostMapping("/upload")
    public ResponseEntity<?> processLoanFile(@RequestParam("file") MultipartFile file) {
        // For tracing
        Span span = tracer.spanBuilder("loan-file-upload").startSpan();
            
        try (var scope = span.makeCurrent()) {
            log.info("Processing loan file: {}", file.getOriginalFilename());
            
            span.setAttribute("file.name", file.getOriginalFilename());
            span.setAttribute("file.size", file.getSize());
            
            // Validate file
            if (file.isEmpty()) {
                span.recordException(new IllegalArgumentException("File is empty"));
                return ResponseEntity.badRequest().body("File cannot be empty");
            }
            
            // Process CSV file
            var csvData = csvProcessingService.processCsvFile(file);
            List<LoanForecastData> result = csvProcessingService.convertToLoanForecastData(csvData, "2025-01");
            
            span.setAttribute("records.processed", result.size());
            
            log.info("File processed successfully, processed {} records", result.size());
            
            return ResponseEntity.ok(Map.of(
                "message", "File processed successfully",
                "recordsProcessed", result.size(),
                "activeBatches", metrics.getActiveBatchCount()
            ));
            
        } catch (Exception e) {
            span.recordException(e);
            log.error("File processing failed", e);
            return ResponseEntity.internalServerError().body("File processing failed: " + e.getMessage());
        } finally {
            span.end();
        }
    }
    
    @GetMapping("/process/{batchId}")
    public ResponseEntity<?> processLoanBatch(@PathVariable String batchId) {
        Span span = tracer.spanBuilder("loan-batch-processing").startSpan();
            
        try (var scope = span.makeCurrent()) {
            log.info("Processing loan batch: {}", batchId);
            
            span.setAttribute("batch.id", batchId);
            
            // Simulate calling other services
            // FileValidationResult validation = fileService.validateFile(batchId);
            // ForecastResult forecast = forecastService.calculate(batchId);
            // notificationService.sendCompletion(batchId);
            
            return ResponseEntity.ok(Map.of(
                "message", "Batch processed successfully",
                "batchId", batchId,
                "activeBatches", metrics.getActiveBatchCount()
            ));
            
        } catch (Exception e) {
            span.recordException(e);
            log.error("Batch processing failed", e);
            return ResponseEntity.internalServerError().body("Batch processing failed: " + e.getMessage());
        } finally {
            span.end();
        }
    }
    
    @GetMapping("/metrics")
    public ResponseEntity<?> getMetrics() {
        return ResponseEntity.ok(Map.of(
            "activeBatches", metrics.getActiveBatchCount(),
            "message", "Current system metrics"
        ));
    }
} 