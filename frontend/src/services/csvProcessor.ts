import { LoanForecastData, UploadHistory, DataIngestionResponse } from '../types/loan';

// CSV数据模型
export interface CsvLoanData {
  loanNumber: string;
  customerName: string;
  loanAmount: string;
  maturityDate: string;
  extendedDate: string;
  outstandingBalance: string;
  undisbursedAmount: string;
  percentOfLoanDrawn: string;
  percentOfCompletion: string;
}

// 预测算法接口
interface ForecastAlgorithm {
  calculateForecastOutstandingBalance(
    outstandingBalance: number,
    undisbursedAmount: number,
    percentOfCompletion: number,
    projectStartDate: Date,
    forecastDate: Date,
    extendedDate: Date
  ): number;
}

// 简单S型曲线预测算法
class SimpleForecastAlgorithm implements ForecastAlgorithm {
  calculateForecastOutstandingBalance(
    outstandingBalance: number,
    undisbursedAmount: number,
    percentOfCompletion: number,
    projectStartDate: Date,
    forecastDate: Date,
    extendedDate: Date
  ): number {
    const daysBetweenStartAndForecast = Math.floor(
      (forecastDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysBetweenStartAndExtended = Math.floor(
      (extendedDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const timeProgress = daysBetweenStartAndExtended > 0 
      ? daysBetweenStartAndForecast / daysBetweenStartAndExtended 
      : 0;

    let totalProgress = percentOfCompletion + timeProgress * (1 - percentOfCompletion);

    // 确保总进度在[0, 1]范围内
    if (totalProgress < 0) totalProgress = 0;
    if (totalProgress > 1) totalProgress = 1;

    // 简单sigmoid S型曲线模型
    const sCurveValue = 1.0 / (1.0 + Math.exp(-12.0 * (totalProgress - 0.5)));

    const additionalDisbursement = undisbursedAmount * sCurveValue;
    return outstandingBalance + additionalDisbursement;
  }
}

export class CsvProcessor {
  private algorithm: ForecastAlgorithm;

  constructor() {
    this.algorithm = new SimpleForecastAlgorithm();
  }

  // 生成批次ID
  generateBatchId(): string {
    return 'BATCH_' + Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  // 解析CSV文件
  async processCsvFile(file: File): Promise<CsvLoanData[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const lines = csv.split('\n');
          const headers = this.parseCsvLine(lines[0]);
          
          // 找到必需列的索引
          const columnIndexes = this.findRequiredColumnIndexes(headers);
          
          // 验证必需列是否存在
          const criticalColumns = [
            'Loan Number', 'Loan Amount', 'Maturity Date', 'Extended Date',
            'Outstanding Balance', 'Undisbursed Amount', '% of Completion'
          ];
          
          for (const col of criticalColumns) {
            if (!(col in columnIndexes)) {
              reject(new Error(`Required column missing: ${col}`));
              return;
            }
          }

          const loanDataList: CsvLoanData[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              try {
                const row = this.parseCsvLine(lines[i]);
                const loanData = this.extractRequiredFields(row, columnIndexes);
                if (loanData) {
                  loanDataList.push(loanData);
                }
              } catch (error) {
                console.warn(`Skipping row ${i + 1} due to parsing error:`, error);
              }
            }
          }

          resolve(loanDataList);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // 解析CSV行
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  // 找到必需列的索引
  private findRequiredColumnIndexes(headers: string[]): Record<string, number> {
    const indexes: Record<string, number> = {};
    const requiredColumns = [
      'Loan Number', 'Customer Name', 'Loan Amount', 'Maturity Date', 'Extended Date',
      'Outstanding Balance', 'Undisbursed Amount', '% of Loan Drawn', '% of Completion'
    ];

    for (const requiredCol of requiredColumns) {
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i]
          .trim()
          .replace(/"/g, '')
          .replace(/\s+/g, ' ')
          .replace(/^\uFEFF/, ''); // 移除BOM

        if (requiredCol === header) {
          indexes[requiredCol] = i;
          break;
        }
      }
    }

    return indexes;
  }

  // 提取必需字段
  private extractRequiredFields(row: string[], columnIndexes: Record<string, number>): CsvLoanData | null {
    try {
      const loanNumber = this.getColumnValue(row, columnIndexes, 'Loan Number');
      const customerName = this.getColumnValue(row, columnIndexes, 'Customer Name');
      const loanAmount = this.getColumnValue(row, columnIndexes, 'Loan Amount');
      const maturityDate = this.getColumnValue(row, columnIndexes, 'Maturity Date');
      const extendedDate = this.getColumnValue(row, columnIndexes, 'Extended Date');
      const outstandingBalance = this.getColumnValue(row, columnIndexes, 'Outstanding Balance');
      const undisbursedAmount = this.getColumnValue(row, columnIndexes, 'Undisbursed Amount');
      const percentOfLoanDrawn = this.getColumnValue(row, columnIndexes, '% of Loan Drawn');
      const percentOfCompletion = this.getColumnValue(row, columnIndexes, '% of Completion');

      if (this.isEmpty(loanNumber) || this.isEmpty(loanAmount) || this.isEmpty(maturityDate) ||
          this.isEmpty(extendedDate) || this.isEmpty(outstandingBalance) ||
          this.isEmpty(undisbursedAmount) || this.isEmpty(percentOfCompletion)) {
        return null; // 跳过无效行
      }

      return {
        loanNumber,
        customerName,
        loanAmount,
        maturityDate,
        extendedDate,
        outstandingBalance,
        undisbursedAmount,
        percentOfLoanDrawn,
        percentOfCompletion
      };
    } catch (error) {
      console.error('Error extracting fields from row:', error);
      return null;
    }
  }

  private getColumnValue(row: string[], columnIndexes: Record<string, number>, columnName: string): string {
    const index = columnIndexes[columnName];
    if (index === undefined || index >= row.length) {
      return '';
    }
    const value = row[index];
    return value != null ? value.trim() : '';
  }

  private isEmpty(s: string): boolean {
    return !s || s.trim() === '' || s.trim().toUpperCase() === 'N/A';
  }

  // 转换CSV数据为预测数据
  convertToLoanForecastData(csvDataList: CsvLoanData[], startMonthStr: string): LoanForecastData[] {
    console.log(`Converting ${csvDataList.length} CSV records to forecast data`);

    try {
      const forecastStartDate = this.parseDate(startMonthStr);
      
      // 转换CSV数据为Map
      const loanDataList = csvDataList
        .map(csvData => this.convertCsvToMap(csvData))
        .filter(data => data !== null);

      // 计算预测
      const loanForecasts = this.calculateForecastsLocally(loanDataList, forecastStartDate);

      const result: LoanForecastData[] = [];
      for (const forecast of loanForecasts) {
        const loanForecastData = this.convertMapToLoanForecastData(forecast);
        if (loanForecastData) {
          result.push(loanForecastData);
        }
      }

      console.log(`Successfully converted ${result.length} records to forecast data`);
      return result;
    } catch (error) {
      console.error('Error generating forecast data:', error);
      return [];
    }
  }

  // 计算预测
  private calculateForecastsLocally(loanDataList: any[], forecastStartDate: Date): any[] {
    const results: any[] = [];

    for (const loanData of loanDataList) {
      try {
        const forecast = this.calculateSingleLoanForecastLocally(loanData, forecastStartDate);
        if (forecast) {
          results.push(forecast);
        }
      } catch (error) {
        console.error('Error calculating local forecast for loan:', loanData.loanNumber, error);
      }
    }

    return results;
  }

  // 计算单个贷款的预测
  private calculateSingleLoanForecastLocally(loanData: any, forecastStartDate: Date): any {
    const loanNumber = loanData.loanNumber;
    const customerName = loanData.customerName;
    const loanAmount = loanData.loanAmount;
    const outstandingBalance = loanData.outstandingBalance;
    const undisbursedAmount = loanData.undisbursedAmount;
    const percentOfCompletion = loanData.percentOfCompletion;
    const extendedDate = loanData.extendedDate;

    // 验证参数
    if (outstandingBalance < 0 || undisbursedAmount < 0 || percentOfCompletion < 0 || percentOfCompletion > 100) {
      console.warn('Invalid parameters for loan', loanNumber);
      return null;
    }

    const projectStartDate = this.calculateProjectStartDate(
      percentOfCompletion / 100.0, 
      forecastStartDate, 
      extendedDate
    );
    
    const cutoffDate = new Date(extendedDate);
    cutoffDate.setMonth(cutoffDate.getMonth() + 6);
    
    const forecastEndDate = new Date(cutoffDate);
    forecastEndDate.setMonth(forecastEndDate.getMonth() + 1);
    forecastEndDate.setDate(1);

    // 生成月度预测
    const monthlyForecasts: Record<string, number> = {};
    const currentDate = new Date(forecastStartDate);
    let totalForecastedAmount = 0;
    let forecastMonths = 0;

    while (currentDate <= forecastEndDate) {
      let forecastOutstandingBalance: number;

      // 如果当前日期在延期日期+180天之后，预测值为0
      const cutoffMonth = new Date(cutoffDate);
      cutoffMonth.setMonth(cutoffMonth.getMonth() - 1);
      cutoffMonth.setDate(1);

      if (currentDate > cutoffMonth) {
        forecastOutstandingBalance = 0;
      } else {
        forecastOutstandingBalance = this.algorithm.calculateForecastOutstandingBalance(
          outstandingBalance,
          undisbursedAmount,
          percentOfCompletion / 100.0,
          projectStartDate,
          currentDate,
          extendedDate
        );
      }

      // 格式化: MMM-yy
      const monthKey = currentDate.toLocaleDateString('en-US', { 
        month: 'short', 
        year: '2-digit' 
      });
      
      monthlyForecasts[monthKey] = Math.round(forecastOutstandingBalance * 100) / 100;
      totalForecastedAmount += forecastOutstandingBalance;
      forecastMonths++;

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return {
      loanNumber,
      customerName,
      loanAmount,
      outstandingBalance,
      undisbursedAmount,
      percentOfCompletion,
      maturityDate: loanData.maturityDate,
      extendedDate: extendedDate.toISOString().split('T')[0],
      percentOfLoanDrawn: loanData.percentOfLoanDrawn || 0,
      forecastData: monthlyForecasts,
      totalForecastedAmount: Math.round(totalForecastedAmount * 100) / 100,
      forecastMonths
    };
  }

  private calculateProjectStartDate(percentOfCompletion: number, forecastStartDate: Date, extendedDate: Date): Date {
    const daysFromForecastToExtended = Math.floor(
      (extendedDate.getTime() - forecastStartDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    let targetTotalProgressAtStart = 0.125;

    if (targetTotalProgressAtStart < percentOfCompletion) {
      targetTotalProgressAtStart = percentOfCompletion + 0.01;
    }

    let timeProgressRatio = (targetTotalProgressAtStart - percentOfCompletion) / (1.0 - percentOfCompletion);

    if (timeProgressRatio >= 1.0) {
      timeProgressRatio = 0.1;
    }

    const daysFromProjectStartToForecastStart = Math.round(
      daysFromForecastToExtended * timeProgressRatio / (1.0 - timeProgressRatio)
    );
    
    const projectStartDate = new Date(forecastStartDate);
    projectStartDate.setDate(projectStartDate.getDate() - daysFromProjectStartToForecastStart);
    
    return projectStartDate;
  }

  private convertCsvToMap(csvData: CsvLoanData): any {
    try {
      const loanNumber = csvData.loanNumber;
      const loanAmount = csvData.loanAmount;
      const maturityDate = csvData.maturityDate;
      const extendedDate = csvData.extendedDate;
      const outstandingBalance = csvData.outstandingBalance;
      const undisbursedAmount = csvData.undisbursedAmount;
      const percentOfCompletion = csvData.percentOfCompletion;
      const percentOfLoanDrawn = csvData.percentOfLoanDrawn;

      // 验证关键字段
      if (this.isEmpty(loanNumber) || this.isEmpty(loanAmount) || this.isEmpty(maturityDate) ||
          this.isEmpty(extendedDate) || this.isEmpty(outstandingBalance) ||
          this.isEmpty(undisbursedAmount) || this.isEmpty(percentOfCompletion)) {
        return null;
      }

      return {
        loanNumber,
        customerName: csvData.customerName,
        loanAmount: this.parseNumber(loanAmount),
        maturityDate: this.parseDate(maturityDate),
        extendedDate: this.parseDate(extendedDate),
        outstandingBalance: this.parseNumber(outstandingBalance),
        undisbursedAmount: this.parseNumber(undisbursedAmount),
        percentOfCompletion: this.parseInteger(percentOfCompletion),
        percentOfLoanDrawn: this.parseNumber(percentOfLoanDrawn)
      };
    } catch (error) {
      console.error('Error converting CSV data to map for loan:', csvData.loanNumber, error);
      return null;
    }
  }

  private convertMapToLoanForecastData(forecast: any): LoanForecastData | null {
    try {
      return {
        loanNumber: forecast.loanNumber,
        customerName: forecast.customerName,
        loanAmount: forecast.loanAmount,
        forecastData: forecast.forecastData,
        totalForecastedAmount: forecast.totalForecastedAmount,
        scenarioName: forecast.loanNumber || 'N/A',
        // 保留原始CSV数据
        maturityDate: forecast.maturityDate,
        extendedDate: forecast.extendedDate,
        outstandingBalance: forecast.outstandingBalance,
        undisbursedAmount: forecast.undisbursedAmount,
        percentOfCompletion: forecast.percentOfCompletion,
        percentOfLoanDrawn: forecast.percentOfLoanDrawn
      };
    } catch (error) {
      console.error('Error converting forecast map to LoanForecastData:', error);
      return null;
    }
  }

  private parseNumber(value: string): number {
    try {
      if (!value || value.trim() === '' || value.toUpperCase() === 'N/A') {
        return 0;
      }
      const cleanValue = value.replace(/[$,%\s]/g, '');
      return parseFloat(cleanValue) || 0;
    } catch (error) {
      console.warn('Could not parse number from value:', value);
      return 0;
    }
  }

  private parseInteger(value: string): number {
    try {
      if (!value || value.trim() === '' || value.toUpperCase() === 'N/A') {
        return 0;
      }
      const cleanValue = value.replace(/[%\s]/g, '');
      return parseInt(cleanValue) || 0;
    } catch (error) {
      console.warn('Could not parse integer from value:', value);
      return 0;
    }
  }

  private parseDate(dateStr: string): Date {
    if (!dateStr || dateStr.trim() === '' || dateStr.toUpperCase() === 'N/A') {
      return new Date();
    }

    try {
      // 处理 M/d/yy 或 MM/dd/yyyy 格式
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          let month = parseInt(parts[0]) - 1; // JavaScript月份从0开始
          const day = parseInt(parts[1]);
          let year = parseInt(parts[2]);

          // 处理两位数年份
          if (year < 100) {
            if (year < 50) {
              year += 2000;
            } else {
              year += 1900;
            }
          }

          return new Date(year, month, day);
        }
      }

      // 尝试标准格式
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }

      console.warn('Could not parse date:', dateStr, 'using current date');
      return new Date();
    } catch (error) {
      console.error('Error parsing date:', dateStr, error);
      return new Date();
    }
  }

  // 生成预测CSV
  generateForecastCsv(forecastDataList: LoanForecastData[], originalFileName: string): string {
    const baseName = originalFileName.replace(/\.[^.]*$/, ''); // 移除扩展名
    const outputFileName = `${baseName}_forecast.csv`;

    // 获取所有月份
    const allMonths = new Set<string>();
    for (const forecast of forecastDataList) {
      if (forecast.forecastData) {
        Object.keys(forecast.forecastData).forEach(month => allMonths.add(month));
      }
    }

    const months = Array.from(allMonths).sort((a, b) => {
      const dateA = new Date(`01-${a}`);
      const dateB = new Date(`01-${b}`);
      return dateA.getTime() - dateB.getTime();
    });

    // 构建CSV内容
    const baseHeaders = [
      'Loan Number', 'Loan Amount', 'Maturity Date', 'Extended Date',
      'Outstanding Balance', 'Undisbursed Amount', '% of Completion'
    ];

    const headers = [...baseHeaders, ...months];
    const csvRows = [headers.join(',')];

    // 计算列总和
    const columnSums: Record<string, number> = {};
    months.forEach(month => columnSums[month] = 0);

    // 添加数据行
    for (const forecast of forecastDataList) {
      if (!forecast.loanNumber || forecast.loanNumber.trim() === '') {
        continue;
      }

      const row = [
        forecast.loanNumber,
        forecast.loanAmount !== undefined && forecast.loanAmount !== null ? forecast.loanAmount.toString() : '',
        forecast.maturityDate || '', // Maturity Date
        forecast.extendedDate || '', // Extended Date
        forecast.outstandingBalance ?? '', // Outstanding Balance - 保留"0"值
        forecast.undisbursedAmount ?? '', // Undisbursed Amount - 保留"0"值
        forecast.percentOfCompletion ?? ''  // % of Completion - 保留"0"值
      ];

      // 添加预测数据
      for (const month of months) {
        const amount = forecast.forecastData?.[month] ?? 0;
        row.push(amount.toString());
        columnSums[month] += amount;
      }

      csvRows.push(row.join(','));
    }

    // 添加总和行
    const sumRow = ['SUM OF FORECAST'];
    for (let i = 1; i < baseHeaders.length; i++) {
      sumRow.push(''); // 基础列的空值
    }

    for (const month of months) {
      const sum = columnSums[month];
      sumRow.push(sum.toString()); // 保留0值
    }

    csvRows.push(sumRow.join(','));

    const csvContent = csvRows.join('\n');
    
    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    return url;
  }

  // 处理上传并生成预测（使用指定的batchId）
  async processUploadWithBatchId(file: File, startMonth: string, batchId: string): Promise<DataIngestionResponse> {
    try {
      // 处理CSV文件
      const csvDataList = await this.processCsvFile(file);
      
      // 转换为预测数据
      const forecastDataList = this.convertToLoanForecastData(csvDataList, startMonth);
      
      // 生成CSV下载链接
      const csvUrl = this.generateForecastCsv(forecastDataList, file.name);
      
      return {
        batchId,
        status: 'SUCCESS',
        totalRecords: csvDataList.length,
        processedRecords: forecastDataList.length,
        failedRecords: csvDataList.length - forecastDataList.length,
        message: 'Processing completed successfully',
        loanForecasts: forecastDataList,
        csvUrl // 添加CSV下载链接
      };
    } catch (error) {
      console.error('Processing failed:', error);
      return {
        batchId,
        status: 'FAILED',
        totalRecords: 0,
        processedRecords: 0,
        failedRecords: 0,
        message: error instanceof Error ? error.message : 'Processing failed',
        loanForecasts: []
      };
    }
  }

  // 处理上传并生成预测
  async processUpload(file: File, startMonth: string): Promise<DataIngestionResponse> {
    const batchId = this.generateBatchId();
    
    try {
      // 处理CSV文件
      const csvDataList = await this.processCsvFile(file);
      
      // 转换为预测数据
      const forecastDataList = this.convertToLoanForecastData(csvDataList, startMonth);
      
      // 生成CSV下载链接，传递原始CSV数据
      const csvUrl = this.generateForecastCsv(forecastDataList, file.name);
      
      return {
        batchId,
        status: 'SUCCESS',
        totalRecords: csvDataList.length,
        processedRecords: forecastDataList.length,
        failedRecords: csvDataList.length - forecastDataList.length,
        message: 'Processing completed successfully',
        loanForecasts: forecastDataList,
        csvUrl // 添加CSV下载链接
      };
    } catch (error) {
      console.error('Processing failed:', error);
      return {
        batchId,
        status: 'FAILED',
        totalRecords: 0,
        processedRecords: 0,
        failedRecords: 0,
        message: error instanceof Error ? error.message : 'Processing failed',
        loanForecasts: []
      };
    }
  }
}

// 导出单例实例
export const csvProcessor = new CsvProcessor(); 