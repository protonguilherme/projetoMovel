import React, { useState, useEffect } from "react";
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
  SafeAreaView,
  Modal
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { 
  createServiceOrder, 
  getClients, 
  ServiceOrder, 
  Client 
} from "../../backend/database"; // ← AJUSTADO: caminho correto e função renomeada

type Props = NativeStackScreenProps<RootStackParamList, "AddServiceOrder">;

// Componente de Seleção de Cliente
interface ClientSelectorProps {
  clients: Client[];
  selectedClient: Client | null;
  onClientSelect: (client: Client) => void;
  visible: boolean;
  onClose: () => void;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({ 
  clients, 
  selectedClient, 
  onClientSelect, 
  visible, 
  onClose 
}) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.clientModal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Selecionar Cliente</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCloseButton}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.clientList}>
          {clients.length === 0 ? (
            <View style={styles.noClientsContainer}>
              <Text style={styles.noClientsText}>Nenhum cliente cadastrado</Text>
              <Text style={styles.noClientsSubtext}>
                Cadastre um cliente primeiro na seção Clientes
              </Text>
            </View>
          ) : (
            clients.map(client => (
              <TouchableOpacity
                key={client.id}
                style={[
                  styles.clientItem,
                  selectedClient?.id === client.id && styles.clientItemSelected
                ]}
                onPress={() => {
                  onClientSelect(client);
                  onClose();
                }}
              >
                <Text style={styles.clientName}>{client.name}</Text>
                {client.phone && (
                  <Text style={styles.clientPhone}>
                    {client.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                  </Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

export default function AddServiceOrderScreen({ navigation, route }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientModalVisible, setClientModalVisible] = useState(false);
  
  // Campos da OS
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [priority, setPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('medium');
  const [laborCost, setLaborCost] = useState("");
  const [partsCost, setPartsCost] = useState("");
  const [estimatedCompletion, setEstimatedCompletion] = useState("");
  const [notes, setNotes] = useState("");
  
  const [loading, setLoading] = useState(false);
  
  const user = route.params?.user;

  // Carrega clientes
  useEffect(() => {
    const loadClients = async () => {
      try {
        if (!user?.id) return;
        const clientsList = await getClients(user.id); // ← AJUSTADO
        setClients(clientsList);
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
      }
    };

    loadClients();
  }, [user?.id]);

  // Validações
  const validateTitle = (title: string): boolean => {
    return title.trim().length >= 3;
  };

  const validateClient = (): boolean => {
    return selectedClient !== null;
  };

  const formatCurrency = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Converte para formato monetário
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

  const handleLaborCostChange = (value: string) => {
    const formatted = formatCurrency(value);
    setLaborCost(formatted);
  };

  const handlePartsCostChange = (value: string) => {
    const formatted = formatCurrency(value);
    setPartsCost(formatted);
  };

  const calculateTotalCost = (): number => {
    const labor = parseCurrency(laborCost);
    const parts = parseCurrency(partsCost);
    return labor + parts;
  };

  const getPriorityColor = (priorityValue: 'urgent' | 'high' | 'medium' | 'low') => {
    switch (priorityValue) {
      case 'urgent': return '#FF3B30';
      case 'high': return '#FF9500';
      case 'medium': return '#007AFF';
      case 'low': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const getPriorityText = (priorityValue: 'urgent' | 'high' | 'medium' | 'low') => {
    switch (priorityValue) {
      case 'urgent': return 'Urgente';
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priorityValue;
    }
  };

  const handleSaveServiceOrder = async () => {
    // Validações
    if (!validateTitle(title)) {
      Alert.alert("Título inválido", "O título deve ter pelo menos 3 caracteres.");
      return;
    }

    if (!validateClient()) {
      Alert.alert("Cliente obrigatório", "Selecione um cliente para a ordem de serviço.");
      return;
    }

    if (!user?.id) {
      Alert.alert("Erro", "Usuário não identificado");
      return;
    }

    setLoading(true);

    try {
      const serviceOrderData = {
        clientId: selectedClient!.id,
        userId: user.id,
        clientName: selectedClient!.name,
        title: title.trim(),
        description: description.trim() || undefined,
        status: 'pending' as const,
        vehicleModel: vehicleInfo.trim() || undefined,
        vehiclePlate: undefined, // Pode adicionar campo separado se necessário
        totalValue: calculateTotalCost(),
      };

      const orderId = await createServiceOrder(serviceOrderData); // ← AJUSTADO
      console.log("OS criada:", orderId);

      Alert.alert(
        "OS criada! 🎉", 
        `"${title}" foi criada com sucesso para ${selectedClient?.name}.`, 
        [
          { 
            text: "Ver Lista", 
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error("Erro ao criar OS:", error);
      Alert.alert(
        "Erro ao criar OS", 
        "Não foi possível criar a ordem de serviço. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return validateTitle(title) && validateClient() && !loading;
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
          <Text style={styles.headerTitle}>Nova OS</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.noClientsState}>
          <Text style={styles.noClientsIcon}>👥</Text>
          <Text style={styles.noClientsTitle}>Nenhum cliente cadastrado</Text>
          <Text style={styles.noClientsDescription}>
            Para criar uma ordem de serviço, você precisa ter pelo menos um cliente cadastrado.
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nova Ordem de Serviço</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            {/* Seleção de Cliente */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Cliente *</Text>
              <TouchableOpacity
                style={[
                  styles.clientSelector,
                  !selectedClient && styles.clientSelectorPlaceholder
                ]}
                onPress={() => setClientModalVisible(true)}
              >
                <Text style={[
                  styles.clientSelectorText,
                  !selectedClient && styles.clientSelectorPlaceholderText
                ]}>
                  {selectedClient ? selectedClient.name : "Selecionar cliente"}
                </Text>
                <Text style={styles.clientSelectorArrow}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Título do Serviço */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Título do Serviço *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Troca de óleo, Revisão completa..."
                value={title}
                onChangeText={setTitle}
                editable={!loading}
              />
            </View>

            {/* Informações do Veículo */}
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

            {/* Prioridade */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Prioridade</Text>
              <View style={styles.priorityContainer}>
                {(['urgent', 'high', 'medium', 'low'] as const).map(p => (
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

            {/* Valores */}
            <View style={styles.valuesContainer}>
              <Text style={styles.label}>Custos</Text>
              <View style={styles.valueRow}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Mão de obra</Text>
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
                <Text style={styles.totalLabel}>Total Estimado:</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency((calculateTotalCost() * 100).toString())}
                </Text>
              </View>
            </View>

            {/* Prazo Estimado */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Prazo Estimado</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 2024-12-31"
                value={estimatedCompletion}
                onChangeText={setEstimatedCompletion}
                editable={!loading}
              />
            </View>

            {/* Descrição */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descreva o serviço a ser realizado..."
                value={description}
                onChangeText={setDescription}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            {/* Observações */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Observações</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Observações adicionais..."
                value={notes}
                onChangeText={setNotes}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            {/* Botão Salvar */}
            <TouchableOpacity 
              style={[
                styles.saveButton, 
                !isFormValid() && styles.saveButtonDisabled
              ]} 
              onPress={handleSaveServiceOrder}
              disabled={!isFormValid()}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Criando..." : "Criar Ordem de Serviço"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.requiredInfo}>* Campos obrigatórios</Text>
          </View>
        </ScrollView>

        {/* Modal de Seleção de Cliente */}
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
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  // HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    flex: 1,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  headerRight: {
    flex: 1,
  },

  // ESTADO SEM CLIENTES
  noClientsState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noClientsIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  noClientsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  noClientsDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  addClientButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addClientButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // SCROLL VIEW
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  
  // FORMULÁRIO
  formContainer: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1a1a1a',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  textArea: {
    minHeight: 80,
    maxHeight: 120,
  },

  // SELETOR DE CLIENTE
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
  clientSelectorPlaceholder: {
    borderColor: '#ccc',
  },
  clientSelectorText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  clientSelectorPlaceholderText: {
    color: '#999',
  },
  clientSelectorArrow: {
    fontSize: 18,
    color: '#ccc',
  },

  // PRIORIDADE
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
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
  priorityButtonActive: {
    borderWidth: 2,
    backgroundColor: '#f8f9fa',
  },
  priorityButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  priorityButtonTextActive: {
    fontWeight: '600',
  },

  // VALORES
  valuesContainer: {
    marginBottom: 20,
  },
  valueRow: {
    flexDirection: 'row',
    marginHorizontal: -10,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34C759',
  },
  
  // BOTÃO SALVAR
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // INFO
  requiredInfo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  clientModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  modalCloseButton: {
    fontSize: 20,
    color: '#999',
    padding: 5,
  },
  clientList: {
    maxHeight: 400,
  },
  clientItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  clientItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  clientPhone: {
    fontSize: 14,
    color: '#666',
  },
  noClientsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noClientsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  noClientsSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});