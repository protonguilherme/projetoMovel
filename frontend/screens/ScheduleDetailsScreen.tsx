// frontend/screens/ScheduleDetailsScreen.tsx
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
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { updateSchedule, deleteSchedule, Schedule } from '../../backend/database';

export default function ScheduleDetailsScreen({ route, navigation }: any) {
  const { schedule: initialSchedule, user, client } = route.params;
  const [schedule, setSchedule] = useState<Schedule>(initialSchedule);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    title: schedule.title || '',
    description: schedule.description || '',
    date: schedule.date || '',
    time: schedule.time || '',
    status: schedule.status || 'pending',
  });

  const getStatusColor = (status: string) => {
    const colors: any = { completed: '#10B981', confirmed: '#3B82F6', pending: '#F59E0B', cancelled: '#6B7280' };
    return colors[status] || '#6B7280';
  };

  const getStatusText = (status: string) => {
    const texts: any = { completed: 'Realizado', confirmed: 'Confirmado', pending: 'Pendente', cancelled: 'Cancelado' };
    return texts[status] || status;
  };

  const getStatusIcon = (status: string) => {
    const icons: any = { completed: '✅', confirmed: '📌', pending: '⏳', cancelled: '❌' };
    return icons[status] || '📅';
  };

  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(date);
    const dateStr = dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    return `${dateStr} às ${time}`;
  };

  const handleUpdateStatus = async (newStatus: Schedule['status']) => {
    try {
      if (schedule.id) {
        await updateSchedule(schedule.id, { status: newStatus });
        setSchedule({ ...schedule, status: newStatus });
        Platform.OS === 'web' ? window.alert('✅ Status atualizado!') : Alert.alert('✅ Sucesso', 'Status atualizado!');
      }
    } catch (error) {
      console.error('❌ Erro:', error);
    }
  };

  const handleCall = () => {
    if (!client?.phone) {
      Platform.OS === 'web' ? window.alert('Cliente sem telefone') : Alert.alert('Atenção', 'Cliente sem telefone');
      return;
    }
    Linking.openURL(`tel:${client.phone.replace(/\D/g, '')}`);
  };

  const handleWhatsApp = () => {
    if (!client?.phone) {
      Platform.OS === 'web' ? window.alert('Cliente sem telefone') : Alert.alert('Atenção', 'Cliente sem telefone');
      return;
    }
    const phoneNumber = client.phone.replace(/\D/g, '');
    const message = `Olá ${client.name}, confirmando agendamento: ${schedule.title}`;
    Linking.openURL(`whatsapp://send?phone=55${phoneNumber}&text=${encodeURIComponent(message)}`);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.date || !formData.time) {
      Platform.OS === 'web' ? window.alert('Preencha todos os campos') : Alert.alert('Atenção', 'Preencha todos os campos');
      return;
    }
    try {
      const updatedData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: formData.date,
        time: formData.time,
        status: formData.status as Schedule['status'],
      };
      if (schedule.id) {
        await updateSchedule(schedule.id, updatedData);
        setSchedule({ ...schedule, ...updatedData });
        Platform.OS === 'web' ? window.alert('✅ Atualizado!') : Alert.alert('✅ Sucesso', 'Atualizado!');
        setEditModalVisible(false);
      }
    } catch (error) {
      console.error('❌ Erro:', error);
    }
  };

  const handleDelete = async () => {
    if (Platform.OS === 'web') {
      if (!window.confirm('Excluir este agendamento?')) return;
      try {
        if (schedule.id) {
          await deleteSchedule(schedule.id);
          window.alert('✅ Excluído!');
          navigation.goBack();
        }
      } catch (error) {
        console.error('❌ Erro:', error);
      }
    } else {
      Alert.alert('Excluir', 'Tem certeza?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: async () => {
          try {
            if (schedule.id) {
              await deleteSchedule(schedule.id);
              Alert.alert('✅ Sucesso', 'Excluído!');
              navigation.goBack();
            }
          } catch (error) {
            console.error('❌ Erro:', error);
          }
        }},
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Detalhes</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={() => setEditModalVisible(true)}>
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.statusSection}>
          <Text style={styles.statusIcon}>{getStatusIcon(schedule.status)}</Text>
          <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(schedule.status) }]}>
            <Text style={styles.statusTextLarge}>{getStatusText(schedule.status)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Informações</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Título</Text>
              <Text style={styles.infoValue}>{schedule.title}</Text>
            </View>
            {schedule.description ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Descrição</Text>
                <Text style={styles.infoValueMultiline}>{schedule.description}</Text>
              </View>
            ) : null}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cliente</Text>
              <Text style={styles.infoValue}>{client?.name || 'Não encontrado'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Data e Hora</Text>
              <Text style={styles.dateTimeText}>{formatDateTime(schedule.date, schedule.time)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📞 Contato</Text>
          <View style={styles.contactActions}>
            <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.contactGradient}>
                <Text style={styles.contactIcon}>📞</Text>
                <Text style={styles.contactText}>Ligar</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactButton} onPress={handleWhatsApp}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.contactGradient}>
                <Text style={styles.contactIcon}>💬</Text>
                <Text style={styles.contactText}>WhatsApp</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 Ações Rápidas</Text>
          <View style={styles.actionsGrid}>
            {schedule.status !== 'confirmed' && (
              <TouchableOpacity style={styles.actionButton} onPress={() => handleUpdateStatus('confirmed')}>
                <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.actionGradient}>
                  <Text style={styles.actionIcon}>📌</Text>
                  <Text style={styles.actionText}>Confirmar</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            {schedule.status !== 'completed' && (
              <TouchableOpacity style={styles.actionButton} onPress={() => handleUpdateStatus('completed')}>
                <LinearGradient colors={['#10B981', '#059669']} style={styles.actionGradient}>
                  <Text style={styles.actionIcon}>✅</Text>
                  <Text style={styles.actionText}>Concluir</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            {schedule.status !== 'cancelled' && (
              <TouchableOpacity style={styles.actionButton} onPress={() => handleUpdateStatus('cancelled')}>
                <LinearGradient colors={['#6B7280', '#4B5563']} style={styles.actionGradient}>
                  <Text style={styles.actionIcon}>❌</Text>
                  <Text style={styles.actionText}>Cancelar</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>🗑️ Excluir Agendamento</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>📋 Título *</Text>
                <TextInput style={styles.formInput} value={formData.title} onChangeText={(text) => setFormData({ ...formData, title: text })} />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>📝 Descrição</Text>
                <TextInput style={[styles.formInput, { height: 80 }]} value={formData.description} onChangeText={(text) => setFormData({ ...formData, description: text })} multiline />
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>📅 Data *</Text>
                  <TextInput style={styles.formInput} placeholder="YYYY-MM-DD" value={formData.date} onChangeText={(text) => setFormData({ ...formData, date: text })} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>🕐 Hora *</Text>
                  <TextInput style={styles.formInput} placeholder="HH:MM" value={formData.time} onChangeText={(text) => setFormData({ ...formData, time: text })} />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>📊 Status</Text>
                <View style={styles.pickerContainer}>
                  <select style={styles.picker as any} value={formData.status} onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}>
                    <option value="pending">⏳ Pendente</option>
                    <option value="confirmed">📌 Confirmado</option>
                    <option value="completed">✅ Realizado</option>
                    <option value="cancelled">❌ Cancelado</option>
                  </select>
                </View>
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.saveButtonGradient}>
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
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingTop: 20, paddingBottom: 24, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: '#FFF', fontWeight: 'bold' },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  editButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  editIcon: { fontSize: 20 },
  content: { flex: 1 },
  statusSection: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  statusIcon: { fontSize: 80, marginBottom: 16 },
  statusBadgeLarge: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  statusTextLarge: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  infoCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  infoRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel: { fontSize: 13, color: '#6B7280', marginBottom: 4, fontWeight: '500' },
  infoValue: { fontSize: 16, color: '#111827', fontWeight: '600' },
  infoValueMultiline: { fontSize: 15, color: '#111827', lineHeight: 22 },
  dateTimeText: { fontSize: 16, fontWeight: 'bold', color: '#6366F1' },
  contactActions: { flexDirection: 'row', gap: 12 },
  contactButton: { flex: 1, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  contactGradient: { padding: 16, alignItems: 'center', gap: 8 },
  contactIcon: { fontSize: 24 },
  contactText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionButton: { flex: 1, minWidth: 100, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  actionGradient: { padding: 16, alignItems: 'center', gap: 8 },
  actionIcon: { fontSize: 28 },
  actionText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  deleteButton: { marginHorizontal: 20, marginTop: 24, backgroundColor: '#FEE2E2', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FCA5A5' },
  deleteButtonText: { fontSize: 16, fontWeight: 'bold', color: '#DC2626' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  modalClose: { fontSize: 28, color: '#9CA3AF', fontWeight: '300' },
  formGroup: { marginBottom: 20 },
  formLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  formInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, fontSize: 16, color: '#111827' },
  pickerContainer: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden' },
  picker: { width: '100%', height: 50, fontSize: 16, color: '#111827', backgroundColor: 'transparent' } as any,
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelButton: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16, alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  saveButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  saveButtonGradient: { padding: 16, alignItems: 'center' },
  saveButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
});