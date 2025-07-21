package com.bankplus.data_ingestion.controller;

import com.bankplus.data_ingestion.dto.DataIngestionResponse;
import com.bankplus.data_ingestion.dto.LoanForecastData;
import com.bankplus.data_ingestion.model.UploadHistory;
import com.bankplus.data_ingestion.model.CsvLoanData;
import com.bankplus.data_ingestion.repository.UploadHistoryRepository;
import com.bankplus.data_ingestion.service.CsvProcessingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/data-ingestion")
@Slf4j
@CrossOrigin(origins = "*")
public class DataIngestionController {

    @Autowired
    private CsvProcessingService csvProcessingService;

    @Autowired
    private UploadHistoryRepository uploadHistoryRepository;

    @PostMapping("/upload")
    public ResponseEntity<DataIngestionResponse> uploadCsvFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("startMonth") String startMonth // 例如 "2024-11-01"
    ) {
        log.info("Received CSV file upload: {} with startMonth {}", file.getOriginalFilename(), startMonth);
        
        String batchId = csvProcessingService.generateBatchId();
        
        // 创建上传历史记录
        UploadHistory uploadHistory = UploadHistory.builder()
                .batchId(batchId)
                .originalFilename(file.getOriginalFilename())
                .fileSize(file.getSize())
                .uploadStatus("PROCESSING")
                .forecastStartDate(startMonth)
                .uploadedAt(LocalDateTime.now())
                .build();
        
        try {
            uploadHistoryRepository.save(uploadHistory);
            
            List<CsvLoanData> loanDataList = csvProcessingService.processCsvFile(file);
            List<LoanForecastData> forecastDataList = csvProcessingService.convertToLoanForecastData(loanDataList, startMonth);

            // Write forecast results to Output directory (JSON format for frontend)
            String outputFileName = file.getOriginalFilename().replaceAll("\\.[^.]*$", "") + "_predicted.csv";
            csvProcessingService.writeForecastToCsv(forecastDataList, outputFileName);
            
            // Generate forecast CSV to forecast directory (for consistency)
            csvProcessingService.generateForecastCsv(forecastDataList, file.getOriginalFilename());

            // 更新上传历史记录
            uploadHistory.setTotalRecords(loanDataList.size());
            uploadHistory.setProcessedRecords(forecastDataList.size());
            uploadHistory.setFailedRecords(loanDataList.size() - forecastDataList.size());
            uploadHistory.setUploadStatus("SUCCESS");
            uploadHistory.setProcessedAt(LocalDateTime.now());
            uploadHistory.setOutputCsvPath("backend/data/Output/" + outputFileName);
            uploadHistory.setForecastCsvPath("backend/data/forecast/" + file.getOriginalFilename().replaceAll("\\.[^.]*$", "") + "_forecast.csv");
            uploadHistoryRepository.save(uploadHistory);
            
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
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error processing CSV upload: {}", e.getMessage(), e);
            
            // 更新上传历史记录为失败状态
            uploadHistory.setUploadStatus("FAILED");
            uploadHistory.setErrorMessage(e.getMessage());
            uploadHistory.setProcessedAt(LocalDateTime.now());
            uploadHistoryRepository.save(uploadHistory);
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(DataIngestionResponse.builder()
                            .status("FAILED")
                            .message("Error processing CSV upload: " + e.getMessage())
                            .build());
        }
    }

    @GetMapping("/upload-history")
    public ResponseEntity<List<UploadHistory>> getUploadHistory() {
        try {
            List<UploadHistory> history = uploadHistoryRepository.findAllOrderByUploadedAtDesc();
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            log.error("Error fetching upload history: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/upload-history/latest")
    public ResponseEntity<UploadHistory> getLatestSuccessfulUpload() {
        try {
            return uploadHistoryRepository.findLatestSuccessfulUpload()
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error fetching latest upload: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @DeleteMapping("/upload-history/{batchId}")
    public ResponseEntity<Void> deleteUploadHistory(@PathVariable String batchId) {
        try {
            UploadHistory uploadHistory = uploadHistoryRepository.findByBatchId(batchId)
                    .orElseThrow(() -> new RuntimeException("Upload history not found"));
            
            // TODO: 实际删除文件系统中的文件
            // Files.deleteIfExists(Paths.get(uploadHistory.getOutputCsvPath()));
            // Files.deleteIfExists(Paths.get(uploadHistory.getForecastCsvPath()));
            
            uploadHistoryRepository.delete(uploadHistory);
            log.info("Deleted upload history: {}", batchId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error deleting upload history: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/upload-history/{batchId}/forecast-data")
    public ResponseEntity<List<LoanForecastData>> getForecastData(@PathVariable String batchId) {
        try {
            // TODO: 实现从存储中加载预测数据的逻辑
            // 目前返回空列表，实际应该从数据库或文件中加载
            return ResponseEntity.ok(List.of());
        } catch (Exception e) {
            log.error("Error fetching forecast data for batch {}: {}", batchId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Data Ingestion Service is running");
    }
} 