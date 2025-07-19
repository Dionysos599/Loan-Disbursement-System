package com.bankplus.data_ingestion.repository;

import com.bankplus.data_ingestion.model.UploadHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UploadHistoryRepository extends JpaRepository<UploadHistory, Long> {
    
    Optional<UploadHistory> findByBatchId(String batchId);
    
    @Query("SELECT u FROM UploadHistory u ORDER BY u.uploadedAt DESC")
    List<UploadHistory> findAllOrderByUploadedAtDesc();
    
    @Query("SELECT u FROM UploadHistory u WHERE u.uploadStatus = 'SUCCESS' ORDER BY u.uploadedAt DESC")
    List<UploadHistory> findSuccessfulUploadsOrderByUploadedAtDesc();
    
    @Query("SELECT u FROM UploadHistory u WHERE u.uploadStatus = 'SUCCESS' ORDER BY u.uploadedAt DESC LIMIT 1")
    Optional<UploadHistory> findLatestSuccessfulUpload();
} 