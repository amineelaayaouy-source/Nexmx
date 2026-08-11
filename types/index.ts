export interface ModuleResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ProductInputData {
  id?: string;
  url: string;
  source: 'shopify' | 'aliexpress';
  timestamp: string;
}

export interface PipelineRun {
  id: string;
  productId: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Error' | 'Coming Soon';
  currentStage: string;
  startTime: string;
  endTime?: string;
}

export interface ErrorResponse {
  message: string;
  code?: string;
  details?: unknown;
}
