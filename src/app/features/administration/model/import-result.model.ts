export interface ImportResult {
  success: Array<{
    row: number;
    user: string;
  }>;
  errors: Array<{
    row: number;
    errors: string[];
  }>;
  total: number;
}

export interface ImportPreview {
  rowNumber: number;
  isValid: boolean;
  errors: string[];
  data: {
    [key: string]: any;
  };
}

export interface ImportDetail {
  row: number;
  user: string;
}

export interface ImportError {
  row: number;
  errors: string[];
}
