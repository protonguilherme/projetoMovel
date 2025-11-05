import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { updateServiceOrder, ServiceOrder } from "../../backend/database"; // ← AJUSTADO: caminho correto
import { useToast, toast } from "../ToastSystem";

type Props = NativeStackScreenProps<RootStackParamList, "EditServiceOrder">;

export default function EditServiceOrderScreen({ navigation, route }: Props) {
  const { serviceOrder, user } = route.params;
  
  const [title, setTitle] = useState(serviceOrder.title);
  const [description, setDescription] = useState(serviceOrder.description || "");
  const [vehicleInfo, setVehicleInfo] = useState(serviceOrder.vehicleInfo || "");
  const [priority, setPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>(serviceOrder.priority || 'medium');
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed' | 'cancelled'>(serviceOrder.status);
  const [laborCost, setLaborCost] = useState(formatCurrencyValue(serviceOrder.laborCost || 0));
  const [partsCost, setPartsCost] = useState(formatCurrencyValue(serviceOrder.partsCost || 0));
  const [estimatedCompletion, setEstimatedCompletion] = useState(serviceOrder.estimatedCompletion || "");
  const [notes, setNotes] = useState(serviceOrder.notes || "");
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();

  function formatCurrencyValue(value: number): string {
    if (value === 0) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  const formatCurrencyInput = (text: string): string => {
    const numbers = text.replace(/\D/g, '');
    const amount = parseFloat(numbers) / 100;
    if (isNaN(amount)) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const parseCurrency = (formattedValue: string): number => {
    const numbers = formattedValue.replace(/[^\d]/g, '');
    return parseFloat(numbers) / 100 || 0;
  };

  const validateTitle = (title: string): boolean => {
    return title.trim().length >= 3;
  };

  const handleLaborCostChange = (value: string) => {
    setLaborCost(formatCurrencyInput(value));
  };

  const handlePartsCostChange = (value: string) => {
    setPartsCost(formatCurrencyInput(value));
  };

  const calculateTotalCost = (): number => {
    return parseCurrency(laborCost) + parseCurrency(partsCost);
  };

  const getPriorityColor = (p: 'urgent' | 'high' | 'medium' | 'low') => {
    switch (p) {
      case 'urgent': return '#FF3B30';
      case 'high': return '#FF9500';
      case 'medium': return '#007AFF';
      case 'low': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const getPriorityText = (p: 'urgent' | 'high' | 'medium' | 'low') => {
    switch (p) {
      case 'urgent': return 'Urgente';
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return p;
    }
  };

  const getStatusColor = (s: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
    switch (s) {
      case 'pending': return '#FF9500';
      case 'in_progress': return '#007AFF';
      case 'completed': return '#34C759';
      case 'cancelled': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (s: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
    switch (s) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em Andamento';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return s;
    }
  };

  const hasChanges = () => {
    return (
      title.trim() !== serviceOrder.title ||
      description.trim() !== (serviceOrder.description || '') ||
      vehicleInfo.trim() !== (serviceOrder.vehicleInfo || '') ||
      priority !== (serviceOrder.priority || 'medium') ||
      status !== serviceOrder.status ||
      parseCurrency(laborCost) !== (serviceOrder.laborCost || 0) ||
      parseCurrency(partsCost) !== (serviceOrder.partsCost || 0) ||
      estimatedCompletion !== (serviceOrder.estimatedCompletion || '') ||
      notes.trim() !== (serviceOrder.notes || '')
    );
  };

  const handleSaveChanges = async () => {
    if (!validateTitle(title)) {
      showToast(toast.error("Título inválido", "O título deve ter pelo menos 3 caracteres"));
      return;
    }

    if (!hasChanges()) {
      showToast(toast.warning("Sem alterações", "Nenhuma alteração foi feita"));
      return;
    }

    if (!serviceOrder.id) {
      showToast(toast.error("Erro", "ID da ordem não encontrado"));
      return;
    }

    setLoading(true);

    try {
      const updatedData: Partial<ServiceOrder> = {
        title: title.trim(),
        description: description.trim() || undefined,
        vehicleInfo: vehicleInfo.trim() || undefined,
        priority,
        status,
        laborCost: parseCurrency(laborCost),
        partsCost: parseCurrency(partsCost),
        totalValue: calculateTotalCost(),
        estimatedCompletion: estimatedCompletion || undefined,
        notes: notes.trim() || undefined,
      };

      await updateServiceOrder(serviceOrder.id, updatedData);

      showToast(toast.success(
        "Alterações salvas!",
        `"${title}" foi atualizado com sucesso`,
        2000
      ));

      setTimeout(() => {
        navigation.goBack();
      }, 1000);

    } catch (error) {
      console.error("Erro ao atualizar OS:", error);
      showToast(toast.error(
        "Erro ao salvar",
        "Não foi possível salvar as alterações"
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges()) {
      Alert.alert(
        "Descartar alterações?",
        "Você tem alterações não salvas. Deseja descartar?",
        [
          { text: "Continuar editando", style: "cancel" },
          { 
            text: "Descartar", 
            style: "destructive",
            onPress: () => navigation.goBack()
          }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const isFormValid = () => {
    return validateTitle(title) && !loading;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
            <Text style={styles.backButtonText}>← Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar OS</Text>
          <TouchableOpacity 
            style={[styles.saveHeaderButton, (!isFormValid() || !hasChanges()) && styles.saveHeaderButtonDisabled]}
            onPress={handleSaveChanges}
            disabled={!isFormValid() || !hasChanges()}
          >
            <Text style={[styles.saveHeaderButtonText, (!isFormValid() || !hasChanges()) && styles.saveHeaderButtonTextDisabled]}>
              Salvar
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Título do Serviço *</Text>
              <TextInput
                style={[styles.input, !validateTitle(title) && title.length > 0 && styles.inputError]}
                placeholder="Ex: Troca de óleo, Revisão completa..."
                value={title}
                onChangeText={setTitle}
                editable={!loading}
              />
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
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusContainer}>
                {(['pending', 'in_progress', 'completed', 'cancelled'] as const).map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusButton,
                      status === s && [styles.statusButtonActive, { borderColor: getStatusColor(s) }]
                    ]}
                    onPress={() => setStatus(s)}
                    disabled={loading}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      status === s && [styles.statusButtonTextActive, { color: getStatusColor(s) }]
                    ]}>
                      {getStatusText(s)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Prioridade</Text>
              <View style={styles.priorityContainer}>
                {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityButton,
                      priority === p && [styles.priorityButtonActive, { borderColor: getPriorityColor(p) }]
                    ]}
                    onPress={() => setPriority(p)}
                    disabled={loading}
                  >
                    <Text style={[
                      styles.priorityButtonText,
                      priority === p && [styles.priorityButtonTextActive, { color: getPriorityColor(p) }]
                    ]}>
                      {getPriorityText(p)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.valuesContainer}>
              <View style={styles.valueRow}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Mão de Obra</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="R$ 0,00"
                    value={laborCost}
                    onChangeText={handleLaborCostChange}
                    keyboardType="numeric"
                    editable={!loading}
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                  <Text style={styles.label}>Peças</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="R$ 0,00"
                    value={partsCost}
                    onChangeText={handlePartsCostChange}
                    keyboardType="numeric"
                    editable={!loading}
                  />
                </View>
              </View>
              
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(calculateTotalCost())}
                </Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Previsão de Conclusão</Text>
              <TextInput
                style={styles.input}
                placeholder="DD/MM/AAAA (opcional)"
                value={estimatedCompletion}
                onChangeText={setEstimatedCompletion}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Detalhes do serviço..."
                value={description}
                onChangeText={setDescription}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Observações</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Observações técnicas..."
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
                (!isFormValid() || !hasChanges()) && styles.saveButtonDisabled
              ]} 
              onPress={handleSaveChanges}
              disabled={!isFormValid() || !hasChanges()}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Salvando..." : hasChanges() ? "Salvar Alterações" : "Nenhuma alteração"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.requiredInfo}>* Campos obrigatórios</Text>
            
            {hasChanges() && (
              <View style={styles.changesIndicator}>
                <Text style={styles.changesText}>✏️ Você tem alterações não salvas</Text>
              </View>
            )}
          </View>
        </ScrollView>
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
  saveHeaderButton: { flex: 1, alignItems: 'flex-end' },
  saveHeaderButtonDisabled: { opacity: 0.5 },
  saveHeaderButtonText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  saveHeaderButtonTextDisabled: { color: '#ccc' },
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
  statusContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
  },
  statusButtonActive: { borderWidth: 2, backgroundColor: '#f8f9fa' },
  statusButtonText: { fontSize: 14, color: '#666', fontWeight: '500' },
  statusButtonTextActive: { fontWeight: '600' },
  priorityContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  priorityButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
  },
  priorityButtonActive: { borderWidth: 2, backgroundColor: '#f8f9fa' },
  priorityButtonText: { fontSize: 14, color: '#666', fontWeight: '500' },
  priorityButtonTextActive: { fontWeight: '600' },
  valuesContainer: { marginBottom: 20 },
  valueRow: { flexDirection: 'row', marginHorizontal: -10 },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#34C759' },
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
  changesIndicator: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FF9500',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
    alignItems: 'center',
  },
  changesText: { fontSize: 14, color: '#FF9500', fontWeight: '600' },
});