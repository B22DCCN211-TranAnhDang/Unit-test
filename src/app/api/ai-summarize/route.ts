import { ValidationError } from '@/lib/errors';
import { handleRouteError, successResponse } from '@/lib/utils';
import { requireLibrarian } from '@/middleware/auth.middleware';
import { GeminiService, ollamaSummaryService } from '@/services';
import { NextRequest } from 'next/server';

// Configure route segment for longer processing
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * POST /api/ai-summarize
 *
 * Generate AI summary for a book based on title and author using Ollama.
 *
 * Request body (JSON):
 * - title: string (required) - Book title
 * - author: string (required) - Book author
 * - language: 'vi' | 'en' (optional, default: 'en')
 * - maxLength: number (optional, default: 200)
 *
 * Response:
 * - summary: string
 * - bookInfo: { title, author }
 */
export const POST = requireLibrarian(async (request: NextRequest) => {
  try {
    // Parse JSON body
    const body = await request.json();
    const { title, author, language = 'vi', maxLength = 200 } = body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim() === '') {
      throw new ValidationError('Title is required and must be a non-empty string.');
    }

    if (!author || typeof author !== 'string' || author.trim() === '') {
      throw new ValidationError('Author is required and must be a non-empty string.');
    }

    let summary = '';
    let usedService = '';

    // 1. Try Gemini first if configured
    if (GeminiService.isConfigured()) {
      const geminiResult = await GeminiService.generateBookSummary(
        { title: title.trim(), author: author.trim() },
        { maxLength, language }
      );
      if (geminiResult.success) {
        summary = geminiResult.summary;
        usedService = 'Gemini';
      }
    }

    // 2. Fallback to Ollama if Gemini failed or is not configured
    if (!summary) {
      const isOllamaAvailable = await ollamaSummaryService.isAvailable();
      if (isOllamaAvailable) {
        const ollamaResult = await ollamaSummaryService.generateBookSummary(
          { title: title.trim(), author: author.trim() },
          { maxLength, language }
        );
        if (ollamaResult.success) {
          summary = ollamaResult.summary;
          usedService = 'Ollama';
        }
      }
    }

    // 3. If no service worked
    if (!summary) {
      throw new ValidationError(
        'Both Gemini and Ollama services are unavailable. Please check your configuration.'
      );
    }

    console.log(`[AI Summarize] Summary generated using ${usedService}`);

    return successResponse({
      summary,
      usedService,
      bookInfo: {
        title: title.trim(),
        author: author.trim(),
      },
    });
  } catch (error) {
    return handleRouteError(error, 'POST /api/ai-summarize');
  }
});
