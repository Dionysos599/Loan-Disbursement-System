package com.bankplus.loan_forecast.controller;

import com.bankplus.loan_forecast.dto.DataIngestionResponse;
import com.bankplus.loan_forecast.dto.LoanForecastData;
import com.bankplus.loan_forecast.model.UploadHistory;
import com.bankplus.loan_forecast.repository.UploadHistoryRepository;
import com.bankplus.loan_forecast.service.CsvProcessingService;
import com.bankplus.loan_forecast.service.ReactiveUploadService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import reactor.core.publisher.Mono;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/loan-forecast")
@Slf4j
@CrossOrigin(origins = "*")
public class LoanForecastController {

    @Autowired
    private CsvProcessingService csvProcessingService;

    @Autowired
    private UploadHistoryRepository uploadHistoryRepository;

    @Autowired
    private ReactiveUploadService reactiveUploadService;

    @Autowired
    private ObjectMapper objectMapper;

    @PostMapping("/upload")
    public Mono<ResponseEntity<DataIngestionResponse>> uploadCsvFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("startMonth") String startMonth
    ) {
        log.info("Received CSV file upload: {} with startMonth {}", file.getOriginalFilename(), startMonth);

        String batchId = csvProcessingService.generateBatchId();
        UploadHistory uploadHistory = new UploadHistory();
        uploadHistory.setBatchId(batchId);
        uploadHistory.setOriginalFilename(file.getOriginalFilename());
        uploadHistory.setFileSize(file.getSize());
        uploadHistory.setUploadStatus("PROCESSING");
        uploadHistory.setForecastStartDate(startMonth);
        uploadHistory.setUploadedAt(Instant.now());
        try {
            String inputDir = new java.io.File("backend/data/Input/").getAbsoluteFile().toString();
            java.nio.file.Files.createDirectories(java.nio.file.Paths.get(inputDir));
            String savedFileName = batchId + "_" + file.getOriginalFilename();
            java.nio.file.Path savedFilePath = java.nio.file.Paths.get(inputDir, savedFileName);
            try (java.io.InputStream in = file.getInputStream()) {
                java.nio.file.Files.copy(in, savedFilePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            }
            uploadHistory.setOriginalFilePath(savedFilePath.toString());
            uploadHistoryRepository.save(uploadHistory);
            // Asynchronously write to Kafka, return batchId immediately
            return reactiveUploadService.sendFileUploadEvent(batchId, savedFilePath.toString(), startMonth)
                    .thenReturn(ResponseEntity.ok(
                        DataIngestionResponse.builder()
                            .batchId(batchId)
                            .status("PROCESSING")
                            .message("File received, processing started asynchronously.")
                            .build()
                    ));
        } catch (Exception e) {
            log.error("Error processing CSV upload: {}", e.getMessage(), e);
            uploadHistory.setUploadStatus("FAILED");
            uploadHistory.setErrorMessage(e.getMessage());
            uploadHistory.setProcessedAt(Instant.now());
            uploadHistoryRepository.save(uploadHistory);
            return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(DataIngestionResponse.builder()
                            .status("FAILED")
                            .message("Error processing CSV upload: " + e.getMessage())
                            .build()));
        }
    }

    @GetMapping(value = "/upload-history", produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<String> getUploadHistory() {
        try {
            List<UploadHistory> history = uploadHistoryRepository.findAllByOrderByUploadedAtDesc();
            List<UploadHistory> validHistory = history.stream()
                .filter(h -> {
                    boolean hasOriginal = h.getOriginalFilePath() != null && java.nio.file.Files.exists(java.nio.file.Paths.get(h.getOriginalFilePath()));
                    boolean hasForecast = h.getForecastCsvPath() == null || java.nio.file.Files.exists(java.nio.file.Paths.get(h.getForecastCsvPath()));
                    return hasOriginal && hasForecast;
                })
                .toList();
            List<Map<String, Object>> result = new ArrayList<>();
            for (UploadHistory uh : validHistory) {
                Map<String, Object> h = new HashMap<>();
                h.put("id", uh.getId());
                h.put("batchId", uh.getBatchId());
                h.put("originalFilename", uh.getOriginalFilename());
                h.put("fileSize", uh.getFileSize());
                h.put("uploadStatus", uh.getUploadStatus());
                h.put("totalRecords", uh.getTotalRecords());
                h.put("processedRecords", uh.getProcessedRecords());
                h.put("failedRecords", uh.getFailedRecords());
                h.put("uploadedAt", uh.getUploadedAt());
                h.put("processedAt", uh.getProcessedAt());
                h.put("forecastStartDate", uh.getForecastStartDate());
                h.put("errorMessage", uh.getErrorMessage());
                h.put("originalFilePath", uh.getOriginalFilePath());
                h.put("forecastCsvPath", uh.getForecastCsvPath());
                result.add(h);
            }
            return ResponseEntity.ok(objectMapper.writeValueAsString(result));
        } catch (Exception e) {
            log.error("Error fetching upload history: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping(value = "/upload-history/latest", produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<String> getLatestSuccessfulUpload() {
        try {
            UploadHistory latest = uploadHistoryRepository.findFirstByUploadStatusOrderByUploadedAtDesc("SUCCESS");
            if (latest == null) {
                return ResponseEntity.notFound().build();
            }
            Map<String, Object> h = new HashMap<>();
            h.put("id", latest.getId());
            h.put("batchId", latest.getBatchId());
            h.put("originalFilename", latest.getOriginalFilename());
            h.put("fileSize", latest.getFileSize());
            h.put("uploadStatus", latest.getUploadStatus());
            h.put("totalRecords", latest.getTotalRecords());
            h.put("processedRecords", latest.getProcessedRecords());
            h.put("failedRecords", latest.getFailedRecords());
            h.put("uploadedAt", latest.getUploadedAt());
            h.put("processedAt", latest.getProcessedAt());
            h.put("forecastStartDate", latest.getForecastStartDate());
            h.put("errorMessage", latest.getErrorMessage());
            h.put("originalFilePath", latest.getOriginalFilePath());
            h.put("forecastCsvPath", latest.getForecastCsvPath());
            return ResponseEntity.ok(objectMapper.writeValueAsString(h));
        } catch (Exception e) {
            log.error("Error fetching latest upload: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/upload-history/{batchId}")
    public ResponseEntity<Void> deleteUploadHistory(@PathVariable String batchId) {
        try {
            UploadHistory uploadHistory = uploadHistoryRepository.findByBatchId(batchId)
                    .orElseThrow(() -> new RuntimeException("Upload history not found"));
            
            deleteFileIfExists(uploadHistory.getOriginalFilePath(), "Original file");
            deleteFileIfExists(uploadHistory.getForecastCsvPath(), "Forecast file");
            
            // Delete db record
            uploadHistoryRepository.delete(uploadHistory);
            
            log.info("Deleted upload history and related files: {}", batchId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error deleting upload history: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private void deleteFileIfExists(String filePath, String fileType) {
        if (filePath != null && !filePath.trim().isEmpty()) {
            try {
                java.nio.file.Path path = java.nio.file.Paths.get(filePath);
                if (java.nio.file.Files.deleteIfExists(path)) {
                    log.info("Deleted {}: {}", fileType, filePath);
                } else {
                    log.warn("{} does not exist, skipping deletion: {}", fileType, filePath);
                }
            } catch (Exception e) {
                log.error("Failed to delete {}: {}, error: {}", fileType, filePath, e.getMessage());
            }
        }
    }

    @GetMapping("/download/{batchId}")
    public ResponseEntity<org.springframework.core.io.Resource> downloadForecastFile(@PathVariable String batchId) {
        try {
            UploadHistory uploadHistory = uploadHistoryRepository.findByBatchId(batchId)
                    .orElseThrow(() -> new RuntimeException("Upload history not found"));
            
            String filePath = uploadHistory.getForecastCsvPath();
            if (filePath == null || filePath.trim().isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            java.nio.file.Path path = java.nio.file.Paths.get(filePath);
            if (!java.nio.file.Files.exists(path)) {
                log.warn("Forecast file not found: {}", filePath);
                return ResponseEntity.notFound().build();
            }
            
            org.springframework.core.io.Resource resource = new org.springframework.core.io.FileSystemResource(path);
            
            String originalFilename = uploadHistory.getOriginalFilename();
            String baseName = originalFilename != null ? originalFilename.replaceAll("\\.[^.]*$", "") : "forecast";
            String downloadFilename = baseName + "_forecast.csv";
            
            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, 
                           "attachment; filename=\"" + downloadFilename + "\"")
                    .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "text/csv")
                    .body(resource);
        } catch (Exception e) {
            log.error("Error downloading file for batch {}: {}", batchId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/upload-history/{batchId}/forecast-data")
    public ResponseEntity<List<LoanForecastData>> getForecastData(@PathVariable String batchId) {
        try {
            UploadHistory uploadHistory = uploadHistoryRepository.findByBatchId(batchId)
                    .orElseThrow(() -> new RuntimeException("Upload history not found"));

            // Regenerate forecast data from the saved original file
            if (uploadHistory.getOriginalFilePath() != null && java.nio.file.Files.exists(java.nio.file.Paths.get(uploadHistory.getOriginalFilePath()))) {
                // Process CSV directly from the file path
                List<LoanForecastData> forecastDataList = csvProcessingService.processCsvFileFromPath(
                    uploadHistory.getOriginalFilePath(),
                    uploadHistory.getForecastStartDate()
                );

                return ResponseEntity.ok(forecastDataList);
            } else {
                log.warn("Original file not found for batch {}", batchId);
                return ResponseEntity.ok(List.of());
            }
        } catch (Exception e) {
            log.error("Error fetching forecast data for batch {}: {}", batchId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("Pong");
    }
} 