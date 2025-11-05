// ==================== FORMATADORES ====================

export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return 'Não informado';
  
  try {
    // Divide a string no formato YYYY-MM-DD
    const [year, month, day] = dateString.split('-');
    
    // Retorna no formato DD/MM/YYYY
    return `${day}/${month}/${year}`;
  } catch (error) {
    return 'Data inválida';
  }
};

export const formatDateLong = (dateString: string | undefined | null): string => {
  if (!dateString) return 'Data não informada';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data inválida';
    
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    return 'Data inválida';
  }
};

export const formatTime = (time: string | undefined | null): string => {
  if (!time) return '';
  const parts = time.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return time;
};

export const formatDuration = (minutes: number | undefined | null): string => {
  if (!minutes || minutes <= 0) return '0min';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}min`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}min`;
  }
};

export const parseCurrency = (formatted: string): number => {
  if (!formatted) return 0;
  const numbers = formatted.replace(/[^\d]/g, '');
  const value = parseFloat(numbers) / 100;
  return isNaN(value) ? 0 : value;
};

export const truncateText = (text: string | undefined | null, maxLength: number = 50): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const capitalizeWords = (text: string | undefined | null): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};