// ==================== VALIDADORES ====================

export const validateEmail = (email: string): boolean => {
  if (!email || !email.trim()) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const validatePhone = (phone: string): boolean => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};

export const validatePassword = (password: string, minLength: number = 6): boolean => {
  if (!password) return false;
  return password.length >= minLength;
};

export const validateName = (name: string): boolean => {
  if (!name || !name.trim()) return false;
  return name.trim().length >= 2;
};

export const validateDate = (dateString: string, allowPast: boolean = false): boolean => {
  if (!dateString) return false;
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  
  if (!allowPast) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(dateString);
    inputDate.setHours(0, 0, 0, 0);
    return inputDate >= today;
  }
  
  return true;
};

export const validateTime = (timeString: string): boolean => {
  if (!timeString) return false;
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
  return timeRegex.test(timeString);
};

export const validateRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  
  if (typeof value === 'number') {
    return !isNaN(value);
  }
  
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  
  return true;
};

export const validateLength = (text: string, minLength: number, maxLength?: number): boolean => {
  if (!text) return false;
  const length = text.trim().length;
  
  if (maxLength !== undefined) {
    return length >= minLength && length <= maxLength;
  }
  
  return length >= minLength;
};

export const validatePositiveNumber = (value: number, allowZero: boolean = true): boolean => {
  if (value === undefined || value === null || isNaN(value)) return false;
  
  if (allowZero) {
    return value >= 0;
  } else {
    return value > 0;
  }
};

export const validateRange = (value: number, min: number, max: number): boolean => {
  if (value === undefined || value === null || isNaN(value)) return false;
  return value >= min && value <= max;
};

export const validateDuration = (
  duration: number, 
  minDuration: number = 15, 
  maxDuration: number = 480
): boolean => {
  return validateRange(duration, minDuration, maxDuration);
};