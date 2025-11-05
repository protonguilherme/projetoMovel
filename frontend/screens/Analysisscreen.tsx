import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import {
  getClients,
  getServiceOrders,
} from '../../backend/database';

type AnalysisScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Analysis'>;
type AnalysisScreenRouteProp = RouteProp<RootStackParamList, 'Analysis'>;

type Props = {
  navigation: AnalysisScreenNavigationProp;
  route: AnalysisScreenRouteProp;
};

const isWeb = Platform.OS === 'web';

interface MonthlyAnalysis {
  revenue: number;
  completedServices: number;
  averageValue: number;
  growth: number;
  topClient: string;
}

export default function AnalysisScreen({ navigation, route }: Props) {
  const { user } = route.params;
  const [analysis, setAnalysis] = useState<MonthlyAnalysis>({
    revenue: 0,
    completedServices: 0,
    averageValue: 0,
    growth: 0,
    topClient: '-',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadAnalysis();
  }, []);

  const calculateMonthlyAnalysis = (orders: any[], clients: any[]) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Filtrar ordens do mês atual
    const currentMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.getMonth() === currentMonth && 
             orderDate.getFullYear() === currentYear &&
             order.status === 'completed';
    });

    // Calcular receita total do mês
    const revenue = currentMonthOrders.reduce((total, order) => {
      return total + (parseFloat(order.totalValue) || 0);
    }, 0);

    // Calcular valor médio
    const averageValue = currentMonthOrders.length > 0 
      ? revenue / currentMonthOrders.length 
      : 0;

    // Encontrar melhor cliente
    const clientServiceCount = currentMonthOrders.reduce((acc: any, order) => {
      acc[order.clientId] = (acc[order.clientId] || 0) + 1;
      return acc;
    }, {});

    const topClientId = Object.keys(clientServiceCount).reduce((a, b) => 
      clientServiceCount[a] > clientServiceCount[b] ? a : b, ''
    );

    const topClient = clients.find(c => c.id === topClientId)?.name || '-';

    // Calcular crescimento
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const lastMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.getMonth() === lastMonth && 
             orderDate.getFullYear() === lastMonthYear &&
             order.status === 'completed';
    });

    const lastMonthRevenue = lastMonthOrders.reduce((total, order) => {
      return total + (parseFloat(order.totalValue) || 0);
    }, 0);

    const growth = lastMonthRevenue > 0 
      ? ((revenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    return {
      revenue,
      completedServices: currentMonthOrders.length,
      averageValue,
      growth,
      topClient,
    };
  };

  const loadAnalysis = async () => {
    try {
      if (!user?.id) {
        console.error('User ID não encontrado');
        setIsLoading(false);
        return;
      }

      const [clients, orders] = await Promise.all([
        getClients(user.id).catch(() => []),
        getServiceOrders(user.id).catch(() => []),
      ]);

      const monthlyAnalysis = calculateMonthlyAnalysis(orders, clients);
      setAnalysis(monthlyAnalysis);

    } catch (error) {
      console.error('Erro ao carregar análise:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAnalysis();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getCurrentMonthName = () => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[new Date().getMonth()];
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5856D6" />
        <Text style={styles.loadingText}>Carregando análise...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Análise Mensal</Text>
          <Text style={styles.headerSubtitle}>{getCurrentMonthName()}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#5856D6']}
            tintColor="#5856D6"
          />
        }
      >
        {/* Card Principal - Receita */}
        <View style={styles.mainCard}>
          <Text style={styles.mainCardLabel}>💰 Receita do Mês</Text>
          <Text style={styles.mainCardValue}>
            {formatCurrency(analysis.revenue)}
          </Text>
          <View style={[
            styles.growthBadge,
            { backgroundColor: analysis.growth >= 0 ? '#E8F5E9' : '#FFEBEE' }
          ]}>
            <Text style={[
              styles.growthText,
              { color: analysis.growth >= 0 ? '#34C759' : '#FF3B30' }
            ]}>
              {analysis.growth >= 0 ? '↑' : '↓'} 
              {Math.abs(analysis.growth).toFixed(1)}%
            </Text>
            <Text style={styles.growthLabel}>vs mês anterior</Text>
          </View>
        </View>

        {/* Grid de Métricas */}
        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Desempenho</Text>
          <View style={styles.metricsGrid}>
            {/* Serviços Concluídos */}
            <View style={[styles.metricCard, { borderLeftColor: '#007AFF' }]}>
              <Text style={styles.metricIcon}>✓</Text>
              <View style={styles.metricContent}>
                <Text style={styles.metricValue}>{analysis.completedServices}</Text>
                <Text style={styles.metricLabel}>Serviços Concluídos</Text>
              </View>
            </View>

            {/* Ticket Médio */}
            <View style={[styles.metricCard, { borderLeftColor: '#FF9500' }]}>
              <Text style={styles.metricIcon}>📊</Text>
              <View style={styles.metricContent}>
                <Text style={styles.metricValue}>
                  {formatCurrency(analysis.averageValue)}
                </Text>
                <Text style={styles.metricLabel}>Ticket Médio</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Cliente Destaque */}
        <View style={styles.highlightSection}>
          <Text style={styles.sectionTitle}>Destaques</Text>
          <View style={styles.highlightCard}>
            <View style={styles.highlightHeader}>
              <Text style={styles.highlightIcon}>🏆</Text>
              <Text style={styles.highlightTitle}>Cliente Destaque</Text>
            </View>
            <Text style={styles.highlightValue}>{analysis.topClient}</Text>
            <Text style={styles.highlightSubtext}>
              Cliente com mais serviços no mês
            </Text>
          </View>
        </View>

        {/* Dicas */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>💡 Dicas</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>
              {analysis.growth >= 0 
                ? '✓ Parabéns! Sua receita está crescendo. Continue oferecendo um excelente atendimento!'
                : '📈 Sua receita caiu este mês. Considere fazer promoções ou campanhas de divulgação.'}
            </Text>
          </View>
          {analysis.completedServices < 10 && (
            <View style={styles.tipCard}>
              <Text style={styles.tipText}>
                📋 Você tem poucos serviços concluídos este mês. Que tal entrar em contato com clientes antigos?
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: isWeb ? 20 : 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 24,
    color: '#000',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  content: {
    flex: 1,
  },
  mainCard: {
    margin: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  mainCardLabel: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 12,
  },
  mainCardValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  growthText: {
    fontSize: 16,
    fontWeight: '700',
  },
  growthLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  metricsSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  metricsGrid: {
    gap: 12,
  },
  metricCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  metricIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  highlightSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  highlightCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  highlightIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  highlightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  highlightValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  highlightSubtext: {
    fontSize: 12,
    color: '#8E8E93',
  },
  tipsSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  tipCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  tipText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
});