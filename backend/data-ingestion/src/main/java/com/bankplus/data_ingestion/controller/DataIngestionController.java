package com.bankplus.data_ingestion.controller;

import com.bankplus.data_ingestion.dto.DataIngestionResponse;
import com.bankplus.data_ingestion.dto.ForecastRequest;
import com.bankplus.data_ingestion.dto.LoanForecastData;
import com.bankplus.data_ingestion.model.CsvLoanData;
import com.bankplus.data_ingestion.service.CsvProcessingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/data-ingestion")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class DataIngestionController {

    private final CsvProcessingService csvProcessingService;

    @PostMapping("/upload")
    public ResponseEntity<DataIngestionResponse> uploadCsvFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("startMonth") String startMonth // 例如 "2024-11-01"
    ) {
        log.info("Received CSV file upload: {} with startMonth {}", file.getOriginalFilename(), startMonth);
        
        try {
            // Process the CSV file
            List<CsvLoanData> loanDataList = csvProcessingService.processCsvFile(file);
            
            // Convert to forecast data for each company, 传递预测起点
            List<LoanForecastData> forecastDataList = csvProcessingService.convertToLoanForecastData(loanDataList, startMonth);
            
            // Generate batch ID
            String batchId = csvProcessingService.generateBatchId();
            // 写入预测结果到Output目录
            csvProcessingService.writeForecastToCsv(forecastDataList, "CLL_report_113124_predicted.csv");
            // 生成预测CSV到forecast目录
            csvProcessingService.generateForecastCsv(forecastDataList, file.getOriginalFilename());
            // Create response
            DataIngestionResponse response = DataIngestionResponse.builder()
                    .batchId(batchId)
                    .status("SUCCESS")
                    .totalRecords(loanDataList.size())
                    .processedRecords(forecastDataList.size())
                    .failedRecords(loanDataList.size() - forecastDataList.size())
                    .processedAt(LocalDateTime.now())
                    .message("Successfully processed " + forecastDataList.size() + " loan records with forecast data")
                    .loanForecasts(forecastDataList)
                    .build();
            log.info("Successfully processed CSV file with batch ID: {} - {} companies with forecast data", 
                    batchId, forecastDataList.size());
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            log.error("Error processing CSV file: {}", e.getMessage());
            
            DataIngestionResponse errorResponse = DataIngestionResponse.builder()
                    .status("ERROR")
                    .totalRecords(0)
                    .processedRecords(0)
                    .failedRecords(0)
                    .processedAt(LocalDateTime.now())
                    .message("Failed to process CSV file: " + e.getMessage())
                    .build();
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/forecast")
    public ResponseEntity<?> generateForecast(@RequestBody ForecastRequest request) {
        log.info("Received forecast request for batch ID: {}", request.getBatchId());
        
        try {
            // TODO: Implement forecast generation logic
            // This will call the forecasting service to generate predictions
            
            return ResponseEntity.ok(Map.of(
                "batchId", request.getBatchId(),
                "status", "FORECAST_GENERATED",
                "message", "Forecast generation initiated successfully"
            ));
            
        } catch (Exception e) {
            log.error("Error generating forecast: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to generate forecast: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/status/{batchId}")
    public ResponseEntity<?> getProcessingStatus(@PathVariable String batchId) {
        log.info("Checking status for batch ID: {}", batchId);
        
        // TODO: Implement status checking logic
        // This will check the status of a batch processing job
        
        return ResponseEntity.ok(Map.of(
            "batchId", batchId,
            "status", "PROCESSING",
            "progress", 75
        ));
    }
} 