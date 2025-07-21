package com.bankplus.loan_forecast.repository;

import com.bankplus.loan_forecast.model.UploadHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UploadHistoryRepository extends JpaRepository<UploadHistory, Long> {
    
    Optional<UploadHistory> findByBatchId(String batchId);
    
    List<UploadHistory> findAllByOrderByUploadedAtDesc();
    
    UploadHistory findFirstByUploadStatusOrderByUploadedAtDesc(String uploadStatus);
} 