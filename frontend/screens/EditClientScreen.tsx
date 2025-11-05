import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { updateClient, deleteClient, Client } from '../../backend/database';
import { useToast, toast } from '../ToastSystem';

type EditClientScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditClient'>;
type EditClientScreenRouteProp = RouteProp<RootStackParamList, 'EditClient'>;

type Props = {
  navigation: EditClientScreenNavigationProp;
  route: EditClientScreenRouteProp;
};

export default function EditClientScreen({ navigation, route }: Props) {
  const { client, user } = route.params;
  
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone || '');
  const [email, setEmail] = useState(client.email || '');
  const [address, setAddress] = useState(client.address || '');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const hasChanges = () => {
    return (
      name.trim() !== client.name ||
      phone.trim() !== (client.phone || '') ||
      email.trim() !== (client.email || '') ||
      address.trim() !== (client.address || '')
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast(toast.error('Nome obrigatório', 'O nome do cliente é obrigatório'));
      return;
    }

    if (email && !email.includes('@')) {
      showToast(toast.error('Email inválido', 'Digite um email válido'));
      return;
    }

    if (!hasChanges()) {
      showToast(toast.warning('Sem alterações', 'Nenhuma alteração foi feita'));
      return;
    }

    setIsLoading(true);
    try {
      const updatedData: Partial<Client> = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      };

      await updateClient(client.id, updatedData);

      showToast(toast.success(
        'Cliente atualizado!',
        `${name.trim()} foi atualizado com sucesso`,
        2000
      ));

      setTimeout(() => {
        navigation.navigate('ClientsList', {
          user,
          shouldRefresh: true,
        });
      }, 1000);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      showToast(toast.error(
        'Erro ao atualizar',
        'Não foi possível atualizar o cliente. Tente novamente'
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir Cliente',
      `Tem certeza que deseja excluir ${client.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await deleteClient(client.id);
              
              showToast(toast.success(
                'Cliente excluído!',
                `${client.name} foi removido`,
                2000
              ));

              setTimeout(() => {
                navigation.navigate('ClientsList', {
                  user,
                  shouldRefresh: true,
                });
              }, 1000);
            } catch (error) {
              console.error('Erro ao excluir cliente:', error);
              showToast(toast.error(
                'Erro ao excluir',
                'Não foi possível excluir o cliente'
              ));
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    if (hasChanges()) {
      Alert.alert(
        'Descartar alterações?',
        'Você tem alterações não salvas. Deseja descartar?',
        [
          { text: 'Continuar editando', style: 'cancel' },
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} disabled={isLoading}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Cliente</Text>
        <TouchableOpacity onPress={handleSave} disabled={isLoading || !hasChanges()}>
          <Text
            style={[
              styles.saveButton,
              (isLoading || !hasChanges()) && styles.saveButtonDisabled,
            ]}
          >
            Salvar
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome Completo *</Text>
            <TextInput
              style={styles.input}
              placeholder="João Silva"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Telefone</Text>
            <TextInput
              style={styles.input}
              placeholder="(00) 00000-0000"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="joao@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Endereço</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Rua, número, bairro, cidade"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!isLoading}
            />
          </View>

          {hasChanges() && (
            <View style={styles.changesIndicator}>
              <Text style={styles.changesText}>✏️ Você tem alterações não salvas</Text>
            </View>
          )}
        </View>

        {/* Delete Button */}
        <View style={styles.dangerZone}>
          <Text style={styles.dangerZoneTitle}>Zona de Perigo</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={isLoading}
          >
            <Text style={styles.deleteButtonText}>🗑️ Excluir Cliente</Text>
          </TouchableOpacity>
          <Text style={styles.deleteWarning}>
            Esta ação não pode ser desfeita. Todos os dados do cliente serão removidos.
          </Text>
        </View>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    fontSize: 28,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  saveButtonDisabled: {
    color: '#999',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
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
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  textArea: {
    height: 80,
    paddingTop: 15,
  },
  changesIndicator: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FF9500',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  changesText: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '600',
  },
  dangerZone: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  dangerZoneTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  deleteButtonText: {
    color: '#D32F2F',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteWarning: {
    fontSize: 12,
    color: '#D32F2F',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});