package com.bankplus.loan_forecast.config;

import com.bankplus.loan_forecast.service.CsvProcessingService;
import com.bankplus.loan_forecast.model.UploadHistory;
import com.bankplus.loan_forecast.repository.UploadHistoryRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.kstream.KStream;
import org.apache.kafka.streams.kstream.TimeWindows;
import org.apache.kafka.streams.kstream.Materialized;
import org.apache.kafka.streams.kstream.Produced;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafkaStreams;
import org.springframework.kafka.config.KafkaStreamsConfiguration;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Configuration
@EnableKafkaStreams
public class KafkaStreamsConfig {
    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Value("${spring.kafka.topics.file-upload-events}")
    private String fileUploadTopic;

    @Value("${spring.kafka.topics.cleaned-data-topic}")
    private String cleanedDataTopic;

    @Value("${spring.kafka.topics.progress-updates}")
    private String progressUpdatesTopic;

    @Autowired
    private CsvProcessingService csvProcessingService;

    @Autowired
    private UploadHistoryRepository uploadHistoryRepository;

    @Bean(name = "defaultKafkaStreamsConfig")
    public KafkaStreamsConfiguration kafkaStreamsConfiguration() {
        Map<String, Object> props = new HashMap<>();
        props.put("bootstrap.servers", bootstrapServers);
        props.put("application.id", "loan-forecast-streams");
        props.put("default.key.serde", Serdes.String().getClass());
        props.put("default.value.serde", Serdes.String().getClass());
        return new KafkaStreamsConfiguration(props);
    }

    @Bean
    public KStream<String, String> kStream(StreamsBuilder builder) {
        KStream<String, String> uploadEvents = builder.stream(fileUploadTopic);

        uploadEvents.foreach((key, value) -> {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                Map<String, String> event = mapper.readValue(value, Map.class);
                String batchId = event.get("batchId");
                String filePath = event.get("filePath");
                String startMonth = event.get("startMonth");

                // Parse, clean, and predict
                java.util.List<com.bankplus.loan_forecast.model.CsvLoanData> loanDataList;
                try (java.io.Reader reader = new java.io.FileReader(filePath)) {
                    loanDataList = csvProcessingService.processCsvData(reader);
                }
                java.util.List<com.bankplus.loan_forecast.dto.LoanForecastData> forecastDataList = csvProcessingService.convertToLoanForecastData(loanDataList, startMonth);

                String forecastCsvPath = csvProcessingService.generateForecastCsvWithOriginalFormat(loanDataList, forecastDataList, filePath.substring(filePath.lastIndexOf("_") + 1), startMonth);

                UploadHistory uploadHistory = uploadHistoryRepository.findByBatchId(batchId).orElse(null);
                if (uploadHistory != null) {
                    uploadHistory.setForecastCsvPath(forecastCsvPath);
                    uploadHistory.setTotalRecords(loanDataList.size());
                    uploadHistory.setProcessedRecords(forecastDataList.size());
                    uploadHistory.setFailedRecords(loanDataList.size() - forecastDataList.size());
                    uploadHistory.setUploadStatus("SUCCESS");
                    uploadHistory.setProcessedAt(java.time.LocalDateTime.now());
                    uploadHistoryRepository.save(uploadHistory);
                }

                // Push progress to progress-updates topic
                Map<String, Object> progress = new HashMap<>();
                progress.put("batchId", batchId);
                progress.put("status", "SUCCESS");
                progress.put("processedRecords", forecastDataList.size());
                progress.put("totalRecords", loanDataList.size());
                progress.put("timestamp", System.currentTimeMillis());
                String progressJson = mapper.writeValueAsString(progress);
                org.apache.kafka.clients.producer.ProducerRecord<String, String> progressRecord = new org.apache.kafka.clients.producer.ProducerRecord<>(progressUpdatesTopic, batchId, progressJson);
                java.util.Properties props = kafkaStreamsConfiguration().asProperties();
                Map<String, Object> producerProps = new java.util.HashMap<>();
                for (String name : props.stringPropertyNames()) {
                    producerProps.put(name, props.getProperty(name));
                }
                producerProps.put("key.serializer", org.apache.kafka.common.serialization.StringSerializer.class.getName());
                producerProps.put("value.serializer", org.apache.kafka.common.serialization.StringSerializer.class.getName());
                org.apache.kafka.clients.producer.KafkaProducer<String, String> producer = new org.apache.kafka.clients.producer.KafkaProducer<>(producerProps);
                producer.send(progressRecord);
                producer.close();
            } catch (Exception e) {
                log.error("Kafka Streams processing error: {}", e.getMessage(), e);
            }
        });
        return uploadEvents;
    }
} 