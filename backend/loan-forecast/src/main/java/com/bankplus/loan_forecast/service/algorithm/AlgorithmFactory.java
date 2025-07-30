package com.bankplus.loan_forecast.service.algorithm;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;
import java.util.Map;
import java.util.HashMap;

/**
 * Factory for creating and managing forecast algorithms
 * Supports dynamic algorithm selection based on configuration
 */
@Component
@Slf4j
public class AlgorithmFactory {
    
    @Value("${forecast.algorithm.type:simple}")
    private String algorithmType;
    
    private final Map<String, ForecastAlgorithmInterface> algorithms;
    
    @Autowired
    public AlgorithmFactory(SimpleForecastAlgorithm simpleAlgorithm) {
        this.algorithms = new HashMap<>();
        this.algorithms.put("simple", simpleAlgorithm);
        
        // Try to inject ForecastAlgorithm if it exists using reflection
        try {
            Class<?> forecastAlgorithmClass = Class.forName("com.bankplus.loan_forecast.service.algorithm.ForecastAlgorithm");
            ForecastAlgorithmInterface forecastAlgorithm = (ForecastAlgorithmInterface) forecastAlgorithmClass.getDeclaredConstructor().newInstance();
            this.algorithms.put("forecast", forecastAlgorithm);
            log.info("ForecastAlgorithm found and added to factory");
        } catch (Exception e) {
            log.info("ForecastAlgorithm not available, using only SimpleForecastAlgorithm: {}", e.getMessage());
        }
        
        log.info("Algorithm factory initialized with algorithms: {}", algorithms.keySet());
    }
    
    /**
     * Get the configured forecast algorithm
     * @return The active forecast algorithm
     */
    public ForecastAlgorithmInterface getActiveAlgorithm() {
        String algorithmType = determineAlgorithmType();
        ForecastAlgorithmInterface algorithm = algorithms.get(algorithmType);
        
        if (algorithm == null) {
            log.warn("Algorithm type '{}' not found, falling back to simple", algorithmType);
            algorithm = algorithms.get("simple");
        }
        
        log.info("Using forecast algorithm: {} - {}", 
                algorithm.getAlgorithmName(), 
                algorithm.getAlgorithmDescription());
        
        return algorithm;
    }
    
    /**
     * Get a specific algorithm by type
     * @param algorithmType The algorithm type to retrieve
     * @return The requested algorithm or null if not found
     */
    public ForecastAlgorithmInterface getAlgorithm(String algorithmType) {
        return algorithms.get(algorithmType);
    }
    
    /**
     * Get all available algorithms
     * @return Map of all available algorithms
     */
    public Map<String, ForecastAlgorithmInterface> getAllAlgorithms() {
        return new HashMap<>(algorithms);
    }
    
    /**
     * Determine which algorithm type to use based on configuration
     * @return The algorithm type to use
     */
    private String determineAlgorithmType() {
        // Check environment variable first
        String envAlgorithm = System.getenv("FORECAST_ALGORITHM_TYPE");
        if (envAlgorithm != null && !envAlgorithm.trim().isEmpty()) {
            log.info("Using algorithm type from environment variable: {}", envAlgorithm);
            return envAlgorithm;
        }
        
        // Use configuration value
        log.info("Using algorithm type from configuration: {}", algorithmType);
        return algorithmType;
    }
    
    /**
     * Check if forecast algorithm is available
     * @return true if forecast algorithm is available
     */
    public boolean isForecastAlgorithmAvailable() {
        return algorithms.containsKey("forecast");
    }
}