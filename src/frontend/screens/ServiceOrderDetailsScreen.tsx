// frontend/screens/ServiceOrderDetailsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  updateServiceOrder,
  deleteServiceOrder,
  ServiceOrder,
  Client,
} from '../../backend/database';

export default function ServiceOrderDetailsScreen({ route, navigation }: any) {
  const { order: initialOrder, user, client } = route.params;
  
  const [order, setOrder] = useState<ServiceOrder>(initialOrder);
  const [editModalVisible, setEditModalVisible] = useState(false);
  
  const [formData, setFormData] = useState({
    title: order.title || '',
    description: order.description || '',
    status: order.status || 'pending',
    totalValue: order.totalValue?.toString() || '',
  });

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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSchedule = () => {
    // Navegar para a agenda com os dados pré-preenchidos
    navigation.navigate('ScheduleList', {
      user,
      prefilledData: {
        clientId: order.clientId,
        title: order.title,
        description: order.description,
        autoOpenModal: true, // Flag para abrir o modal automaticamente
      }
    });
  };

  const handleUpdateStatus = async (newStatus: ServiceOrder['status']) => {
    try {
      console.log('✏️ Atualizando status:', newStatus);
      if (order.id) {
        await updateServiceOrder(order.id, { status: newStatus });
        setOrder({ ...order, status: newStatus });
        
        const message = 'Status atualizado com sucesso!';
        if (Platform.OS === 'web') {
          window.alert('✅ ' + message);
        } else {
          Alert.alert('✅ Sucesso', message);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      const message = 'Não foi possível atualizar o status';
      if (Platform.OS === 'web') {
        window.alert('Erro: ' + message);
      } else {
        Alert.alert('Erro', message);
      }
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      const message = 'O título é obrigatório';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Atenção', message);
      }
      return;
    }

    try {
      console.log('💾 Salvando alterações...');
      
      const updatedData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status as ServiceOrder['status'],
        totalValue: formData.totalValue ? parseFloat(formData.totalValue) : undefined,
      };

      if (order.id) {
        await updateServiceOrder(order.id, updatedData);
        setOrder({ ...order, ...updatedData });
        
        const message = 'Ordem atualizada com sucesso!';
        if (Platform.OS === 'web') {
          window.alert('✅ ' + message);
        } else {
          Alert.alert('✅ Sucesso', message);
        }
        
        setEditModalVisible(false);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar ordem:', error);
      const message = 'Não foi possível atualizar a ordem';
      if (Platform.OS === 'web') {
        window.alert('Erro: ' + message);
      } else {
        Alert.alert('Erro', message);
      }
    }
  };

  const handleDelete = async () => {
    console.log('🔴 handleDelete chamado para ordem:', order.id);
    
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Tem certeza que deseja excluir esta ordem?\n\nEsta ação não pode ser desfeita.`
      );
      
      if (!confirmed) {
        console.log('❌ Usuário cancelou exclusão');
        return;
      }

      try {
        console.log('🗑️ Excluindo ordem:', order.id);
        
        if (!order.id) {
          window.alert('Erro: ID da ordem não encontrado');
          return;
        }

        await deleteServiceOrder(order.id);
        window.alert('✅ Ordem excluída com sucesso!');
        navigation.goBack();
      } catch (error) {
        console.error('❌ Erro ao excluir ordem:', error);
        window.alert('Erro: Não foi possível excluir a ordem\n' + error);
      }
    } else {
      Alert.alert(
        'Excluir Ordem',
        'Tem certeza que deseja excluir esta ordem? Esta ação não pode ser desfeita.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: async () => {
              try {
                if (order.id) {
                  await deleteServiceOrder(order.id);
                  Alert.alert('✅ Sucesso', 'Ordem excluída com sucesso!');
                  navigation.goBack();
                }
              } catch (error) {
                console.error('❌ Erro ao excluir ordem:', error);
                Alert.alert('Erro', 'Não foi possível excluir a ordem');
              }
            },
          },
        ]
      );
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
            <Text style={styles.headerTitle}>Detalhes da Ordem</Text>
          </View>

          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setEditModalVisible(true)}
          >
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusSection}>
          <Text style={styles.statusIcon}>{getStatusIcon(order.status)}</Text>
          <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusTextLarge}>{getStatusText(order.status)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Informações</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Título</Text>
              <Text style={styles.infoValue}>{order.title}</Text>
            </View>

            {order.description ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Descrição</Text>
                <Text style={styles.infoValueMultiline}>{order.description}</Text>
              </View>
            ) : null}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cliente</Text>
              <Text style={styles.infoValue}>{client?.name || 'Cliente não encontrado'}</Text>
            </View>

            {order.totalValue ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Valor Total</Text>
                <Text style={styles.valueText}>R$ {order.totalValue.toFixed(2)}</Text>
              </View>
            ) : null}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Criada em</Text>
              <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
            </View>

            {order.updatedAt && order.updatedAt !== order.createdAt ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Atualizada em</Text>
                <Text style={styles.infoValue}>{formatDate(order.updatedAt)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 Ações Rápidas</Text>
          
          <View style={styles.actionsGrid}>
            {order.status !== 'in_progress' ? (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleUpdateStatus('in_progress')}
              >
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  style={styles.actionGradient}
                >
                  <Text style={styles.actionIcon}>🔄</Text>
                  <Text style={styles.actionText}>Iniciar</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : null}

            {order.status !== 'completed' ? (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleUpdateStatus('completed')}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.actionGradient}
                >
                  <Text style={styles.actionIcon}>✅</Text>
                  <Text style={styles.actionText}>Concluir</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : null}

            {order.status !== 'cancelled' ? (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleUpdateStatus('cancelled')}
              >
                <LinearGradient
                  colors={['#6B7280', '#4B5563']}
                  style={styles.actionGradient}
                >
                  <Text style={styles.actionIcon}>❌</Text>
                  <Text style={styles.actionText}>Cancelar</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Botão de Agendar */}
        <TouchableOpacity 
          style={styles.scheduleButton}
          onPress={handleSchedule}
        >
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.scheduleButtonGradient}
          >
            <Text style={styles.scheduleButtonIcon}>📅</Text>
            <Text style={styles.scheduleButtonText}>Agendar Serviço</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Text style={styles.deleteButtonText}>🗑️ Excluir Ordem</Text>
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
              <Text style={styles.modalTitle}>Editar Ordem</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>📋 Título *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Título da ordem"
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>📝 Descrição</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="Descrição detalhada..."
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
  statusSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statusIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  statusBadgeLarge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  statusTextLarge: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  infoValueMultiline: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
  },
  valueText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
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
    fontSize: 28,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    marginHorizontal: 20,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  scheduleButton: {
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  scheduleButtonGradient: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scheduleButtonIcon: {
    fontSize: 20,
  },
  scheduleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
});