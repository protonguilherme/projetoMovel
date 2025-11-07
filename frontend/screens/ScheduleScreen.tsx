// frontend/screens/ScheduleScreen.tsx - COM CALENDÁRIO VISUAL
import React, { useState, useCallback } from 'react';
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
  getSchedules, 
  getClients,
  createSchedule,
  Schedule,
  Client,
} from '../../backend/database';

export default function ScheduleScreen({ route, navigation }: any) {
  const { user, prefilledData } = route.params;
  
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [formData, setFormData] = useState({
    clientId: prefilledData?.clientId || '',
    title: prefilledData?.title || '',
    description: prefilledData?.description || '',
    date: '',
    time: '',
    status: 'pending' as 'pending' | 'confirmed' | 'completed' | 'cancelled',
  });

  // 🔄 AUTO-REFRESH
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 ScheduleScreen focada - recarregando...');
      loadSchedules();
      
      // Se veio com dados pré-preenchidos e flag de abrir modal
      if (prefilledData?.autoOpenModal) {
        setModalVisible(true);
      }
    }, [])
  );

  const loadSchedules = async () => {
    try {
      console.log('📅 Carregando agendamentos...');
      
      const [schedulesData, clientsData] = await Promise.all([
        getSchedules(user.id),
        getClients(user.id),
      ]);
      
      setSchedules(schedulesData);
      setClients(clientsData);
      
      console.log(`✅ ${schedulesData.length} agendamentos carregados`);
    } catch (error) {
      console.error('❌ Erro:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSchedules();
  };

  // 📅 FUNÇÕES DO CALENDÁRIO
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const getSchedulesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.filter(schedule => schedule.date === dateStr);
  };

  const getSchedulesForSelectedDate = () => {
    return getSchedulesForDate(selectedDate).sort((a, b) => {
      return a.time.localeCompare(b.time);
    });
  };

  const getDayColor = (daySchedules: Schedule[]) => {
    if (daySchedules.length === 0) return null;
    if (daySchedules.length === 1) return '#3B82F6'; // Azul
    if (daySchedules.length === 2) return '#F59E0B'; // Laranja
    return '#EF4444'; // Vermelho (3+)
  };

  const changeMonth = (direction: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentMonth(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const handleCreate = async () => {
    if (!formData.clientId || !formData.title.trim() || !formData.date || !formData.time) {
      Platform.OS === 'web' ? window.alert('Preencha todos os campos') : Alert.alert('Atenção', 'Preencha todos os campos');
      return;
    }

    try {
      const scheduleData: Omit<Schedule, 'id'> = {
        userId: user.id,
        clientId: formData.clientId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: formData.date,
        time: formData.time,
        status: formData.status,
      };

      await createSchedule(scheduleData);
      Platform.OS === 'web' ? window.alert('✅ Criado!') : Alert.alert('✅ Sucesso', 'Criado!');
      
      setModalVisible(false);
      resetForm();
      loadSchedules();
    } catch (error) {
      console.error('❌ Erro:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      title: '',
      description: '',
      date: '',
      time: '',
      status: 'pending',
    });
  };

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

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Cliente';
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const days = [];
    
    // Dias vazios antes do primeiro dia do mês
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }
    
    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const daySchedules = getSchedulesForDate(date);
      const dotColor = getDayColor(daySchedules);
      const isSelected = isSameDay(date, selectedDate);
      const isTodayDate = isToday(date);
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            isSelected && styles.dayCellSelected,
            isTodayDate && !isSelected && styles.dayCellToday,
          ]}
          onPress={() => setSelectedDate(date)}
        >
          <Text style={[
            styles.dayText,
            isSelected && styles.dayTextSelected,
            isTodayDate && !isSelected && styles.dayTextToday,
          ]}>
            {day}
          </Text>
          {dotColor && !isSelected && (
            <View style={[styles.dot, { backgroundColor: dotColor }]} />
          )}
          {daySchedules.length > 0 && isSelected && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>{daySchedules.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }
    
    return days;
  };

  const renderScheduleCard = ({ item }: { item: Schedule }) => (
    <TouchableOpacity
      style={styles.scheduleCard}
      onPress={() => {
        const client = clients.find(c => c.id === item.clientId);
        navigation.navigate('ScheduleDetails', { schedule: item, user, client });
      }}
    >
      <View style={styles.scheduleCardContent}>
        <View style={styles.scheduleTime}>
          <Text style={styles.scheduleTimeText}>{item.time}</Text>
        </View>
        <View style={styles.scheduleInfo}>
          <Text style={styles.scheduleTitle}>{item.title}</Text>
          <Text style={styles.scheduleClient}>👤 {getClientName(item.clientId)}</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusDotText}>{getStatusIcon(item.status)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const schedulesForDay = getSchedulesForSelectedDate();

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Agenda</Text>
            <Text style={styles.headerSubtitle}>{schedules.length} agendamentos</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366F1" />}
      >
        {/* Calendário */}
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthButton}>
              <Text style={styles.monthButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{formatMonthYear(currentMonth)}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthButton}>
              <Text style={styles.monthButtonText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekDays}>
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <View key={day} style={styles.weekDayCell}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={styles.calendar}>{renderCalendar()}</View>

          {/* Legenda */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.legendText}>1 agendamento</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendText}>2 agendamentos</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>3+ agendamentos</Text>
            </View>
          </View>
        </View>

        {/* Lista de agendamentos do dia selecionado */}
        <View style={styles.daySchedulesContainer}>
          <Text style={styles.daySchedulesTitle}>
            📅 {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
          </Text>
          {schedulesForDay.length > 0 ? (
            <FlatList
              data={schedulesForDay}
              renderItem={renderScheduleCard}
              keyExtractor={(item) => item.id || ''}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyDay}>
              <Text style={styles.emptyDayIcon}>📭</Text>
              <Text style={styles.emptyDayText}>Nenhum agendamento neste dia</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal de Criar */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Agendamento</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>👤 Cliente *</Text>
                <View style={styles.pickerContainer}>
                  <select style={styles.picker as any} value={formData.clientId} onChange={(e: any) => setFormData({ ...formData, clientId: e.target.value })}>
                    <option value="">Selecione um cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>📋 Título *</Text>
                <TextInput style={styles.formInput} placeholder="Ex: Revisão" value={formData.title} onChangeText={(text) => setFormData({ ...formData, title: text })} />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>📝 Descrição</Text>
                <TextInput style={[styles.formInput, { height: 80 }]} placeholder="Descrição..." value={formData.description} onChangeText={(text) => setFormData({ ...formData, description: text })} multiline />
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
                <TouchableOpacity style={styles.cancelButton} onPress={() => { setModalVisible(false); resetForm(); }}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleCreate}>
                  <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.saveButtonGradient}>
                    <Text style={styles.saveButtonText}>Criar</Text>
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
  header: { paddingTop: 20, paddingBottom: 20 },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: '#FFF', fontWeight: 'bold' },
  headerTextContainer: { flex: 1, marginLeft: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  addIcon: { fontSize: 28, color: '#FFF', fontWeight: 'bold' },
  content: { flex: 1 },
  calendarContainer: { backgroundColor: '#FFF', margin: 16, borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  monthButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20, backgroundColor: '#F3F4F6' },
  monthButtonText: { fontSize: 24, color: '#6366F1', fontWeight: 'bold' },
  monthTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', textTransform: 'capitalize' },
  weekDays: { flexDirection: 'row', marginBottom: 8 },
  weekDayCell: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  weekDayText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  calendar: { flexDirection: 'row', flexWrap: 'wrap' },
 dayCell: {
  width: '14.28%',
  aspectRatio: 1,
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  borderWidth: 1,
  borderColor: '#E5E7EB', // cinza claro
  borderRadius: 8,
},

  dayCellSelected: {
  backgroundColor: '#6366F1',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#6366F1',
},

  dayCellToday: { backgroundColor: '#EFF6FF', borderRadius: 12 },
  dayText: { fontSize: 16, color: '#111827', fontWeight: '500' },
  dayTextSelected: { color: '#FFF', fontWeight: 'bold' },
  dayTextToday: { color: '#6366F1', fontWeight: 'bold' },
  dot: { position: 'absolute', bottom: 4, width: 6, height: 6, borderRadius: 3 },
  selectedBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: '#FFF', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  selectedBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#6366F1' },
  legend: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 11, color: '#6B7280' },
  daySchedulesContainer: { margin: 16, marginTop: 0 },
  daySchedulesTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  scheduleCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  scheduleCardContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  scheduleTime: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  scheduleTimeText: { fontSize: 14, fontWeight: 'bold', color: '#6366F1' },
  scheduleInfo: { flex: 1 },
  scheduleTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
  scheduleClient: { fontSize: 13, color: '#6B7280' },
  statusDot: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  statusDotText: { fontSize: 16 },
  emptyDay: { alignItems: 'center', paddingVertical: 32 },
  emptyDayIcon: { fontSize: 48, marginBottom: 8 },
  emptyDayText: { fontSize: 14, color: '#9CA3AF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  modalClose: { fontSize: 28, color: '#9CA3AF' },
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
