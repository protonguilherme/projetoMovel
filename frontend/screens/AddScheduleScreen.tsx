import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { 
  createSchedule as dbCreateSchedule,
  getClients,
  getSchedules,
  Schedule,
  Client 
} from "../../backend/database"; // ← AJUSTADO: caminho correto
import { useToast, toast } from "../ToastSystem";
import { ClientSelector } from "../components/ClientSelector";

type Props = NativeStackScreenProps<RootStackParamList, "AddSchedule">;

// ============================================
// FUNÇÕES DE VALIDAÇÃO (antes em validators.ts)
// ============================================

const validateDate = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

const validateTime = (timeStr: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeStr);
};

// ============================================
// FUNÇÕES DE FORMATAÇÃO (antes em formatters.ts)
// ============================================

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
};

// ============================================
// VERIFICAÇÃO DE CONFLITO DE HORÁRIO
// ============================================

const checkScheduleConflict = async (
  userId: string, 
  date: string, 
  time: string, 
  duration: number
): Promise<boolean> => {
  try {
    const schedules = await getSchedules(userId);
    
    const [hours, minutes] = time.split(':').map(Number);
    const newStart = hours * 60 + minutes;
    const newEnd = newStart + duration;
    
    for (const schedule of schedules) {
      if (schedule.date === date && schedule.status !== 'cancelled') {
        const [schedHours, schedMinutes] = schedule.time.split(':').map(Number);
        const schedStart = schedHours * 60 + schedMinutes;
        const schedEnd = schedStart + schedule.duration;
        
        if (
          (newStart >= schedStart && newStart < schedEnd) ||
          (newEnd > schedStart && newEnd <= schedEnd) ||
          (newStart <= schedStart && newEnd >= schedEnd)
        ) {
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error("Erro ao verificar conflito:", error);
    return false;
  }
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function AddScheduleScreen({ navigation, route }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientModalVisible, setClientModalVisible] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [type, setType] = useState<'maintenance' | 'repair' | 'inspection' | 'consultation' | 'other'>('maintenance');
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [notes, setNotes] = useState("");
  
  const [loading, setLoading] = useState(false);
  
  const user = route.params?.user;
  const { showToast } = useToast();

  useEffect(() => {
    const loadClients = async () => {
      try {
        if (!user?.id) return;
        const clientsList = await getClients(user.id);
        setClients(clientsList);
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
      }
    };

    loadClients();
  }, [user?.id]);

  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setDate(formattedDate);
    
    const hours = today.getHours();
    const minutes = today.getMinutes() < 30 ? '00' : '30';
    setTime(`${String(hours).padStart(2, '0')}:${minutes}`);
  }, []);

  const validateTitle = (title: string): boolean => {
    return title.trim().length >= 3;
  };

  const validateClient = (): boolean => {
    return selectedClient !== null;
  };

  const getTypeText = (typeValue: string): string => {
    switch (typeValue) {
      case 'maintenance': return 'Manutenção';
      case 'repair': return 'Reparo';
      case 'inspection': return 'Inspeção';
      case 'consultation': return 'Consulta';
      case 'other': return 'Outro';
      default: return typeValue;
    }
  };

  const getTypeColor = (typeValue: string): string => {
    switch (typeValue) {
      case 'maintenance': return '#007AFF';
      case 'repair': return '#FF9500';
      case 'inspection': return '#34C759';
      case 'consultation': return '#AF52DE';
      case 'other': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  const handleSaveSchedule = async () => {
    if (!validateTitle(title)) {
      showToast(toast.error("Título inválido", "O título deve ter pelo menos 3 caracteres"));
      return;
    }

    if (!validateClient()) {
      showToast(toast.error("Cliente obrigatório", "Selecione um cliente"));
      return;
    }

    if (!validateDate(date)) {
      showToast(toast.error("Data inválida", "Selecione uma data válida (hoje ou futura)"));
      return;
    }

    if (!validateTime(time)) {
      showToast(toast.error("Hora inválida", "Digite uma hora válida (ex: 14:30)"));
      return;
    }

    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum < 15 || durationNum > 480) {
      showToast(toast.error("Duração inválida", "A duração deve ser entre 15 e 480 minutos"));
      return;
    }

    if (!user?.id) {
      showToast(toast.error("Erro", "Usuário não identificado"));
      return;
    }

    setLoading(true);

    try {
      const hasConflict = await checkScheduleConflict(user.id, date, time, durationNum);
      
      if (hasConflict) {
        Alert.alert(
          "Conflito de horário",
          "Já existe um agendamento neste horário. Deseja criar mesmo assim?",
          [
            { text: "Cancelar", style: "cancel", onPress: () => setLoading(false) },
            { text: "Criar mesmo assim", onPress: () => createSchedule() }
          ]
        );
        return;
      }

      await createSchedule();

    } catch (error) {
      console.error("Erro ao verificar conflito:", error);
      showToast(toast.error("Erro", "Não foi possível verificar conflitos de horário"));
      setLoading(false);
    }
  };

  const createSchedule = async () => {
    try {
      const scheduleData = {
        clientId: selectedClient!.id,
        userId: user!.id,
        clientName: selectedClient!.name,
        title: title.trim(),
        description: description.trim() || undefined,
        date: date, // ← Mantém como string (formato YYYY-MM-DD)
        time: time,
        duration: parseInt(duration),
        status: 'scheduled' as const,
        type: type,
        vehicleInfo: vehicleInfo.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const scheduleId = await dbCreateSchedule(scheduleData);
      console.log("Agendamento criado:", scheduleId);

      showToast(toast.success(
        "Agendamento criado!", 
        `${title} foi agendado para ${formatDate(date)} às ${time}`,
        3000
      ));

      setTimeout(() => {
        navigation.navigate("ScheduleList", { 
          user, 
          shouldRefresh: true,
          newScheduleId: scheduleId
        });
      }, 1500);

    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      showToast(toast.error(
        "Erro ao criar agendamento", 
        "Não foi possível criar o agendamento. Tente novamente"
      ));
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      validateTitle(title) && 
      validateClient() && 
      validateDate(date) && 
      validateTime(time) && 
      !loading
    );
  };

  if (clients.length === 0 && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Novo Agendamento</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.noClientsState}>
          <Text style={styles.noClientsIcon}>👥</Text>
          <Text style={styles.noClientsTitle}>Nenhum cliente cadastrado</Text>
          <Text style={styles.noClientsDescription}>
            Para criar um agendamento, você precisa ter pelo menos um cliente cadastrado.
          </Text>
          <TouchableOpacity 
            style={styles.addClientButton} 
            onPress={() => navigation.navigate("ClientsList", { user })}
          >
            <Text style={styles.addClientButtonText}>Gerenciar Clientes</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Novo Agendamento</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Cliente *</Text>
              <TouchableOpacity 
                style={[
                  styles.clientSelector,
                  !selectedClient && styles.clientSelectorPlaceholder
                ]}
                onPress={() => setClientModalVisible(true)}
                disabled={loading}
              >
                <Text style={[
                  styles.clientSelectorText,
                  !selectedClient && styles.clientSelectorPlaceholderText
                ]}>
                  {selectedClient ? selectedClient.name : "Selecione um cliente"}
                </Text>
                <Text style={styles.clientSelectorArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Título *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Revisão completa, Troca de óleo..."
                value={title}
                onChangeText={setTitle}
                editable={!loading}
              />
              <Text style={styles.hint}>Mínimo 3 caracteres</Text>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Data *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="AAAA-MM-DD"
                  value={date}
                  onChangeText={setDate}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                  editable={!loading}
                />
              </View>

              <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.label}>Hora *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM"
                  value={time}
                  onChangeText={setTime}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Duração (minutos)</Text>
              <View style={styles.durationContainer}>
                {['30', '60', '90', '120'].map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.durationButton,
                      duration === d && styles.durationButtonActive
                    ]}
                    onPress={() => setDuration(d)}
                    disabled={loading}
                  >
                    <Text style={[
                      styles.durationButtonText,
                      duration === d && styles.durationButtonTextActive
                    ]}>
                      {d} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.input}
                placeholder="Ou digite (ex: 45)"
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tipo de Serviço</Text>
              <View style={styles.typeContainer}>
                {(['maintenance', 'repair', 'inspection', 'consultation', 'other'] as const).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeButton,
                      type === t && [styles.typeButtonActive, { borderColor: getTypeColor(t) }]
                    ]}
                    onPress={() => setType(t)}
                    disabled={loading}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      type === t && [styles.typeButtonTextActive, { color: getTypeColor(t) }]
                    ]}>
                      {getTypeText(t)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Informações do Veículo</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Honda Civic 2020 - ABC-1234"
                value={vehicleInfo}
                onChangeText={setVehicleInfo}
                autoCapitalize="characters"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Detalhes do serviço a ser realizado..."
                value={description}
                onChangeText={setDescription}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Observações</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Observações adicionais, lembretes..."
                value={notes}
                onChangeText={setNotes}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            <TouchableOpacity 
              style={[
                styles.saveButton, 
                (!isFormValid()) && styles.saveButtonDisabled
              ]} 
              onPress={handleSaveSchedule}
              disabled={!isFormValid()}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Criando..." : "Criar Agendamento"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.requiredInfo}>* Campos obrigatórios</Text>
          </View>
        </ScrollView>

        <ClientSelector
          clients={clients}
          selectedClient={selectedClient}
          onClientSelect={setSelectedClient}
          visible={clientModalVisible}
          onClose={() => setClientModalVisible(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  backButton: { flex: 1 },
  backButtonText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center' },
  headerRight: { flex: 1 },
  noClientsState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noClientsIcon: { fontSize: 80, marginBottom: 20 },
  noClientsTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 12, textAlign: 'center' },
  noClientsDescription: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24, marginBottom: 30 },
  addClientButton: { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25 },
  addClientButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  formContainer: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1a1a1a',
  },
  inputError: { borderColor: '#ff4444' },
  textArea: { minHeight: 80, maxHeight: 120 },
  hint: { fontSize: 12, color: '#007AFF', marginTop: 4 },
  row: { flexDirection: 'row', marginHorizontal: -10 },
  clientSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  clientSelectorPlaceholder: { borderColor: '#ccc' },
  clientSelectorText: { fontSize: 16, color: '#1a1a1a' },
  clientSelectorPlaceholderText: { color: '#999' },
  clientSelectorArrow: { fontSize: 18, color: '#ccc' },
  durationContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  durationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
  },
  durationButtonActive: { borderColor: '#007AFF', backgroundColor: '#E3F2FD' },
  durationButtonText: { fontSize: 14, color: '#666', fontWeight: '500' },
  durationButtonTextActive: { color: '#007AFF', fontWeight: '600' },
  typeContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
  },
  typeButtonActive: { borderWidth: 2, backgroundColor: '#f8f9fa' },
  typeButtonText: { fontSize: 14, color: '#666', fontWeight: '500' },
  typeButtonTextActive: { fontWeight: '600' },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  saveButtonDisabled: { backgroundColor: '#ccc' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  requiredInfo: { fontSize: 14, color: '#666', textAlign: 'center', fontStyle: 'italic' },
});