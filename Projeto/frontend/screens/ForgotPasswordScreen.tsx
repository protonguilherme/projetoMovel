// frontend/screens/ForgotPasswordScreen.tsx
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
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../backend/database';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
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

  const handleResetPassword = async () => {
    console.log('🔑 Tentando resetar senha...');
    
    if (!email.trim()) {
      showToast('⚠️ Digite seu email', 'warning');
      return;
    }

    if (!validateEmail(email)) {
      showToast('⚠️ Digite um email válido', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      console.log('📧 Enviando email para:', email.trim());
      
      await sendPasswordResetEmail(auth, email.trim());
      
      console.log('✅ Email enviado com sucesso!');
      
      setEmailSent(true);
      showToast('✅ Email enviado com sucesso!\nVerifique sua caixa de entrada', 'success');
      
    } catch (error: any) {
      console.error('❌ Erro ao enviar email:', error);
      
      const errorString = error.code?.toLowerCase() || '';
      
      if (errorString.includes('user-not-found') || 
          errorString.includes('not-found')) {
        showToast('❌ Email não encontrado\nVerifique se digitou corretamente', 'error');
      } else if (errorString.includes('too-many-requests')) {
        showToast('⚠️ Muitas tentativas\nAguarde alguns minutos', 'warning');
      } else if (errorString.includes('network')) {
        showToast('📡 Erro de conexão\nVerifique sua internet', 'error');
      } else {
        showToast(`❌ ${error.message || 'Erro ao enviar email'}`, 'error');
      }
    } finally {
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
            <Text style={styles.logo}>🔑</Text>
          </View>
          <Text style={styles.title}>Recuperar Senha</Text>
          <Text style={styles.subtitle}>
            {emailSent 
              ? 'Email enviado com sucesso!'
              : 'Digite seu email para receber instruções'}
          </Text>
        </View>

        {/* Content */}
        {!emailSent ? (
          /* Form Card - Antes de enviar */
          <View style={styles.formCard}>
            {/* Instructions */}
            <View style={styles.instructionsBox}>
              <Text style={styles.instructionsTitle}>📧 Como funciona:</Text>
              <Text style={styles.instructionsText}>
                1. Digite seu email cadastrado{'\n'}
                2. Clique em "Enviar link"{'\n'}
                3. Verifique sua caixa de entrada{'\n'}
                4. Clique no link recebido{'\n'}
                5. Defina sua nova senha
              </Text>
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
                autoFocus
              />
            </View>

            {/* Send Button */}
            <TouchableOpacity
              style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#FFF" size="small" />
                  <Text style={styles.loadingText}>Enviando...</Text>
                </View>
              ) : (
                <Text style={styles.sendButtonText}>Enviar Link</Text>
              )}
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>
                ← Voltar para Login
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Success Card - Depois de enviar */
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>✅</Text>
            </View>
            
            <Text style={styles.successTitle}>Email Enviado!</Text>
            
            <Text style={styles.successMessage}>
              Enviamos um link de recuperação para:{'\n\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>

            <View style={styles.successInstructions}>
              <Text style={styles.successInstructionsTitle}>📬 Próximos passos:</Text>
              <Text style={styles.successInstructionsText}>
                • Verifique sua caixa de entrada{'\n'}
                • Procure também no spam/lixo eletrônico{'\n'}
                • Clique no link recebido{'\n'}
                • Defina sua nova senha{'\n'}
                • Faça login com a nova senha
              </Text>
            </View>

            {/* Didn't receive email? */}
            <View style={styles.didntReceiveBox}>
              <Text style={styles.didntReceiveText}>
                Não recebeu o email?
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setEmailSent(false);
                  showToast('💡 Digite o email novamente', 'success');
                }}
                style={styles.resendButton}
              >
                <Text style={styles.resendButtonText}>
                  Tentar novamente
                </Text>
              </TouchableOpacity>
            </View>

            {/* Back to Login */}
            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={handleBackToLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.backToLoginButtonText}>
                ← Voltar para Login
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
    paddingHorizontal: 20,
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
  instructionsBox: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  instructionsTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#1E3A8A',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 24,
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
  sendButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  sendButtonText: {
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
  backButton: {
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successIconText: {
    fontSize: 40,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  emailHighlight: {
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  successInstructions: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  successInstructionsTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 8,
  },
  successInstructionsText: {
    fontSize: 14,
    color: '#14532D',
    lineHeight: 22,
  },
  didntReceiveBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  didntReceiveText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  resendButton: {
    padding: 8,
  },
  resendButtonText: {
    fontSize: 15,
    color: '#3B82F6',
    fontWeight: '600',
  },
  backToLoginButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 18,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  backToLoginButtonText: {
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