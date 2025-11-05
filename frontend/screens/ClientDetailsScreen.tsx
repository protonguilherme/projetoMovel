// frontend/screens/ClientDetailsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Linking,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  getServiceOrders, 
  getSchedules,
  updateClient,
  deleteClient,
  ServiceOrder,
  Schedule,
  Client,
} from '../../backend/database';

export default function ClientDetailsScreen({ route, navigation }: any) {
  const { client: initialClient, user } = route.params;
  
  const [client, setClient] = useState<Client>(initialClient);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  
  const [formData, setFormData] = useState({
    name: client.name || '',
    phone: client.phone || '',
    email: client.email || '',
    address: client.address || '',
    vehicleModel: client.vehicleModel || '',
    vehiclePlate: client.vehiclePlate || '',
  });

  useEffect(() => {
    loadClientData();
  }, []);

  const loadClientData = async () => {
    try {
      console.log('📊 Carregando dados do cliente...');
      
      const [allOrders, allSchedules] = await Promise.all([
        getServiceOrders(user.id),
        getSchedules(user.id),
      ]);

      const clientOrders = allOrders.filter(o => o.clientId === client.id);
      const clientSchedules = allSchedules.filter(s => s.clientId === client.id);

      setOrders(clientOrders);
      setSchedules(clientSchedules);
      
      console.log(`✅ ${clientOrders.length} ordens, ${clientSchedules.length} agendamentos`);
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = () => {
    if (!client.phone) {
      Alert.alert('Atenção', 'Este cliente não possui telefone cadastrado');
      return;
    }
    const phoneNumber = client.phone.replace(/\D/g, '');
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleWhatsApp = () => {
    if (!client.phone) {
      Alert.alert('Atenção', 'Este cliente não possui telefone cadastrado');
      return;
    }
    const phoneNumber = client.phone.replace(/\D/g, '');
    Linking.openURL(`whatsapp://send?phone=55${phoneNumber}`);
  };

  const handleEmail = () => {
    if (!client.email) {
      Alert.alert('Atenção', 'Este cliente não possui email cadastrado');
      return;
    }
    Linking.openURL(`mailto:${client.email}`);
  };

  const formatPhone = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Atenção', 'O nome do cliente é obrigatório');
      return;
    }

    try {
      const updatedData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        vehicleModel: formData.vehicleModel.trim(),
        vehiclePlate: formData.vehiclePlate.trim().toUpperCase(),
      };

      if (client.id) {
        await updateClient(client.id, updatedData);
        setClient({ ...client, ...updatedData });
        Alert.alert('✅ Sucesso', 'Cliente atualizado com sucesso!');
        setEditModalVisible(false);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar cliente:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o cliente');
    }
  };

  const handleDelete = async () => {
    console.log('🔴 handleDelete chamado para:', client.name, 'ID:', client.id);
    
    // Para web, usar confirm nativo
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Tem certeza que deseja excluir ${client.name}?\n\nEsta ação não pode ser desfeita.`
      );
      
      if (!confirmed) {
        console.log('❌ Usuário cancelou exclusão');
        return;
      }

      try {
        console.log('🗑️ Iniciando exclusão do cliente:', client.id);
        
        if (!client.id) {
          console.error('❌ ERRO: Client ID está undefined!');
          window.alert('Erro: ID do cliente não encontrado');
          return;
        }

        console.log('📡 Chamando deleteClient...');
        await deleteClient(client.id);
        
        console.log('✅ deleteClient retornou com sucesso');
        window.alert('✅ Cliente excluído com sucesso!');
        
        console.log('🔙 Voltando para lista...');
        navigation.goBack();
      } catch (error) {
        console.error('❌ Erro ao excluir cliente:', error);
        console.error('Detalhes do erro:', JSON.stringify(error));
        window.alert('Erro: Não foi possível excluir o cliente\n' + error);
      }
    } else {
      // Para mobile, usar Alert normal
      Alert.alert(
        'Excluir Cliente',
        `Tem certeza que deseja excluir ${client.name}? Esta ação não pode ser desfeita.`,
        [
          { 
            text: 'Cancelar', 
            style: 'cancel',
            onPress: () => console.log('❌ Usuário cancelou exclusão')
          },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('🗑️ Iniciando exclusão do cliente:', client.id);
                
                if (!client.id) {
                  console.error('❌ ERRO: Client ID está undefined!');
                  Alert.alert('Erro', 'ID do cliente não encontrado');
                  return;
                }

                console.log('📡 Chamando deleteClient...');
                await deleteClient(client.id);
                
                console.log('✅ deleteClient retornou com sucesso');
                Alert.alert('✅ Sucesso', 'Cliente excluído com sucesso!');
                
                console.log('🔙 Voltando para lista...');
                navigation.goBack();
              } catch (error) {
                console.error('❌ Erro ao excluir cliente:', error);
                console.error('Detalhes do erro:', JSON.stringify(error));
                Alert.alert('Erro', 'Não foi possível excluir o cliente: ' + error);
              }
            },
          },
        ]
      );
    }
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
            <Text style={styles.headerTitle}>Detalhes do Cliente</Text>
          </View>

          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setEditModalVisible(true)}
          >
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {client.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.clientName}>{client.name}</Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleCall}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.actionGradient}
            >
              <Text style={styles.actionIcon}>📞</Text>
              <Text style={styles.actionText}>Ligar</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleWhatsApp}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.actionGradient}
            >
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionText}>WhatsApp</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleEmail}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={styles.actionGradient}
            >
              <Text style={styles.actionIcon}>📧</Text>
              <Text style={styles.actionText}>Email</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Informações</Text>
          
          <View style={styles.infoCard}>
            {client.phone ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>📱 Telefone</Text>
                <Text style={styles.infoValue}>{client.phone}</Text>
              </View>
            ) : null}

            {client.email ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>📧 Email</Text>
                <Text style={styles.infoValue}>{client.email}</Text>
              </View>
            ) : null}

            {client.address ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>📍 Endereço</Text>
                <Text style={styles.infoValue}>{client.address}</Text>
              </View>
            ) : null}

            {!client.phone && !client.email && !client.address ? (
              <Text style={styles.emptyText}>Nenhuma informação adicional</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚗 Veículo</Text>
          
          <View style={styles.infoCard}>
            {client.vehicleModel ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Modelo</Text>
                <Text style={styles.infoValue}>{client.vehicleModel}</Text>
              </View>
            ) : null}

            {client.vehiclePlate ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Placa</Text>
                <Text style={styles.plateValue}>{client.vehiclePlate}</Text>
              </View>
            ) : null}

            {!client.vehicleModel && !client.vehiclePlate ? (
              <Text style={styles.emptyText}>Nenhum veículo cadastrado</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Estatísticas</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{orders.length}</Text>
              <Text style={styles.statLabel}>Ordens de Serviço</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statValue}>{schedules.length}</Text>
              <Text style={styles.statLabel}>Agendamentos</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {orders.filter(o => o.status === 'completed').length}
              </Text>
              <Text style={styles.statLabel}>Concluídas</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Ordens Recentes</Text>
          
          {orders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>Nenhuma ordem de serviço</Text>
            </View>
          ) : (
            orders.slice(0, 3).map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderTitle}>{order.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                  </View>
                </View>
                {order.description ? (
                  <Text style={styles.orderDescription} numberOfLines={2}>
                    {order.description}
                  </Text>
                ) : null}
                {order.totalValue ? (
                  <Text style={styles.orderValue}>
                    R$ {order.totalValue.toFixed(2)}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Text style={styles.deleteButtonText}>🗑️ Excluir Cliente</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Cliente</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>👤 Nome *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Nome completo"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>📱 Telefone</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: formatPhone(text) })}
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>📧 Email</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>📍 Endereço</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Rua, número, bairro"
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>🚗 Modelo do Veículo</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ex: Gol 1.0"
                  value={formData.vehicleModel}
                  onChangeText={(text) => setFormData({ ...formData, vehicleModel: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>🔖 Placa</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="ABC-1234"
                  value={formData.vehiclePlate}
                  onChangeText={(text) => setFormData({ ...formData, vehiclePlate: text.toUpperCase() })}
                  autoCapitalize="characters"
                  maxLength={8}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                >
                  <LinearGradient
                    colors={['#6366F1', '#4F46E5']}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>Salvar</Text>
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
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarLargeText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  clientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  plateValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  orderDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  orderValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  deleteButton: {
    marginHorizontal: 20,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
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
});