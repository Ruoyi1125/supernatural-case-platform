export interface Case {
  id: string
  case_name: string
  dynasty: string
  year: string
  location: string
  core_facts: string
  interaction_method: string
  judicial_functions: string
  official_strategy: string
  case_category: string
  evidence_status: string
  confidence: number
  created_at: string
  updated_at: string
}

export interface CaseSearchFilters {
  dynasty?: string
  case_category?: string
  interaction_method?: string
  evidence_status?: string
  confidence_min?: number
  confidence_max?: number
}

export interface AIExtractionRequest {
  raw_text: string
}

export interface AIExtractionResponse {
  success: boolean
  data?: Case
  error?: string
}

export interface CaseStats {
  total_cases: number
  dynasty_distribution: Record<string, number>
  category_distribution: Record<string, number>
  interaction_distribution: Record<string, number>
  average_confidence: number
  monthly_trends: Array<{
    month: string
    count: number
  }>
}

export interface CorrelationData {
  dynasty_interaction: Record<string, Record<string, number>>
  category_evidence: Record<string, Record<string, number>>
  confidence_trends: Array<{
    date: string
    confidence: number
  }>
}

export interface AIPerformanceMetrics {
  total_processed: number
  average_confidence: number
  average_processing_time: number
  success_rate: number
  daily_metrics: Array<{
    date: string
    processed: number
    avg_confidence: number
  }>
}