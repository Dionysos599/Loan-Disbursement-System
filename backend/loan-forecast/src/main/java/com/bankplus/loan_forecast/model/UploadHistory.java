package com.bankplus.loan_forecast.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "upload_history")
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonAutoDetect(fieldVisibility = JsonAutoDetect.Visibility.ANY)
public class UploadHistory implements java.io.Serializable {
    
    public UploadHistory() {}
    
    @JsonProperty("id")
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @JsonProperty("batchId")
    @Column(name = "batch_id", unique = true, nullable = false)
    private String batchId;
    
    @JsonProperty("originalFilename")
    @Column(name = "original_filename")
    private String originalFilename;
    
    @JsonProperty("fileSize")
    @Column(name = "file_size")
    private Long fileSize;
    
    @JsonProperty("uploadStatus")
    @Column(name = "upload_status")
    private String uploadStatus; // PROCESSING, SUCCESS, FAILED
    
    @JsonProperty("totalRecords")
    @Column(name = "total_records")
    private Integer totalRecords;
    
    @JsonProperty("processedRecords")
    @Column(name = "processed_records")
    private Integer processedRecords;
    
    @JsonProperty("failedRecords")
    @Column(name = "failed_records")
    private Integer failedRecords;
    
    @JsonProperty("uploadedAt")
    @Column(name = "uploaded_at")
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant uploadedAt;
    
    @JsonProperty("processedAt")
    @Column(name = "processed_at")
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant processedAt;
    
    @JsonProperty("forecastStartDate")
    @Column(name = "forecast_start_date")
    private String forecastStartDate;
    
    @JsonProperty("errorMessage")
    @Column(name = "error_message", length = 1000)
    private String errorMessage;
    
    @JsonProperty("originalFilePath")
    @Column(name = "original_file_path")
    private String originalFilePath;
    
    @JsonProperty("forecastCsvPath")
    @Column(name = "forecast_csv_path")
    private String forecastCsvPath;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getBatchId() {
        return batchId;
    }

    public void setBatchId(String batchId) {
        this.batchId = batchId;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public void setOriginalFilename(String originalFilename) {
        this.originalFilename = originalFilename;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getUploadStatus() {
        return uploadStatus;
    }

    public void setUploadStatus(String uploadStatus) {
        this.uploadStatus = uploadStatus;
    }

    public Integer getTotalRecords() {
        return totalRecords;
    }

    public void setTotalRecords(Integer totalRecords) {
        this.totalRecords = totalRecords;
    }

    public Integer getProcessedRecords() {
        return processedRecords;
    }

    public void setProcessedRecords(Integer processedRecords) {
        this.processedRecords = processedRecords;
    }

    public Integer getFailedRecords() {
        return failedRecords;
    }

    public void setFailedRecords(Integer failedRecords) {
        this.failedRecords = failedRecords;
    }

    public Instant getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(Instant uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public Instant getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(Instant processedAt) {
        this.processedAt = processedAt;
    }

    public String getForecastStartDate() {
        return forecastStartDate;
    }

    public void setForecastStartDate(String forecastStartDate) {
        this.forecastStartDate = forecastStartDate;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public String getOriginalFilePath() {
        return originalFilePath;
    }

    public void setOriginalFilePath(String originalFilePath) {
        this.originalFilePath = originalFilePath;
    }

    public String getForecastCsvPath() {
        return forecastCsvPath;
    }

    public void setForecastCsvPath(String forecastCsvPath) {
        this.forecastCsvPath = forecastCsvPath;
    }
} 