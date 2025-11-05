// backend/database.ts
import { 
  ref, 
  set, 
  get, 
  update, 
  remove, 
  push,
  query,
  orderByChild,
  equalTo,
} from 'firebase/database';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, database } from './config/firebaseConfig';

// ========================================
// INTERFACES / TYPES
// ========================================

export interface User {
  id: string;
  email: string;
  name: string;
  workshopName?: string;
}

export interface Client {
  id?: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  createdAt?: string;
}

export interface ServiceOrder {
  id?: string;
  userId: string;
  clientId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  totalValue?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Schedule {
  id?: string;
  userId: string;
  clientId: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt?: string;
}

export interface Product {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  category: string;
  quantity: number;
  minQuantity: number; // Alerta de estoque baixo
  unitPrice: number;
  supplier?: string;
  barcode?: string;
  location?: string; // Localização no estoque
  createdAt?: string;
  updatedAt?: string;
}

export interface StockMovement {
  id?: string;
  userId: string;
  productId: string;
  productName: string;
  type: 'in' | 'out'; // Entrada ou saída
  quantity: number;
  reason: string;
  relatedTo?: string; // ID da OS relacionada (se for saída)
  createdAt?: string;
}

// ========================================
// AUTENTICAÇÃO
// ========================================

/**
 * Registrar novo usuário
 */
export const registerUser = async (
  email: string,
  password: string,
  name: string,
  workshopName?: string
): Promise<User> => {
  try {
    console.log('📝 Registrando usuário:', email);
    
    // Criar usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    // Salvar dados adicionais no Realtime Database
    const userData = {
      email,
      name,
      workshopName: workshopName || '',
      createdAt: new Date().toISOString(),
    };

    await set(ref(database, `users/${userId}`), userData);
    
    console.log('✅ Usuário registrado com sucesso!');
    
    return {
      id: userId,
      email,
      name,
      workshopName,
    };
  } catch (error: any) {
    console.error('❌ Erro ao registrar:', error);
    throw new Error(error.message);
  }
};

/**
 * Login de usuário
 */
export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    console.log('🔐 Fazendo login:', email);
    
    // Autenticar com Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    // Buscar dados do usuário
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      throw new Error('Dados do usuário não encontrados');
    }

    const userData = snapshot.val();
    console.log('✅ Login bem-sucedido!');
    
    return {
      id: userId,
      ...userData,
    };
  } catch (error: any) {
    console.error('❌ Erro ao fazer login:', error);
    throw new Error(error.message);
  }
};

// Alias para compatibilidade
export const loginWithEmail = loginUser;

/**
 * Recuperar senha
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    console.log('📧 Enviando email de recuperação para:', email);
    await sendPasswordResetEmail(auth, email);
    console.log('✅ Email enviado com sucesso!');
  } catch (error: any) {
    console.error('❌ Erro ao enviar email:', error);
    throw new Error(error.message);
  }
};

// Alias para compatibilidade
export const resetPasswordByEmail = resetPassword;

/**
 * Logout
 */
export const logout = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
    console.log('👋 Logout realizado');
  } catch (error) {
    console.error('❌ Erro no logout:', error);
    throw error;
  }
};

// ========================================
// CLIENTES
// ========================================

/**
 * Buscar todos os clientes do usuário
 */
export const getClients = async (userId: string): Promise<Client[]> => {
  try {
    console.log('📋 Buscando clientes do usuário:', userId);
    
    const clientsRef = ref(database, 'clients');
    const clientsQuery = query(clientsRef, orderByChild('userId'), equalTo(userId));
    const snapshot = await get(clientsQuery);

    if (!snapshot.exists()) {
      console.log('ℹ️ Nenhum cliente encontrado');
      return [];
    }

    const clients: Client[] = [];
    snapshot.forEach((childSnapshot) => {
      clients.push({
        id: childSnapshot.key || undefined,
        ...childSnapshot.val(),
      });
    });

    console.log(`✅ ${clients.length} clientes encontrados`);
    return clients;
  } catch (error) {
    console.error('❌ Erro ao buscar clientes:', error);
    throw error;
  }
};

/**
 * Criar novo cliente
 */
export const createClient = async (client: Omit<Client, 'id'>): Promise<string> => {
  try {
    console.log('➕ Criando cliente:', client.name);
    
    const clientsRef = ref(database, 'clients');
    const newClientRef = push(clientsRef);
    
    // Remover campos undefined
    const clientData: any = {
      userId: client.userId,
      name: client.name,
      createdAt: new Date().toISOString(),
    };

    // Adicionar campos opcionais apenas se existirem
    if (client.email) clientData.email = client.email;
    if (client.phone) clientData.phone = client.phone;
    if (client.address) clientData.address = client.address;
    if (client.vehicleModel) clientData.vehicleModel = client.vehicleModel;
    if (client.vehiclePlate) clientData.vehiclePlate = client.vehiclePlate;

    await set(newClientRef, clientData);
    
    console.log('✅ Cliente criado com sucesso!');
    return newClientRef.key || '';
  } catch (error) {
    console.error('❌ Erro ao criar cliente:', error);
    throw error;
  }
};

/**
 * Atualizar cliente
 */
export const updateClient = async (
  clientId: string,
  updates: Partial<Client>
): Promise<void> => {
  try {
    console.log('✏️ Atualizando cliente:', clientId);
    
    const clientRef = ref(database, `clients/${clientId}`);
    await update(clientRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    
    console.log('✅ Cliente atualizado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao atualizar cliente:', error);
    throw error;
  }
};

/**
 * Excluir cliente
 */
export const deleteClient = async (clientId: string): Promise<void> => {
  try {
    console.log('🗑️ Excluindo cliente:', clientId);
    
    const clientRef = ref(database, `clients/${clientId}`);
    await remove(clientRef);
    
    console.log('✅ Cliente excluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao excluir cliente:', error);
    throw error;
  }
};

// ========================================
// ORDENS DE SERVIÇO
// ========================================

/**
 * Buscar todas as ordens de serviço do usuário
 */
export const getServiceOrders = async (userId: string): Promise<ServiceOrder[]> => {
  try {
    console.log('📋 Buscando ordens de serviço...');
    
    const ordersRef = ref(database, 'serviceOrders');
    const ordersQuery = query(ordersRef, orderByChild('userId'), equalTo(userId));
    const snapshot = await get(ordersQuery);

    if (!snapshot.exists()) {
      console.log('ℹ️ Nenhuma ordem encontrada');
      return [];
    }

    const orders: ServiceOrder[] = [];
    snapshot.forEach((childSnapshot) => {
      orders.push({
        id: childSnapshot.key || undefined,
        ...childSnapshot.val(),
      });
    });

    console.log(`✅ ${orders.length} ordens encontradas`);
    return orders;
  } catch (error) {
    console.error('❌ Erro ao buscar ordens:', error);
    throw error;
  }
};

/**
 * Criar nova ordem de serviço
 */
export const createServiceOrder = async (
  order: Omit<ServiceOrder, 'id'>
): Promise<string> => {
  try {
    console.log('➕ Criando ordem de serviço:', order.title);
    
    const ordersRef = ref(database, 'serviceOrders');
    const newOrderRef = push(ordersRef);
    
    // Remover campos undefined (Firebase não aceita)
    const orderData: any = {
      userId: order.userId,
      clientId: order.clientId,
      title: order.title,
      description: order.description || '',
      status: order.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Adicionar totalValue apenas se existir
    if (order.totalValue !== undefined && order.totalValue !== null) {
      orderData.totalValue = order.totalValue;
    }

    await set(newOrderRef, orderData);
    
    console.log('✅ Ordem criada com sucesso!');
    return newOrderRef.key || '';
  } catch (error) {
    console.error('❌ Erro ao criar ordem:', error);
    throw error;
  }
};

/**
 * Atualizar ordem de serviço
 */
export const updateServiceOrder = async (
  orderId: string,
  updates: Partial<ServiceOrder>
): Promise<void> => {
  try {
    console.log('✏️ Atualizando ordem:', orderId);
    
    const orderRef = ref(database, `serviceOrders/${orderId}`);
    await update(orderRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    
    console.log('✅ Ordem atualizada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao atualizar ordem:', error);
    throw error;
  }
};

/**
 * Excluir ordem de serviço
 */
export const deleteServiceOrder = async (orderId: string): Promise<void> => {
  try {
    console.log('🗑️ Excluindo ordem:', orderId);
    
    const orderRef = ref(database, `serviceOrders/${orderId}`);
    await remove(orderRef);
    
    console.log('✅ Ordem excluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao excluir ordem:', error);
    throw error;
  }
};

// ========================================
// AGENDAMENTOS
// ========================================

/**
 * Buscar todos os agendamentos do usuário
 */
export const getSchedules = async (userId: string): Promise<Schedule[]> => {
  try {
    console.log('📅 Buscando agendamentos...');
    
    const schedulesRef = ref(database, 'schedules');
    const schedulesQuery = query(schedulesRef, orderByChild('userId'), equalTo(userId));
    const snapshot = await get(schedulesQuery);

    if (!snapshot.exists()) {
      console.log('ℹ️ Nenhum agendamento encontrado');
      return [];
    }

    const schedules: Schedule[] = [];
    snapshot.forEach((childSnapshot) => {
      schedules.push({
        id: childSnapshot.key || undefined,
        ...childSnapshot.val(),
      });
    });

    console.log(`✅ ${schedules.length} agendamentos encontrados`);
    return schedules;
  } catch (error) {
    console.error('❌ Erro ao buscar agendamentos:', error);
    throw error;
  }
};

/**
 * Criar novo agendamento
 */
export const createSchedule = async (
  schedule: Omit<Schedule, 'id'>
): Promise<string> => {
  try {
    console.log('➕ Criando agendamento:', schedule.title);
    
    const schedulesRef = ref(database, 'schedules');
    const newScheduleRef = push(schedulesRef);
    
    // Remover campos undefined
    const scheduleData: any = {
      userId: schedule.userId,
      clientId: schedule.clientId,
      title: schedule.title,
      description: schedule.description || '',
      date: schedule.date,
      time: schedule.time,
      status: schedule.status,
      createdAt: new Date().toISOString(),
    };

    await set(newScheduleRef, scheduleData);
    
    console.log('✅ Agendamento criado com sucesso!');
    return newScheduleRef.key || '';
  } catch (error) {
    console.error('❌ Erro ao criar agendamento:', error);
    throw error;
  }
};

/**
 * Atualizar agendamento
 */
export const updateSchedule = async (
  scheduleId: string,
  updates: Partial<Schedule>
): Promise<void> => {
  try {
    console.log('✏️ Atualizando agendamento:', scheduleId);
    
    const scheduleRef = ref(database, `schedules/${scheduleId}`);
    await update(scheduleRef, updates);
    
    console.log('✅ Agendamento atualizado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao atualizar agendamento:', error);
    throw error;
  }
};

/**
 * Excluir agendamento
 */
export const deleteSchedule = async (scheduleId: string): Promise<void> => {
  try {
    console.log('🗑️ Excluindo agendamento:', scheduleId);
    
    const scheduleRef = ref(database, `schedules/${scheduleId}`);
    await remove(scheduleRef);
    
    console.log('✅ Agendamento excluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao excluir agendamento:', error);
    throw error;
  }
};

// ========================================
// ALIASES PARA COMPATIBILIDADE
// ========================================
export const registerWithEmail = registerUser;

// ========================================
// ESTOQUE / PRODUTOS
// ========================================

/**
 * Buscar todos os produtos do usuário
 */
export const getProducts = async (userId: string): Promise<Product[]> => {
  try {
    console.log('📦 Buscando produtos...');
    
    const productsRef = ref(database, 'products');
    const productsQuery = query(productsRef, orderByChild('userId'), equalTo(userId));
    const snapshot = await get(productsQuery);

    if (!snapshot.exists()) {
      console.log('ℹ️ Nenhum produto encontrado');
      return [];
    }

    const products: Product[] = [];
    snapshot.forEach((childSnapshot) => {
      products.push({
        id: childSnapshot.key || undefined,
        ...childSnapshot.val(),
      });
    });

    console.log(`✅ ${products.length} produtos encontrados`);
    return products;
  } catch (error) {
    console.error('❌ Erro ao buscar produtos:', error);
    throw error;
  }
};

/**
 * Criar novo produto
 */
export const createProduct = async (
  product: Omit<Product, 'id'>
): Promise<string> => {
  try {
    console.log('➕ Criando produto:', product.name);
    
    const productsRef = ref(database, 'products');
    const newProductRef = push(productsRef);
    
    const productData: any = {
      userId: product.userId,
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      minQuantity: product.minQuantity,
      unitPrice: product.unitPrice,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Campos opcionais
    if (product.description) productData.description = product.description;
    if (product.supplier) productData.supplier = product.supplier;
    if (product.barcode) productData.barcode = product.barcode;
    if (product.location) productData.location = product.location;

    await set(newProductRef, productData);
    
    console.log('✅ Produto criado com sucesso!');
    return newProductRef.key || '';
  } catch (error) {
    console.error('❌ Erro ao criar produto:', error);
    throw error;
  }
};

/**
 * Atualizar produto
 */
export const updateProduct = async (
  productId: string,
  updates: Partial<Product>
): Promise<void> => {
  try {
    console.log('✏️ Atualizando produto:', productId);
    
    const productRef = ref(database, `products/${productId}`);
    await update(productRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    
    console.log('✅ Produto atualizado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao atualizar produto:', error);
    throw error;
  }
};

/**
 * Excluir produto
 */
export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    console.log('🗑️ Excluindo produto:', productId);
    
    const productRef = ref(database, `products/${productId}`);
    await remove(productRef);
    
    console.log('✅ Produto excluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao excluir produto:', error);
    throw error;
  }
};

/**
 * Ajustar estoque (entrada ou saída)
 */
export const adjustStock = async (
  productId: string,
  quantity: number,
  type: 'in' | 'out',
  reason: string,
  userId: string,
  productName: string,
  relatedTo?: string
): Promise<void> => {
  try {
    console.log(`📦 Ajustando estoque: ${type === 'in' ? '+' : '-'}${quantity}`);
    
    // 1. Atualizar quantidade do produto
    const productRef = ref(database, `products/${productId}`);
    const productSnapshot = await get(productRef);
    
    if (!productSnapshot.exists()) {
      throw new Error('Produto não encontrado');
    }
    
    const currentQuantity = productSnapshot.val().quantity;
    const newQuantity = type === 'in' ? currentQuantity + quantity : currentQuantity - quantity;
    
    if (newQuantity < 0) {
      throw new Error('Quantidade insuficiente em estoque');
    }
    
    await update(productRef, {
      quantity: newQuantity,
      updatedAt: new Date().toISOString(),
    });
    
    // 2. Registrar movimentação
    const movementsRef = ref(database, 'stockMovements');
    const newMovementRef = push(movementsRef);
    
    const movementData: any = {
      userId,
      productId,
      productName,
      type,
      quantity,
      reason,
      createdAt: new Date().toISOString(),
    };
    
    if (relatedTo) movementData.relatedTo = relatedTo;
    
    await set(newMovementRef, movementData);
    
    console.log('✅ Estoque ajustado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao ajustar estoque:', error);
    throw error;
  }
};

/**
 * Buscar movimentações de estoque
 */
export const getStockMovements = async (userId: string): Promise<StockMovement[]> => {
  try {
    console.log('📊 Buscando movimentações...');
    
    const movementsRef = ref(database, 'stockMovements');
    const movementsQuery = query(movementsRef, orderByChild('userId'), equalTo(userId));
    const snapshot = await get(movementsQuery);

    if (!snapshot.exists()) {
      console.log('ℹ️ Nenhuma movimentação encontrada');
      return [];
    }

    const movements: StockMovement[] = [];
    snapshot.forEach((childSnapshot) => {
      movements.push({
        id: childSnapshot.key || undefined,
        ...childSnapshot.val(),
      });
    });

    // Ordenar por data (mais recentes primeiro)
    movements.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    console.log(`✅ ${movements.length} movimentações encontradas`);
    return movements;
  } catch (error) {
    console.error('❌ Erro ao buscar movimentações:', error);
    throw error;
  }
};