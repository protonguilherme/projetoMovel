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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { createClient } from '../../backend/database'; // ← AJUSTADO: caminho correto
import { useToast, toast } from '../ToastSystem'; // ← AJUSTADO: import do toast

type AddClientScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddClient'>;
type AddClientScreenRouteProp = RouteProp<RootStackParamList, 'AddClient'>;

type Props = {
  navigation: AddClientScreenNavigationProp;
  route: AddClientScreenRouteProp;
};

export default function AddClientScreen({ navigation, route }: Props) {
  const { user } = route.params;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleSave = async () => {
    if (!name.trim()) {
      showToast(toast.error('Nome obrigatório', 'O nome do cliente é obrigatório'));
      return;
    }

    if (email && !email.includes('@')) {
      showToast(toast.error('Email inválido', 'Digite um email válido'));
      return;
    }

    setIsLoading(true);
    try {
      const clientId = await createClient({
        userId: user.id,
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      });

      showToast(toast.success(
        'Cliente cadastrado!', 
        `${name.trim()} foi adicionado com sucesso`,
        2000
      ));
      
      // Aguarda um pouco para mostrar o toast antes de navegar
      setTimeout(() => {
        navigation.navigate('ClientsList', {
          user,
          shouldRefresh: true,
          newClientId: clientId,
        });
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      showToast(toast.error(
        'Erro ao cadastrar', 
        'Não foi possível cadastrar o cliente. Tente novamente'
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={isLoading}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Cliente</Text>
        <TouchableOpacity onPress={handleSave} disabled={isLoading}>
          <Text style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}>
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