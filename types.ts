
export interface SummaryResult {
  originalText: string;
  summary: string;
  timestamp: number;
}

export enum SummarizationTone {
  EXECUTIVE = 'Executive Summary',
  LITIGATION = 'Litigation Focus',
  COMPLIANCE = 'Compliance Highlights',
  SIMPLE = 'Plain English'
}
