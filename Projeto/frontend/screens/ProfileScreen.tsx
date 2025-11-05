import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  SafeAreaView,
  Modal,
  TextInput,
  Platform
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { logoutUser } from "../../backend/database";
import { 
  getClientsByUserId, 
  getServiceOrdersByUserId,
  getSchedulesByUserId
} from "../../backend/database";
import { useToast, toast } from "../ToastSystem";
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

interface ProfileStats {
  totalClients: number;
  totalServiceOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalSchedules: number;
  completedSchedules: number;
}

export default function ProfileScreen({ navigation, route }: Props) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ProfileStats>({
    totalClients: 0,
    totalServiceOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalSchedules: 0,
    completedSchedules: 0,
  });

  // Modals
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const user = route.params?.user;
  const { showToast } = useToast();
  const auth = getAuth();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    if (!user?.id) return;

    try {
      const [clients, serviceOrders, schedules] = await Promise.all([
        getClientsByUserId(user.id),
        getServiceOrdersByUserId(user.id),
        getSchedulesByUserId(user.id),
      ]);

      const completedOrders = serviceOrders.filter(so => so.status === 'completed').length;
      const pendingOrders = serviceOrders.filter(so => so.status === 'pending').length;
      const completedSchedules = schedules.filter(s => s.status === 'completed').length;

      setStats({
        totalClients: clients.length,
        totalServiceOrders: serviceOrders.length,
        completedOrders,
        pendingOrders,
        totalSchedules: schedules.length,
        completedSchedules,
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleEditProfile = () => {
    showToast(toast.info("Em breve", "Edição de perfil completa será implementada em breve!"));
  };

  const handleChangePassword = async () => {
    // Validações
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showToast(toast.error("Campos obrigatórios", "Preencha todos os campos"));
      return;
    }

    if (newPassword.length < 6) {
      showToast(toast.error("Senha inválida", "A nova senha deve ter pelo menos 6 caracteres"));
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showToast(toast.error("Senhas não coincidem", "A nova senha e a confirmação devem ser iguais"));
      return;
    }

    setLoading(true);

    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser || !currentUser.email) {
        throw new Error("Usuário não autenticado");
      }

      // Reautenticar o usuário com a senha atual
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Atualizar a senha
      await updatePassword(currentUser, newPassword);
      
      // Limpar campos
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setChangePasswordModalVisible(false);
      
      showToast(toast.success(
        "Senha alterada!",
        "Sua senha foi atualizada com sucesso",
        3000
      ));
      
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      
      if (error.code === 'auth/wrong-password') {
        showToast(toast.error("Senha incorreta", "A senha atual está incorreta"));
      } else if (error.code === 'auth/requires-recent-login') {
        showToast(toast.error(
          "Sessão expirada", 
          "Por segurança, faça login novamente para alterar a senha"
        ));
      } else {
        showToast(toast.error(
          "Erro ao alterar senha",
          "Não foi possível atualizar a senha. Tente novamente"
        ));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    const confirmMessage = "Tem certeza que deseja sair da sua conta?";
    
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(confirmMessage);
      if (confirmed) {
        executeLogout();
      }
    } else {
      Alert.alert(
        "Sair da conta",
        confirmMessage,
        [
          { text: "Cancelar", style: "cancel" },
          { 
            text: "Sair", 
            style: "destructive",
            onPress: executeLogout
          }
        ]
      );
    }
  };

  const executeLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      
      showToast(toast.success("Até logo!", "Você saiu com sucesso", 2000));
      
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }, 1000);
      
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      
      if (Platform.OS === 'web') {
        alert("Erro ao sair. Tente novamente.");
      } else {
        Alert.alert("Erro", "Não foi possível sair. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Usuário não encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <TouchableOpacity 
          style={styles.editHeaderButton} 
          onPress={handleEditProfile}
        >
          <Text style={styles.editHeaderButtonText}>Editar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarTextLarge}>
              {getInitials(user.firstName, user.lastName)}
            </Text>
          </View>
          <Text style={styles.userName}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.userWorkshop}>{user.workshopName}</Text>
        </View>

        {/* Personal Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoEmoji}>📧</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          </View>

          {user.phone && (
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Text style={styles.infoEmoji}>📱</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Telefone</Text>
                <Text style={styles.infoValue}>
                  {user.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoEmoji}>🏢</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Oficina</Text>
              <Text style={styles.infoValue}>{user.workshopName}</Text>
            </View>
          </View>
        </View>

        {/* Statistics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estatísticas</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalClients}</Text>
              <Text style={styles.statLabel}>Clientes</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalServiceOrders}</Text>
              <Text style={styles.statLabel}>Ordens de Serviço</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.completedOrders}</Text>
              <Text style={styles.statLabel}>OS Concluídas</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.pendingOrders}</Text>
              <Text style={styles.statLabel}>OS Pendentes</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalSchedules}</Text>
              <Text style={styles.statLabel}>Agendamentos</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.completedSchedules}</Text>
              <Text style={styles.statLabel}>Atendimentos</Text>
            </View>
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleEditProfile}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionEmoji}>✏️</Text>
            </View>
            <Text style={styles.actionText}>Editar Perfil</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setChangePasswordModalVisible(true)}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionEmoji}>🔑</Text>
            </View>
            <Text style={styles.actionText}>Alterar Senha</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              showToast(toast.info("Em breve", "Configurações em desenvolvimento!"));
            }}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionEmoji}>⚙️</Text>
            </View>
            <Text style={styles.actionText}>Configurações</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              showToast(toast.info("Ajuda", "Entre em contato: suporte@officemaster.com"));
            }}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionEmoji}>❓</Text>
            </View>
            <Text style={styles.actionText}>Ajuda e Suporte</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Account Info Section */}
        {user.createdAt && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações da Conta</Text>
            
            <View style={styles.accountInfo}>
              <Text style={styles.accountInfoText}>
                Membro desde {new Date(user.createdAt).toLocaleDateString('pt-BR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            </View>
          </View>
        )}

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loading}
          >
            <Text style={styles.logoutButtonText}>
              {loading ? "Saindo..." : "🚪 Sair da Conta"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Office Master v1.0</Text>
          <Text style={styles.footerText}>Gerencie sua oficina com facilidade</Text>
        </View>
      </ScrollView>

      {/* Modal de Alterar Senha */}
      <Modal
        visible={changePasswordModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setChangePasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alterar Senha</Text>
              <TouchableOpacity onPress={() => setChangePasswordModalVisible(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.modalInputContainer}>
                <Text style={styles.modalLabel}>Senha Atual *</Text>
                <View style={styles.passwordContainer}>
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
                    <Text style={styles.eyeText}>{showCurrentPassword ? "🙈" : "👁️"}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalInputContainer}>
                <Text style={styles.modalLabel}>Nova Senha *</Text>
                <View style={styles.passwordContainer}>
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
                    <Text style={styles.eyeText}>{showNewPassword ? "🙈" : "👁️"}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalInputContainer}>
                <Text style={styles.modalLabel}>Confirmar Nova Senha *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Digite a nova senha novamente"
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Text style={styles.eyeText}>{showConfirmPassword ? "🙈" : "👁️"}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  (!currentPassword || !newPassword || !confirmNewPassword || loading) && styles.modalButtonDisabled
                ]}
                onPress={handleChangePassword}
                disabled={!currentPassword || !newPassword || !confirmNewPassword || loading}
              >
                <Text style={styles.modalButtonText}>
                  {loading ? "Alterando..." : "Alterar Senha"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, color: '#FF3B30', textAlign: 'center' },
  
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  editHeaderButton: { flex: 1, alignItems: 'flex-end' },
  editHeaderButtonText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  
  scrollView: { flex: 1 },
  
  profileHeader: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 40,
    marginBottom: 20,
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarTextLarge: { fontSize: 48, fontWeight: 'bold', color: '#fff' },
  userName: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  userWorkshop: { fontSize: 18, color: '#007AFF', fontWeight: '600' },
  
  section: { backgroundColor: '#fff', marginBottom: 20, paddingVertical: 20, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 15 },
  
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoEmoji: { fontSize: 20 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 14, color: '#666', marginBottom: 2 },
  infoValue: { fontSize: 16, color: '#1a1a1a', fontWeight: '500' },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  statCard: {
    width: '31%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    margin: '1%',
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#007AFF', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#666', textAlign: 'center' },
  
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  actionEmoji: { fontSize: 20 },
  actionText: { flex: 1, fontSize: 16, color: '#1a1a1a', fontWeight: '500' },
  actionArrow: { fontSize: 20, color: '#ccc', fontWeight: 'bold' },
  
  accountInfo: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 15 },
  accountInfoText: { fontSize: 14, color: '#666', textAlign: 'center' },
  
  logoutSection: { padding: 20 },
  logoutButton: { backgroundColor: '#FF3B30', padding: 16, borderRadius: 8, alignItems: 'center' },
  logoutButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  footer: { padding: 20, alignItems: 'center', paddingBottom: 40 },
  footerText: { fontSize: 14, color: '#999', marginBottom: 4 },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
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
    borderBottomColor: '#e1e5e9',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
  modalCloseButton: { fontSize: 24, color: '#999' },
  modalContent: { padding: 20 },
  modalInputContainer: { marginBottom: 20 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  passwordInput: { flex: 1, padding: 12, fontSize: 16 },
  eyeButton: { padding: 12 },
  eyeText: { fontSize: 18 },
  modalButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonDisabled: { backgroundColor: '#ccc' },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});