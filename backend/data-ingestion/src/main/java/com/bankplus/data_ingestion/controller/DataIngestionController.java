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
            // 保存原始文件到本地磁盘（用流拷贝，兼容所有环境）
            String inputDir = new java.io.File("backend/data/Input/").getAbsoluteFile().toString();
            java.nio.file.Files.createDirectories(java.nio.file.Paths.get(inputDir));
            String savedFileName = batchId + "_" + file.getOriginalFilename();
            java.nio.file.Path savedFilePath = java.nio.file.Paths.get(inputDir, savedFileName);
            try (java.io.InputStream in = file.getInputStream()) {
                java.nio.file.Files.copy(in, savedFilePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            }
            uploadHistory.setOriginalFilePath(savedFilePath.toString());
            uploadHistoryRepository.save(uploadHistory);
            
            // 解析原始CSV为对象列表
            List<CsvLoanData> loanDataList = csvProcessingService.processCsvFile(file);
            List<LoanForecastData> forecastDataList = csvProcessingService.convertToLoanForecastData(loanDataList, startMonth);

            // 生成自定义格式的forecast csv
            String forecastCsvPath = csvProcessingService.generateForecastCsvWithOriginalFormat(loanDataList, forecastDataList, file.getOriginalFilename());
            uploadHistory.setForecastCsvPath(forecastCsvPath);
            uploadHistoryRepository.save(uploadHistory);

            // 更新上传历史记录（其他字段）
            uploadHistory.setTotalRecords(loanDataList.size());
            uploadHistory.setProcessedRecords(forecastDataList.size());
            uploadHistory.setFailedRecords(loanDataList.size() - forecastDataList.size());
            uploadHistory.setUploadStatus("SUCCESS");
            uploadHistory.setProcessedAt(LocalDateTime.now());
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
            // 只删除forecast csv和原始文件
            deleteFileIfExists(uploadHistory.getOriginalFilePath(), "原始文件");
            deleteFileIfExists(uploadHistory.getForecastCsvPath(), "预测CSV文件");
            uploadHistoryRepository.delete(uploadHistory);
            log.info("Deleted upload history and related files: {}", batchId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error deleting upload history: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    private void deleteFileIfExists(String filePath, String fileType) {
        if (filePath != null && !filePath.trim().isEmpty()) {
            try {
                java.nio.file.Path path = java.nio.file.Paths.get(filePath);
                if (java.nio.file.Files.deleteIfExists(path)) {
                    log.info("已删除{}: {}", fileType, filePath);
                } else {
                    log.warn("{}不存在，跳过删除: {}", fileType, filePath);
                }
            } catch (Exception e) {
                log.error("删除{}失败: {}, 错误: {}", fileType, filePath, e.getMessage());
            }
        }
    }
    
    @GetMapping("/upload-history/{batchId}/forecast-data")
    public ResponseEntity<List<LoanForecastData>> getForecastData(@PathVariable String batchId) {
        try {
            UploadHistory uploadHistory = uploadHistoryRepository.findByBatchId(batchId)
                    .orElseThrow(() -> new RuntimeException("Upload history not found"));
            
            // 从保存的原始文件重新生成预测数据
            if (uploadHistory.getOriginalFilePath() != null && java.nio.file.Files.exists(java.nio.file.Paths.get(uploadHistory.getOriginalFilePath()))) {
                // 直接从文件路径处理CSV
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

    @GetMapping("/download/{batchId}")
    public ResponseEntity<?> downloadForecastFile(@PathVariable String batchId) {
        UploadHistory history = uploadHistoryRepository.findByBatchId(batchId).orElse(null);
        if (history == null || history.getForecastCsvPath() == null) {
            return ResponseEntity.notFound().build();
        }
        java.nio.file.Path filePath = java.nio.file.Paths.get(history.getForecastCsvPath());
        if (!java.nio.file.Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }
        org.springframework.core.io.Resource resource = new org.springframework.core.io.FileSystemResource(filePath);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + (history.getOriginalFilename().replaceAll("\\.[^.]*$", "_forecast.csv")) + "\"")
                .body(resource);
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Data Ingestion Service is running");
    }
} 