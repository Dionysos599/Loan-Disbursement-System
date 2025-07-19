package com.bankplus.data_ingestion.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "upload_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "batch_id", unique = true, nullable = false)
    private String batchId;
    
    @Column(name = "original_filename", nullable = false)
    private String originalFilename;
    
    @Column(name = "file_size")
    private Long fileSize;
    
    @Column(name = "total_records")
    private Integer totalRecords;
    
    @Column(name = "processed_records")
    private Integer processedRecords;
    
    @Column(name = "failed_records")
    private Integer failedRecords;
    
    @Column(name = "upload_status", nullable = false)
    private String uploadStatus; // SUCCESS, FAILED, PROCESSING
    
    @Column(name = "forecast_start_date")
    private String forecastStartDate;
    
    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;
    
    @Column(name = "processed_at")
    private LocalDateTime processedAt;
    
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
    
    @Column(name = "output_csv_path")
    private String outputCsvPath;
    
    @Column(name = "forecast_csv_path")
    private String forecastCsvPath;
} 