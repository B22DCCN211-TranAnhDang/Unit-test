export const validators = {
  required: (value: string, fieldName: string) => {
    if (!value || value.trim() === '') {
      return `Please enter ${fieldName}`;
    }
    return null;
  },

  positiveInteger: (value: string, fieldName: string) => {
    if (!value || value.trim() === '') return null;
    if (!/^[0-9]+$/.test(value)) {
      return `${fieldName} must be a positive integer`;
    }
    return null;
  },

  numeric: (value: string, fieldName: string) => {
    if (!value || value.trim() === '') return null;
    if (!/^[-+]?[0-9]+$/.test(value)) {
      return `${fieldName} must be a number`;
    }
    return null;
  },

  email: (value: string) => {
    if (!value || value.trim() === '') return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Invalid email format';
    }
    return null;
  },

  selectRequired: (value: string, fieldName: string) => {
    if (!value || value.trim() === '') {
      return `Please select ${fieldName}`;
    }
    return null;
  },

  multiSelectRequired: (value: unknown[], fieldName: string) => {
    if (!value || value.length === 0) {
      return `Please select at least one ${fieldName}`;
    }
    return null;
  },
};
