// Global type declarations for pywebview API
declare global {
  interface Window {
    pywebview?: {
      api?: {
        download_csv: (csvContent: string, filename: string) => Promise<{
          success: boolean;
          message: string;
          path?: string;
        }>;
      };
    };
  }
}

export {}; 