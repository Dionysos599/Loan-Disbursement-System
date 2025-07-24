package com.bankplus.loan_forecast.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "upload_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UploadHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "batch_id", unique = true, nullable = false)
    private String batchId;
    
    @Column(name = "original_filename")
    private String originalFilename;
    
    @Column(name = "file_size")
    private Long fileSize;
    
    @Column(name = "upload_status")
    private String uploadStatus; // PROCESSING, SUCCESS, FAILED
    
    @Column(name = "total_records")
    private Integer totalRecords;
    
    @Column(name = "processed_records")
    private Integer processedRecords;
    
    @Column(name = "failed_records")
    private Integer failedRecords;
    
    @Column(name = "uploaded_at")
    private Instant uploadedAt;
    
    @Column(name = "processed_at")
    private Instant processedAt;
    
    @Column(name = "forecast_start_date")
    private String forecastStartDate;
    
    @Column(name = "error_message", length = 1000)
    private String errorMessage;
    
    @Column(name = "original_file_path")
    private String originalFilePath;
    
    @Column(name = "forecast_csv_path")
    private String forecastCsvPath;
} 