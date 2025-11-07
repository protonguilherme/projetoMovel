// frontend/screens/ProfileScreen.tsx - NOVA VERSÃO
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { 
  getClients, 
  getServiceOrders, 
  getSchedules,
  logout 
} from '../../backend/database';
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;
type ProfileScreenRouteProp = RouteProp<RootStackParamList, 'Profile'>;

type Props = {
  navigation: ProfileScreenNavigationProp;
  route: ProfileScreenRouteProp;
};

interface Stats {
  totalClients: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalSchedules: number;
  completedSchedules: number;
}

export default function ProfileScreen({ navigation, route }: Props) {
  const { user } = route.params;
  const auth = getAuth();

  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalSchedules: 0,
    completedSchedules: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Campos de senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [clients, orders, schedules] = await Promise.all([
        getClients(user.id),
        getServiceOrders(user.id),
        getSchedules(user.id),
      ]);

      setStats({
        totalClients: clients.length,
        totalOrders: orders.length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        totalSchedules: schedules.length,
        completedSchedules: schedules.filter(s => s.status === 'completed').length,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadStats();
  };

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleChangePassword = async () => {
    // Validações
    if (!currentPassword || !newPassword || !confirmPassword) {
      if (Platform.OS === 'web') {
        alert('Preencha todos os campos!');
      } else {
        Alert.alert('Campos obrigatórios', 'Preencha todos os campos');
      }
      return;
    }

    if (newPassword.length < 6) {
      if (Platform.OS === 'web') {
        alert('A nova senha deve ter pelo menos 6 caracteres!');
      } else {
        Alert.alert('Senha inválida', 'A nova senha deve ter pelo menos 6 caracteres');
      }
      return;
    }

    if (newPassword !== confirmPassword) {
      if (Platform.OS === 'web') {
        alert('As senhas não coincidem!');
      } else {
        Alert.alert('Senhas não coincidem', 'A nova senha e a confirmação devem ser iguais');
      }
      return;
    }

    setChangingPassword(true);

    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser || !currentUser.email) {
        throw new Error('Usuário não autenticado');
      }

      // Reautenticar
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      
      // Atualizar senha
      await updatePassword(currentUser, newPassword);
      
      // Limpar campos
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(false);
      
      if (Platform.OS === 'web') {
        alert('✅ Senha alterada com sucesso!');
      } else {
        Alert.alert('Sucesso!', 'Sua senha foi alterada com sucesso');
      }
      
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      
      let errorMessage = 'Não foi possível alterar a senha';
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Senha atual incorreta';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Por segurança, faça login novamente para alterar a senha';
      }
      
      if (Platform.OS === 'web') {
        alert('❌ ' + errorMessage);
      } else {
        Alert.alert('Erro', errorMessage);
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    const message = 'Tem certeza que deseja sair da sua conta?';
    
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(message);
      if (confirmed) {
        executeLogout();
      }
    } else {
      Alert.alert(
        'Sair da Conta',
        message,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Sair', 
            style: 'destructive',
            onPress: executeLogout
          }
        ]
      );
    }
  };

  const executeLogout = async () => {
    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      if (Platform.OS === 'web') {
        alert('Erro ao sair. Tente novamente.');
      } else {
        Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
      }
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header com Gradiente */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Voltar</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar e Info */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
          </View>
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
          {user.workshopName && (
            <View style={styles.workshopBadge}>
              <Text style={styles.workshopBadgeText}>🔧 {user.workshopName}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Estatísticas */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>📊 Estatísticas</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalClients}</Text>
              <Text style={styles.statLabel}>Clientes</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalOrders}</Text>
              <Text style={styles.statLabel}>Ordens</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.completedOrders}</Text>
              <Text style={styles.statLabel}>Concluídas</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.pendingOrders}</Text>
              <Text style={styles.statLabel}>Pendentes</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalSchedules}</Text>
              <Text style={styles.statLabel}>Agendamentos</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.completedSchedules}</Text>
              <Text style={styles.statLabel}>Atendidos</Text>
            </View>
          </View>
        </View>

        {/* Informações da Conta */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>👤 Informações da Conta</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📧 Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
            
            <View style={styles.infoDivider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>👤 Nome</Text>
              <Text style={styles.infoValue}>{user.name}</Text>
            </View>
            
            {user.workshopName && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>🏢 Oficina</Text>
                  <Text style={styles.infoValue}>{user.workshopName}</Text>
                </View>
              </>
            )}
            
            <View style={styles.infoDivider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>🆔 ID</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {user.id.substring(0, 16)}...
              </Text>
            </View>
          </View>
        </View>

        {/* Ações */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>⚙️ Configurações</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowPasswordModal(true)}
          >
            <View style={styles.actionLeft}>
              <View style={styles.actionIconContainer}>
                <Text style={styles.actionIcon}>🔑</Text>
              </View>
              <Text style={styles.actionText}>Alterar Senha</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              if (Platform.OS === 'web') {
                alert('Funcionalidade em desenvolvimento!');
              } else {
                Alert.alert('Em breve', 'Edição de perfil em desenvolvimento');
              }
            }}
          >
            <View style={styles.actionLeft}>
              <View style={styles.actionIconContainer}>
                <Text style={styles.actionIcon}>✏️</Text>
              </View>
              <Text style={styles.actionText}>Editar Perfil</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Botão de Logout */}
        <View style={styles.logoutSection}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.logoutGradient}
            >
              <Text style={styles.logoutIcon}>🚪</Text>
              <Text style={styles.logoutText}>Sair da Conta</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Office Master © 2025</Text>
          <Text style={styles.footerVersion}>Versão 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Modal de Alterar Senha */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔑 Alterar Senha</Text>
              <TouchableOpacity 
                onPress={() => setShowPasswordModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <ScrollView style={styles.modalContent}>
              {/* Senha Atual */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Senha Atual *</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Digite sua senha atual"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    <Text style={styles.eyeText}>
                      {showCurrentPassword ? '🙈' : '👁️'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Nova Senha */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nova Senha *</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <Text style={styles.eyeText}>
                      {showNewPassword ? '🙈' : '👁️'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirmar Senha */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirmar Nova Senha *</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Digite novamente"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Text style={styles.eyeText}>
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Botões do Modal */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setShowPasswordModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton, 
                    styles.modalButtonConfirm,
                    changingPassword && styles.modalButtonDisabled
                  ]}
                  onPress={handleChangePassword}
                  disabled={changingPassword}
                >
                  {changingPassword ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.modalButtonTextConfirm}>
                      Alterar Senha
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  
  // Header
  header: {
    paddingTop: Platform.OS === 'web' ? 20 : 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  workshopBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  workshopBadgeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Content
  content: {
    flex: 1,
  },
  
  // Sections
  statsSection: {
    padding: 20,
  },
  infoSection: {
    padding: 20,
    paddingTop: 0,
  },
  actionsSection: {
    padding: 20,
    paddingTop: 0,
  },
  logoutSection: {
    padding: 20,
    paddingTop: 0,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  statCard: {
    width: '31%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    margin: '1%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  
  // Info Card
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  
  // Action Buttons
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  actionArrow: {
    fontSize: 24,
    color: '#9CA3AF',
  },
  
  // Logout Button
  logoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Footer
  footer: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 20,
    color: '#6B7280',
  },
  modalContent: {
    padding: 20,
  },
  
  // Input Groups
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  passwordInputContainer: {
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
  eyeText: {
    fontSize: 20,
  },
  
  // Modal Buttons
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonConfirm: {
    backgroundColor: '#667eea',
  },
  modalButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  modalButtonTextCancel: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextConfirm: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});