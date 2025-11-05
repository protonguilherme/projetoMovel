// frontend/screens/ClientsScreen.tsx - COM AUTO-REFRESH
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
  getClients, 
  createClient,
  Client,
} from '../../backend/database';

export default function ClientsScreen({ route, navigation }: any) {
  const { user } = route.params;
  
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    vehicleModel: '',
    vehiclePlate: '',
  });

  // 🔄 AUTO-REFRESH: Recarrega quando a tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 ClientsScreen focada - recarregando clientes...');
      loadClients();
    }, [])
  );

  useEffect(() => {
    filterClients();
  }, [clients, searchQuery]);

  const loadClients = async () => {
    try {
      console.log('👥 Carregando clientes...');
      setIsLoading(true);
      
      const data = await getClients(user.id);
      
      const sortedClients = data.sort((a, b) => {
        return a.name.localeCompare(b.name);
      });

      setClients(sortedClients);
      console.log(`✅ ${sortedClients.length} clientes carregados`);
    } catch (error) {
      console.error('❌ Erro ao carregar clientes:', error);
      if (Platform.OS === 'web') {
        window.alert('Erro ao carregar clientes');
      } else {
        Alert.alert('Erro', 'Não foi possível carregar os clientes');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const filterClients = () => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = clients.filter(client => {
      return (
        client.name.toLowerCase().includes(query) ||
        client.phone?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.vehiclePlate?.toLowerCase().includes(query)
      );
    });

    setFilteredClients(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadClients();
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

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      const message = 'O nome do cliente é obrigatório';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Atenção', message);
      }
      return;
    }

    try {
      console.log('➕ Criando novo cliente...');
      
      const clientData: Omit<Client, 'id'> = {
        userId: user.id,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        vehicleModel: formData.vehicleModel.trim(),
        vehiclePlate: formData.vehiclePlate.trim().toUpperCase(),
      };

      await createClient(clientData);
      
      const message = 'Cliente criado com sucesso!';
      if (Platform.OS === 'web') {
        window.alert('✅ ' + message);
      } else {
        Alert.alert('✅ Sucesso', message);
      }
      
      setModalVisible(false);
      resetForm();
      loadClients();
    } catch (error) {
      console.error('❌ Erro ao criar cliente:', error);
      const message = 'Não foi possível criar o cliente';
      if (Platform.OS === 'web') {
        window.alert('Erro: ' + message);
      } else {
        Alert.alert('Erro', message);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      vehicleModel: '',
      vehiclePlate: '',
    });
  };

  const renderClientCard = ({ item }: { item: Client }) => (
    <TouchableOpacity
      style={styles.clientCard}
      onPress={() => navigation.navigate('ClientDetails', { client: item, user })}
      activeOpacity={0.7}
    >
      <View style={styles.clientAvatar}>
        <Text style={styles.clientAvatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.name}</Text>
        {item.phone ? (
          <Text style={styles.clientDetail}>📱 {item.phone}</Text>
        ) : null}
        {item.vehiclePlate ? (
          <Text style={styles.clientPlate}>🚗 {item.vehiclePlate}</Text>
        ) : null}
      </View>

      <Text style={styles.clientArrow}>›</Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={styles.emptyTitle}>Nenhum cliente encontrado</Text>
      <Text style={styles.emptyText}>
        {searchQuery 
          ? 'Tente outra busca'
          : 'Adicione seu primeiro cliente'}
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
            <Text style={styles.headerTitle}>Clientes</Text>
            <Text style={styles.headerSubtitle}>
              {filteredClients.length} {filteredClients.length === 1 ? 'cliente' : 'clientes'}
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
            placeholder="Buscar clientes..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </LinearGradient>

      <FlatList
        data={filteredClients}
        renderItem={renderClientCard}
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
              <Text style={styles.modalTitle}>Novo Cliente</Text>
              <TouchableOpacity onPress={() => {
                setModalVisible(false);
                resetForm();
              }}>
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
                    <Text style={styles.saveButtonText}>Criar Cliente</Text>
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
  listContent: {
    padding: 20,
    flexGrow: 1,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  clientAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  clientDetail: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  clientPlate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
  },
  clientArrow: {
    fontSize: 28,
    color: '#D1D5DB',
    fontWeight: '300',
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