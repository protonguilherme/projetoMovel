// frontend/screens/HomeScreen.tsx - VERSÃO PROFISSIONAL COM AUTO-REFRESH
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { getClients, getServiceOrders, getSchedules, logout } from '../../backend/database';

const { width } = Dimensions.get('window');

export default function HomeScreen({ route, navigation }: any) {
  const { user } = route.params;
  
  const [stats, setStats] = useState({
    totalClients: 0,
    totalOrders: 0,
    totalSchedules: 0,
    pendingOrders: 0,
    completedOrders: 0,
    inProgressOrders: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 🔄 AUTO-REFRESH: Recarrega estatísticas quando a tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 HomeScreen focada - recarregando estatísticas...');
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    try {
      console.log('📊 Carregando estatísticas...');
      
      const [clients, orders, schedules] = await Promise.all([
        getClients(user.id),
        getServiceOrders(user.id),
        getSchedules(user.id),
      ]);

      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const completedOrders = orders.filter(o => o.status === 'completed').length;
      const inProgressOrders = orders.filter(o => o.status === 'in_progress').length;

      setStats({
        totalClients: clients.length,
        totalOrders: orders.length,
        totalSchedules: schedules.length,
        pendingOrders,
        completedOrders,
        inProgressOrders,
      });

      console.log('✅ Estatísticas carregadas!');
    } catch (error) {
      console.error('❌ Erro ao carregar stats:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadStats();
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  const getCompletionRate = () => {
    if (stats.totalOrders === 0) return 0;
    return Math.round((stats.completedOrders / stats.totalOrders) * 100);
  };

  const quickActions = [
    {
      id: 'clients',
      title: 'Clientes',
      icon: '👥',
      gradient: ['#667eea', '#764ba2'],
      screen: 'ClientsList',
      count: stats.totalClients,
    },
    {
      id: 'orders',
      title: 'Ordens',
      icon: '📋',
      gradient: ['#f093fb', '#f5576c'],
      screen: 'ServiceOrdersList',
      count: stats.totalOrders,
    },
    {
      id: 'schedule',
      title: 'Agenda',
      icon: '📅',
      gradient: ['#4facfe', '#00f2fe'],
      screen: 'ScheduleList',
      count: stats.totalSchedules,
    },
    {
      id: 'inventory',
      title: 'Estoque',
      icon: '📦',
      gradient: ['#43e97b', '#38f9d7'],
      screen: null,
      count: '—',
    },
  ];

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header com Gradiente */}
          <View style={styles.headerContainer}>
            <LinearGradient
              colors={['#1F2937', '#111827']}
              style={styles.headerGradient}
            >
              <View style={styles.headerTop}>
                <View style={styles.headerLeft}>
                  <Text style={styles.greeting}>Bem-vindo de volta</Text>
                  <Text style={styles.userName}>{user.name}</Text>
                  {user.workshopName && (
                    <View style={styles.workshopBadge}>
                      <Text style={styles.workshopBadgeText}>🔧 {user.workshopName}</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity style={styles.profileButton} onPress={handleLogout}>
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    style={styles.profileGradient}
                  >
                    <Text style={styles.profileIcon}>🚪</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Cards de Estatísticas Principais */}
              <View style={styles.mainStatsContainer}>
                <View style={styles.mainStatCard}>
                  <View style={styles.mainStatHeader}>
                    <Text style={styles.mainStatLabel}>Taxa de Conclusão</Text>
                    <Text style={styles.mainStatTrend}>↗ +12%</Text>
                  </View>
                  <Text style={styles.mainStatValue}>{getCompletionRate()}%</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${getCompletionRate()}%` }]} />
                  </View>
                </View>

                <View style={styles.mainStatCard}>
                  <View style={styles.mainStatHeader}>
                    <Text style={styles.mainStatLabel}>Em Andamento</Text>
                    <Text style={styles.mainStatIcon}>⚡</Text>
                  </View>
                  <Text style={styles.mainStatValue}>{stats.inProgressOrders}</Text>
                  <Text style={styles.mainStatSubtext}>
                    {stats.pendingOrders} pendentes
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Quick Actions Grid */}
          <View style={styles.contentContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Acesso Rápido</Text>
              <Text style={styles.sectionSubtitle}>Gerencie seu negócio</Text>
            </View>

            <View style={styles.quickActionsGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.quickActionCard}
                  onPress={() => {
                    if (action.screen) {
                      navigation.navigate(action.screen, { user });
                    } else {
                      Alert.alert('Em Breve', 'Funcionalidade em desenvolvimento');
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={action.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.quickActionGradient}
                  >
                    <Text style={styles.quickActionIcon}>{action.icon}</Text>
                    <View style={styles.quickActionInfo}>
                      <Text style={styles.quickActionCount}>{action.count}</Text>
                      <Text style={styles.quickActionTitle}>{action.title}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>

            {/* Status Overview */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Visão Geral</Text>
              <Text style={styles.sectionSubtitle}>Status dos serviços</Text>
            </View>

            <View style={styles.overviewCard}>
              <View style={styles.overviewRow}>
                <View style={styles.overviewItem}>
                  <View style={[styles.overviewDot, { backgroundColor: '#10B981' }]} />
                  <View style={styles.overviewTextContainer}>
                    <Text style={styles.overviewLabel}>Concluídas</Text>
                    <Text style={styles.overviewValue}>{stats.completedOrders}</Text>
                  </View>
                </View>

                <View style={styles.overviewItem}>
                  <View style={[styles.overviewDot, { backgroundColor: '#F59E0B' }]} />
                  <View style={styles.overviewTextContainer}>
                    <Text style={styles.overviewLabel}>Em Andamento</Text>
                    <Text style={styles.overviewValue}>{stats.inProgressOrders}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.overviewDivider} />

              <View style={styles.overviewRow}>
                <View style={styles.overviewItem}>
                  <View style={[styles.overviewDot, { backgroundColor: '#EF4444' }]} />
                  <View style={styles.overviewTextContainer}>
                    <Text style={styles.overviewLabel}>Pendentes</Text>
                    <Text style={styles.overviewValue}>{stats.pendingOrders}</Text>
                  </View>
                </View>

                <View style={styles.overviewItem}>
                  <View style={[styles.overviewDot, { backgroundColor: '#6366F1' }]} />
                  <View style={styles.overviewTextContainer}>
                    <Text style={styles.overviewLabel}>Total</Text>
                    <Text style={styles.overviewValue}>{stats.totalOrders}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Insights Card */}
            <View style={styles.insightsCard}>
              <View style={styles.insightsHeader}>
                <Text style={styles.insightsIcon}>💡</Text>
                <Text style={styles.insightsTitle}>Insights</Text>
              </View>
              <Text style={styles.insightsText}>
                {stats.pendingOrders > 0 
                  ? `Você tem ${stats.pendingOrders} ${stats.pendingOrders === 1 ? 'ordem pendente' : 'ordens pendentes'} aguardando atendimento.`
                  : 'Parabéns! Todas as ordens foram atendidas. Continue assim! 🎉'}
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Office Master Pro</Text>
            <Text style={styles.footerVersion}>v1.0.0 • © 2025</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: -30,
  },
  headerGradient: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  workshopBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  workshopBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  profileButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  profileGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 24,
  },
  mainStatsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  mainStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mainStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mainStatLabel: {
    fontSize: 12,
    color: '#D1D5DB',
    fontWeight: '600',
  },
  mainStatTrend: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: 'bold',
  },
  mainStatIcon: {
    fontSize: 16,
  },
  mainStatValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  mainStatSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: (width - 52) / 2,
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  quickActionGradient: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  quickActionIcon: {
    fontSize: 36,
  },
  quickActionInfo: {
    alignItems: 'flex-start',
  },
  quickActionCount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  quickActionTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.9,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  overviewRow: {
    flexDirection: 'row',
    gap: 16,
  },
  overviewItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  overviewDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  overviewTextContainer: {
    flex: 1,
  },
  overviewLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  overviewDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  insightsCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  insightsIcon: {
    fontSize: 24,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  insightsText: {
    fontSize: 14,
    color: '#1E3A8A',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingBottom: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 11,
    color: '#D1D5DB',
  },
});