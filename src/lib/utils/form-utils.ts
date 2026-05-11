import { toaster } from '@/components';

// Form submission handler
export interface FormSubmissionOptions<T, TData = unknown, TResult = unknown> {
  validate: () => string | null;
  transformData: (formData: T) => TData;
  apiCall: (transformedData: TData) => Promise<TResult>;
  onSuccess?: (result: TResult) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

// Form submission handler with error handling and toast notifications
export async function handleFormSubmission<T, TData = unknown, TResult = unknown>(
  formData: T,
  options: FormSubmissionOptions<T, TData, TResult>
): Promise<boolean> {
  const {
    validate,
    transformData,
    apiCall,
    onSuccess,
    onError,
    successMessage = 'Operation completed successfully',
    errorMessage = 'Operation failed',
  } = options;

  // Validate form data
  const validationError = validate();
  if (validationError) {
    return false;
  }

  try {
    // Transform data
    const transformedData = transformData(formData);

    // Make API call
    const result = await apiCall(transformedData);

    // Show success message
    toaster.create({
      title: 'Success',
      description: successMessage,
      type: 'success',
    });

    // Call success callback
    if (onSuccess) {
      await Promise.resolve(onSuccess(result));
    }

    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : errorMessage;

    // Show error message
    toaster.create({
      title: 'Failed',
      description: errorMsg,
      type: 'error',
    });

    // Call error callback
    onError?.(error as Error);

    return false;
  }
}

// Data transformation utilities
export const transformers = {
  trimString: (value: string) => value.trim() || null,

  parseNumber: (value: string) => (value ? Number(value) : null),

  parsePositiveInteger: (value: string) => {
    const num = Number(value);
    return num > 0 ? num : null;
  },

  sanitizeFormData: <T extends Record<string, unknown>>(data: T): T => {
    const sanitized = { ...data };

    for (const key in sanitized) {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = (sanitized[key] as string).trim() as T[Extract<keyof T, string>];
      }
    }

    return sanitized;
  },
};
