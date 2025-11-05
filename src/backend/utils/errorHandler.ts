import { ERROR_MESSAGES } from '../..';

// ==================== TIPOS DE ERRO ====================

export interface AppError {
  title: string;
  message: string;
  code?: string;
}

// ==================== FIREBASE AUTH ERRORS ====================

export const handleAuthError = (error: any): AppError => {
  const errorCode = error?.code || '';
  
  switch (errorCode) {
    case 'auth/user-not-found':
      return {
        title: 'Usuário não encontrado',
        message: 'Este email não está cadastrado no sistema.',
        code: errorCode,
      };
      
    case 'auth/wrong-password':
      return {
        title: 'Senha incorreta',
        message: 'A senha digitada está incorreta.',
        code: errorCode,
      };
      
    case 'auth/email-already-in-use':
      return {
        title: 'Email em uso',
        message: 'Este email já está cadastrado.',
        code: errorCode,
      };
      
    case 'auth/invalid-email':
      return {
        title: 'Email inválido',
        message: 'Digite um email válido.',
        code: errorCode,
      };
      
    case 'auth/weak-password':
      return {
        title: 'Senha fraca',
        message: 'A senha deve ter pelo menos 6 caracteres.',
        code: errorCode,
      };
      
    case 'auth/too-many-requests':
      return {
        title: 'Muitas tentativas',
        message: 'Aguarde alguns minutos antes de tentar novamente.',
        code: errorCode,
      };
      
    case 'auth/network-request-failed':
      return {
        title: 'Erro de conexão',
        message: ERROR_MESSAGES.NETWORK,
        code: errorCode,
      };
      
    case 'auth/user-disabled':
      return {
        title: 'Conta desativada',
        message: 'Esta conta foi desativada. Entre em contato com o suporte.',
        code: errorCode,
      };
      
    case 'auth/operation-not-allowed':
      return {
        title: 'Operação não permitida',
        message: 'Esta operação não está habilitada. Entre em contato com o suporte.',
        code: errorCode,
      };
      
    default:
      return {
        title: 'Erro de autenticação',
        message: error?.message || ERROR_MESSAGES.UNKNOWN,
        code: errorCode,
      };
  }
};

// ==================== FIRESTORE ERRORS ====================

export const handleFirestoreError = (error: any): AppError => {
  const errorCode = error?.code || '';
  
  switch (errorCode) {
    case 'permission-denied':
      return {
        title: 'Permissão negada',
        message: ERROR_MESSAGES.PERMISSION_DENIED,
        code: errorCode,
      };
      
    case 'not-found':
      return {
        title: 'Não encontrado',
        message: 'O documento solicitado não foi encontrado.',
        code: errorCode,
      };
      
    case 'already-exists':
      return {
        title: 'Já existe',
        message: 'Este registro já existe no sistema.',
        code: errorCode,
      };
      
    case 'resource-exhausted':
      return {
        title: 'Limite excedido',
        message: 'Você atingiu o limite de operações. Tente novamente mais tarde.',
        code: errorCode,
      };
      
    case 'failed-precondition':
      return {
        title: 'Operação inválida',
        message: 'A operação não pode ser executada no estado atual.',
        code: errorCode,
      };
      
    case 'aborted':
      return {
        title: 'Operação abortada',
        message: 'A operação foi cancelada devido a um conflito.',
        code: errorCode,
      };
      
    case 'out-of-range':
      return {
        title: 'Valor inválido',
        message: 'O valor fornecido está fora do intervalo permitido.',
        code: errorCode,
      };
      
    case 'unimplemented':
      return {
        title: 'Não implementado',
        message: 'Esta operação ainda não está disponível.',
        code: errorCode,
      };
      
    case 'internal':
      return {
        title: 'Erro interno',
        message: 'Erro interno do servidor. Tente novamente.',
        code: errorCode,
      };
      
    case 'unavailable':
      return {
        title: 'Serviço indisponível',
        message: 'O serviço está temporariamente indisponível.',
        code: errorCode,
      };
      
    case 'data-loss':
      return {
        title: 'Perda de dados',
        message: 'Dados irrecuperáveis foram perdidos ou corrompidos.',
        code: errorCode,
      };
      
    case 'unauthenticated':
      return {
        title: 'Não autenticado',
        message: 'Você precisa estar autenticado para esta operação.',
        code: errorCode,
      };
      
    default:
      return {
        title: 'Erro no banco de dados',
        message: error?.message || ERROR_MESSAGES.UNKNOWN,
        code: errorCode,
      };
  }
};

// ==================== NETWORK ERRORS ====================

export const handleNetworkError = (error: any): AppError => {
  if (!navigator.onLine) {
    return {
      title: 'Sem conexão',
      message: 'Você está offline. Verifique sua conexão com a internet.',
      code: 'network/offline',
    };
  }
  
  if (error?.message?.includes('timeout')) {
    return {
      title: 'Tempo esgotado',
      message: 'A operação demorou muito. Tente novamente.',
      code: 'network/timeout',
    };
  }
  
  return {
    title: 'Erro de rede',
    message: ERROR_MESSAGES.NETWORK,
    code: 'network/unknown',
  };
};

// ==================== VALIDATION ERRORS ====================

export const handleValidationError = (field: string, type: string): AppError => {
  const validationMessages: Record<string, Record<string, string>> = {
    name: {
      required: 'O nome é obrigatório.',
      minLength: 'O nome deve ter pelo menos 2 caracteres.',
      maxLength: 'O nome é muito longo.',
    },
    email: {
      required: 'O email é obrigatório.',
      invalid: ERROR_MESSAGES.INVALID_EMAIL,
    },
    phone: {
      required: 'O telefone é obrigatório.',
      invalid: ERROR_MESSAGES.INVALID_PHONE,
    },
    password: {
      required: 'A senha é obrigatória.',
      minLength: ERROR_MESSAGES.INVALID_PASSWORD,
      mismatch: 'As senhas não coincidem.',
    },
    client: {
      required: 'Selecione um cliente.',
      notFound: ERROR_MESSAGES.CLIENT_NOT_FOUND,
    },
    title: {
      required: 'O título é obrigatório.',
      minLength: 'O título deve ter pelo menos 3 caracteres.',
    },
    date: {
      required: 'A data é obrigatória.',
      invalid: 'Selecione uma data válida.',
      past: 'A data não pode ser no passado.',
    },
    time: {
      required: 'O horário é obrigatório.',
      invalid: 'Digite um horário válido (ex: 14:30).',
    },
    duration: {
      required: 'A duração é obrigatória.',
      invalid: 'A duração deve ser entre 15 e 480 minutos.',
    },
  };
  
  const message = validationMessages[field]?.[type] || ERROR_MESSAGES.REQUIRED_FIELD;
  
  return {
    title: 'Campo inválido',
    message,
    code: `validation/${field}/${type}`,
  };
};

// ==================== GENERIC ERROR HANDLER ====================

export const handleError = (error: any, context?: string): AppError => {
  console.error(`Error in ${context || 'unknown context'}:`, error);
  
  // Verifica o tipo de erro
  if (error?.code?.startsWith('auth/')) {
    return handleAuthError(error);
  }
  
  if (error?.code?.startsWith('firestore/') || error?.code === 'permission-denied') {
    return handleFirestoreError(error);
  }
  
  if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
    return handleNetworkError(error);
  }
  
  // Erro genérico
  return {
    title: 'Erro',
    message: error?.message || ERROR_MESSAGES.UNKNOWN,
    code: error?.code,
  };
};

// ==================== HELPERS ====================

export const isNetworkError = (error: any): boolean => {
  return (
    !navigator.onLine ||
    error?.code === 'network/offline' ||
    error?.code === 'auth/network-request-failed' ||
    error?.message?.includes('network')
  );
};

export const isAuthError = (error: any): boolean => {
  return error?.code?.startsWith('auth/');
};

export const isPermissionError = (error: any): boolean => {
  return (
    error?.code === 'permission-denied' ||
    error?.code === 'auth/user-disabled'
  );
};

export const shouldRetry = (error: any): boolean => {
  return (
    isNetworkError(error) ||
    error?.code === 'unavailable' ||
    error?.code === 'resource-exhausted'
  );
};

// ==================== ERROR LOGGING ====================

export const logError = (
  error: any,
  context: string,
  additionalInfo?: Record<string, any>
): void => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    },
    ...additionalInfo,
  };
  
  // Em produção, você pode enviar para um serviço de logging
  console.error('Error logged:', errorInfo);
  
  // TODO: Integrar com serviço de logging (Sentry, LogRocket, etc)
};

// ==================== ERROR RETRY LOGIC ====================

export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (!shouldRetry(error) || attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  
  throw lastError;
};