// frontend/screens/ServiceOrdersScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { 
  getServiceOrders, 
  getClients,
  createServiceOrder,
  updateServiceOrder,
  deleteServiceOrder,
  createSchedule,  // ✅ ADICIONADO - Import estático
  ServiceOrder,
  Client,
} from '../../backend/database';

export default function ServiceOrdersScreen({ route, navigation }: any) {
  const { user } = route.params;
  
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    clientId: '',
    title: '',
    description: '',
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled',
    totalValue: '',
    scheduleDate: '', // NOVO: Data do agendamento (YYYY-MM-DD)
    scheduleTime: '', // NOVO: Hora do agendamento (HH:MM)
    createSchedule: false, // NOVO: Flag para criar agendamento automático
  });

  // 🔄 AUTO-REFRESH: Recarrega quando a tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 ServiceOrdersScreen focada - recarregando ordens...');
      loadOrders();
    }, [])
  );

  useEffect(() => {
    filterOrders();
  }, [orders, filterStatus, searchQuery]);

  const loadOrders = async () => {
    try {
      console.log('📋 Carregando ordens de serviço...');
      setIsLoading(true);
      
      const [ordersData, clientsData] = await Promise.all([
        getServiceOrders(user.id),
        getClients(user.id),
      ]);
      
      // Ordenar por data (mais recentes primeiro)
      const sortedOrders = ordersData.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      setOrders(sortedOrders);
      setClients(clientsData);
      
      console.log(`✅ ${sortedOrders.length} ordens carregadas`);
    } catch (error) {
      console.error('❌ Erro ao carregar ordens:', error);
      if (Platform.OS === 'web') {
        window.alert('Erro ao carregar ordens de serviço');
      } else {
        Alert.alert('Erro', 'Não foi possível carregar as ordens');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filtrar por status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === filterStatus);
    }

    // Filtrar por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => {
        const client = clients.find(c => c.id === order.clientId);
        return (
          order.title.toLowerCase().includes(query) ||
          order.description?.toLowerCase().includes(query) ||
          client?.name.toLowerCase().includes(query)
        );
      });
    }

    setFilteredOrders(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleCreate = async () => {
    if (!formData.clientId || !formData.title.trim()) {
      const message = 'Cliente e título são obrigatórios';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Atenção', message);
      }
      return;
    }

    // Validar data e hora se optar por criar agendamento
    if (formData.createSchedule) {
      if (!formData.scheduleDate || !formData.scheduleTime) {
        const message = 'Data e hora são obrigatórias para criar agendamento';
        if (Platform.OS === 'web') {
          window.alert(message);
        } else {
          Alert.alert('Atenção', message);
        }
        return;
      }
    }

    try {
      console.log('➕ Criando ordem de serviço...');
      
      const orderData: Omit<ServiceOrder, 'id'> = {
        userId: user.id,
        clientId: formData.clientId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        totalValue: formData.totalValue ? parseFloat(formData.totalValue) : undefined,
      };

      await createServiceOrder(orderData);

      // 📅 CRIAR AGENDAMENTO AUTOMÁTICO (SE MARCADO)
      if (formData.createSchedule && formData.scheduleDate && formData.scheduleTime) {
        console.log('📅 Criando agendamento automático...');
        
        // ✅ CORRIGIDO - Usa o import do topo, não mais await import()
        await createSchedule({
          userId: user.id,
          clientId: formData.clientId,
          title: formData.title.trim(),
          description: formData.description.trim() || 'Agendamento automático da OS',
          date: formData.scheduleDate,
          time: formData.scheduleTime,
          status: 'pending',
        });
        
        console.log('✅ Agendamento criado automaticamente!');
      }
      
      const message = formData.createSchedule 
        ? 'Ordem e agendamento criados com sucesso!' 
        : 'Ordem criada com sucesso!';
      
      if (Platform.OS === 'web') {
        window.alert('✅ ' + message);
      } else {
        Alert.alert('✅ Sucesso', message);
      }
      
      setModalVisible(false);
      resetForm();
      loadOrders();
    } catch (error) {
      console.error('❌ Erro ao criar ordem:', error);
      const message = 'Não foi possível criar a ordem';
      if (Platform.OS === 'web') {
        window.alert('Erro: ' + message);
      } else {
        Alert.alert('Erro', message);
      }
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: ServiceOrder['status']) => {
    try {
      console.log('✏️ Atualizando status da ordem:', orderId);
      await updateServiceOrder(orderId, { status: newStatus });
      loadOrders();
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      title: '',
      description: '',
      status: 'pending',
      totalValue: '',
      scheduleDate: '',
      scheduleTime: '',
      createSchedule: false,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#F59E0B';
      case 'pending': return '#EF4444';
      case 'cancelled': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'in_progress': return 'Em Andamento';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'pending': return '⏳';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Data não disponível';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Cliente não encontrado';
  };

  const renderOrderCard = ({ item }: { item: ServiceOrder }) => {
    const client = clients.find(c => c.id === item.clientId);
    
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('ServiceOrderDetails', { order: item, user, client })}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderTitleContainer}>
            <Text style={styles.orderIcon}>{getStatusIcon(item.status)}</Text>
            <View style={styles.orderTitleTextContainer}>
              <Text style={styles.orderTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.orderClient}>{getClientName(item.clientId)}</Text>
            </View>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.orderDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.orderFooter}>
          <Text style={styles.orderDate}>📅 {formatDate(item.createdAt)}</Text>
          {item.totalValue ? (
            <Text style={styles.orderValue}>R$ {item.totalValue.toFixed(2)}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>Nenhuma ordem encontrada</Text>
      <Text style={styles.emptyText}>
        {filterStatus !== 'all' 
          ? 'Não há ordens com este status'
          : 'Crie sua primeira ordem de serviço'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#6366F1', '#4F46E5']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Ordens de Serviço</Text>
            <Text style={styles.headerSubtitle}>
              {filteredOrders.length} {filteredOrders.length === 1 ? 'ordem' : 'ordens'}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar ordens..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('all')}
          >
            <Text style={[styles.filterText, filterStatus === 'all' && styles.filterTextActive]}>
              Todas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'pending' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('pending')}
          >
            <Text style={[styles.filterText, filterStatus === 'pending' && styles.filterTextActive]}>
              ⏳ Pendentes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'in_progress' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('in_progress')}
          >
            <Text style={[styles.filterText, filterStatus === 'in_progress' && styles.filterTextActive]}>
              🔄 Em Andamento
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'completed' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('completed')}
          >
            <Text style={[styles.filterText, filterStatus === 'completed' && styles.filterTextActive]}>
              ✅ Concluídas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'cancelled' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('cancelled')}
          >
            <Text style={[styles.filterText, filterStatus === 'cancelled' && styles.filterTextActive]}>
              ❌ Canceladas
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item.id || ''}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#6366F1"
          />
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Ordem de Serviço</Text>
              <TouchableOpacity onPress={() => {
                setModalVisible(false);
                resetForm();
              }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>👤 Cliente *</Text>
                <View style={styles.pickerContainer}>
                  <select
                    style={styles.picker as any}
                    value={formData.clientId}
                    onChange={(e: any) => setFormData({ ...formData, clientId: e.target.value })}
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>📋 Título *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ex: Troca de óleo"
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>📝 Descrição</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="Descreva os serviços..."
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>📊 Status</Text>
                <View style={styles.pickerContainer}>
                  <select
                    style={styles.picker as any}
                    value={formData.status}
                    onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="pending">⏳ Pendente</option>
                    <option value="in_progress">🔄 Em Andamento</option>
                    <option value="completed">✅ Concluída</option>
                    <option value="cancelled">❌ Cancelada</option>
                  </select>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>💰 Valor Total (R$)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="0.00"
                  value={formData.totalValue}
                  onChangeText={(text) => {
                    const numericText = text.replace(/[^0-9.]/g, '');
                    setFormData({ ...formData, totalValue: numericText });
                  }}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* NOVO: Opção de criar agendamento */}
              <View style={styles.scheduleSection}>
                <View style={styles.scheduleSectionHeader}>
                  <Text style={styles.scheduleSectionTitle}>📅 Agendar automaticamente?</Text>
                  <TouchableOpacity
                    style={[styles.toggleButton, formData.createSchedule && styles.toggleButtonActive]}
                    onPress={() => setFormData({ ...formData, createSchedule: !formData.createSchedule })}
                  >
                    <Text style={[styles.toggleButtonText, formData.createSchedule && styles.toggleButtonTextActive]}>
                      {formData.createSchedule ? 'SIM' : 'NÃO'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {formData.createSchedule && (
                  <>
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.formLabel}>📅 Data *</Text>
                        <TextInput
                          style={styles.formInput}
                          placeholder="YYYY-MM-DD"
                          value={formData.scheduleDate}
                          onChangeText={(text) => setFormData({ ...formData, scheduleDate: text })}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.formLabel}>🕐 Hora *</Text>
                        <TextInput
                          style={styles.formInput}
                          placeholder="HH:MM"
                          value={formData.scheduleTime}
                          onChangeText={(text) => setFormData({ ...formData, scheduleTime: text })}
                        />
                      </View>
                    </View>
                    <Text style={styles.scheduleHint}>
                      💡 Um agendamento será criado automaticamente
                    </Text>
                  </>
                )}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleCreate}
                >
                  <LinearGradient
                    colors={['#6366F1', '#4F46E5']}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>Criar Ordem</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#FFFFFF',
  },
  filterContainer: {
    paddingHorizontal: 20,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  filterTextActive: {
    color: '#6366F1',
  },
  listContent: {
    padding: 20,
    flexGrow: 1,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  orderIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  orderTitleTextContainer: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  orderClient: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  orderDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  orderDate: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  orderValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalClose: {
    fontSize: 28,
    color: '#9CA3AF',
    fontWeight: '300',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 50,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'transparent',
  } as any,
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scheduleSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DBEAFE',
  },
  scheduleSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  toggleButtonActive: {
    backgroundColor: '#6366F1',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  scheduleHint: {
    fontSize: 13,
    color: '#3B82F6',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
