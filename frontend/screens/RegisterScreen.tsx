// frontend/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { registerWithEmail } from '../../backend/database';

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [workshopName, setWorkshopName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Toast State
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');
  const [fadeAnim] = useState(new Animated.Value(0));

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastVisible(false);
    });
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const formatPhone = (text: string) => {
    // Remove tudo que não é número
    const numbers = text.replace(/\D/g, '');
    
    // Formata: (XX) XXXXX-XXXX
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const validateForm = () => {
    if (!name.trim()) {
      showToast('⚠️ Digite seu nome completo', 'warning');
      return false;
    }

    if (name.trim().length < 3) {
      showToast('⚠️ Nome deve ter pelo menos 3 caracteres', 'warning');
      return false;
    }

    if (!email.trim()) {
      showToast('⚠️ Digite seu email', 'warning');
      return false;
    }

    if (!validateEmail(email)) {
      showToast('⚠️ Digite um email válido', 'warning');
      return false;
    }

    if (!password.trim()) {
      showToast('⚠️ Digite uma senha', 'warning');
      return false;
    }

    if (password.length < 6) {
      showToast('⚠️ A senha deve ter pelo menos 6 caracteres', 'warning');
      return false;
    }

    if (password !== confirmPassword) {
      showToast('⚠️ As senhas não coincidem', 'warning');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    console.log('📝 Tentando registrar...');
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      console.log('📧 Email:', email.trim());
      console.log('👤 Nome:', name.trim());
      console.log('🔥 Chamando Firebase...');
      
      const user = await registerWithEmail(
        email.trim(),
        password,
        name.trim(),
        phone.replace(/\D/g, ''), 
        workshopName.trim() || undefined
      );
      
      console.log('✅ Registro bem-sucedido!', user);
      
      // Mostra toast de sucesso
      showToast(`✅ Conta criada com sucesso!\nBem-vindo, ${user.name}!`, 'success');
      
      // Aguarda o toast e navega para Home
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home', params: { user } }],
        });
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Erro no registro:', error);
      
      const errorString = error.message?.toLowerCase() || '';
      
      if (errorString.includes('email-already-in-use') || 
          errorString.includes('já está cadastrado') ||
          errorString.includes('already in use')) {
        showToast('❌ Este email já está cadastrado\nFaça login ou use outro email', 'error');
      } else if (errorString.includes('weak-password') || 
                 errorString.includes('senha muito fraca')) {
        showToast('⚠️ Senha muito fraca\nUse pelo menos 6 caracteres', 'warning');
      } else if (errorString.includes('network') || 
                 errorString.includes('rede')) {
        showToast('📡 Erro de conexão\nVerifique sua internet', 'error');
      } else {
        showToast(`❌ ${error.message || 'Erro ao criar conta'}`, 'error');
      }
      
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  const getToastColor = () => {
    switch (toastType) {
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      case 'warning': return '#F59E0B';
      default: return '#10B981';
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>📝</Text>
          </View>
          <Text style={styles.title}>Criar Conta</Text>
          <Text style={styles.subtitle}>Cadastre-se no Office Master</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>👤 Nome Completo</Text>
            <TextInput
              style={styles.input}
              placeholder="João da Silva"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>📧 Email</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          {/* Phone Input (Opcional) */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>📱 Telefone (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="(19) 99999-9999"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={(text) => setPhone(formatPhone(text))}
              keyboardType="phone-pad"
              maxLength={15}
              editable={!isLoading}
            />
          </View>

          {/* Workshop Name Input (Opcional) */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>🔧 Nome da Oficina (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Auto Center Silva"
              placeholderTextColor="#999"
              value={workshopName}
              onChangeText={setWorkshopName}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>🔐 Senha</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>🔐 Confirmar Senha</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Digite a senha novamente"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFF" size="small" />
                <Text style={styles.loadingText}>Criando conta...</Text>
              </View>
            ) : (
              <Text style={styles.registerButtonText}>Criar Conta</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Back to Login Link */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleBackToLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>
              Já tenho uma conta
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Office Master © 2025</Text>
          <Text style={styles.footerVersion}>Versão 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Toast Notification */}
      {toastVisible && (
        <Animated.View 
          style={[
            styles.toast, 
            { 
              opacity: fadeAnim,
              backgroundColor: getToastColor()
            }
          ]}
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  logo: {
    fontSize: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  eyeButton: {
    padding: 16,
  },
  eyeIcon: {
    fontSize: 22,
  },
  registerButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loginButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 11,
    color: '#D1D5DB',
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
});