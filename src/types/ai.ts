/**
 * AI Service Shared Types
 */

export interface SummaryResult {
  summary: string;
  success: boolean;
  error?: string;
}

export interface BookSummaryInput {
  title: string;
  author: string;
}

export interface SummaryOptions {
  maxLength?: number;
  language?: 'vi' | 'en';
}
