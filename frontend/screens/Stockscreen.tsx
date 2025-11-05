// frontend/screens/StockScreen.tsx
import React, { useState, useCallback } from 'react';
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
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  Product,
} from '../../backend/database';

export default function StockScreen({ route, navigation }: any) {
  const { user } = route.params;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'peças',
    quantity: '',
    minQuantity: '',
    unitPrice: '',
    supplier: '',
    barcode: '',
    location: '',
  });

  const [adjustData, setAdjustData] = useState({
    quantity: '',
    type: 'in' as 'in' | 'out',
    reason: '',
  });

  useFocusEffect(
    useCallback(() => {
      console.log('🔄 StockScreen focada - recarregando...');
      loadProducts();
    }, [])
  );

  React.useEffect(() => {
    filterProducts();
  }, [products, searchQuery, filterCategory]);

  const loadProducts = async () => {
    try {
      console.log('📦 Carregando produtos...');
      const productsData = await getProducts(user.id);
      setProducts(productsData);
      console.log(`✅ ${productsData.length} produtos carregados`);
    } catch (error) {
      console.error('❌ Erro:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filtrar por categoria
    if (filterCategory !== 'all') {
      filtered = filtered.filter(p => p.category === filterCategory);
    }

    // Filtrar por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.barcode?.includes(query)
      );
    }

    setFilteredProducts(filtered);
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.quantity || !formData.minQuantity || !formData.unitPrice) {
      const msg = 'Preencha os campos obrigatórios';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Atenção', msg);
      return;
    }

    try {
      const productData: Omit<Product, 'id'> = {
        userId: user.id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        quantity: parseInt(formData.quantity),
        minQuantity: parseInt(formData.minQuantity),
        unitPrice: parseFloat(formData.unitPrice),
        supplier: formData.supplier.trim(),
        barcode: formData.barcode.trim(),
        location: formData.location.trim(),
      };

      await createProduct(productData);
      
      const msg = 'Produto criado!';
      Platform.OS === 'web' ? window.alert('✅ ' + msg) : Alert.alert('✅ Sucesso', msg);
      
      setModalVisible(false);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('❌ Erro:', error);
    }
  };

  const handleAdjustStock = async () => {
    if (!adjustData.quantity || !adjustData.reason.trim() || !selectedProduct) {
      const msg = 'Preencha quantidade e motivo';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Atenção', msg);
      return;
    }

    try {
      await adjustStock(
        selectedProduct.id!,
        parseInt(adjustData.quantity),
        adjustData.type,
        adjustData.reason.trim(),
        user.id,
        selectedProduct.name
      );
      
      const msg = adjustData.type === 'in' ? 'Entrada registrada!' : 'Saída registrada!';
      Platform.OS === 'web' ? window.alert('✅ ' + msg) : Alert.alert('✅ Sucesso', msg);
      
      setAdjustModalVisible(false);
      setSelectedProduct(null);
      setAdjustData({ quantity: '', type: 'in', reason: '' });
      loadProducts();
    } catch (error: any) {
      console.error('❌ Erro:', error);
      Platform.OS === 'web' ? window.alert('Erro: ' + error.message) : Alert.alert('Erro', error.message);
    }
  };

  const handleDelete = async (product: Product) => {
    const confirmed = Platform.OS === 'web' 
      ? window.confirm(`Excluir ${product.name}?`)
      : await new Promise(resolve => {
          Alert.alert('Excluir', `Excluir ${product.name}?`, [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Excluir', style: 'destructive', onPress: () => resolve(true) },
          ]);
        });

    if (!confirmed) return;

    try {
      await deleteProduct(product.id!);
      Platform.OS === 'web' ? window.alert('✅ Excluído!') : Alert.alert('✅ Sucesso', 'Excluído!');
      loadProducts();
    } catch (error) {
      console.error('❌ Erro:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'peças',
      quantity: '',
      minQuantity: '',
      unitPrice: '',
      supplier: '',
      barcode: '',
      location: '',
    });
  };

  const categories = [
    { id: 'all', name: 'Todos', icon: '📦' },
    { id: 'peças', name: 'Peças', icon: '🔧' },
    { id: 'fluidos', name: 'Fluidos', icon: '🛢️' },
    { id: 'ferramentas', name: 'Ferramentas', icon: '🔨' },
    { id: 'consumíveis', name: 'Consumíveis', icon: '🧰' },
    { id: 'outros', name: 'Outros', icon: '📋' },
  ];

  const getLowStockProducts = () => {
    return products.filter(p => p.quantity <= p.minQuantity).length;
  };

  const getTotalValue = () => {
    return products.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const isLowStock = item.quantity <= item.minQuantity;
    const totalValue = item.quantity * item.unitPrice;

    return (
      <TouchableOpacity
        style={[styles.productCard, isLowStock && styles.productCardLowStock]}
        onPress={() => {
          setSelectedProduct(item);
          setAdjustModalVisible(true);
        }}
        onLongPress={() => handleDelete(item)}
      >
        {isLowStock && (
          <View style={styles.lowStockBadge}>
            <Text style={styles.lowStockText}>⚠️ ESTOQUE BAIXO</Text>
          </View>
        )}
        
        <View style={styles.productHeader}>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productCategory}>
              {categories.find(c => c.id === item.category)?.icon} {item.category}
            </Text>
          </View>
          <View style={styles.productQuantityBadge}>
            <Text style={styles.productQuantity}>{item.quantity}</Text>
            <Text style={styles.productQuantityLabel}>unid.</Text>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.productDescription} numberOfLines={2}>{item.description}</Text>
        ) : null}

        <View style={styles.productFooter}>
          <View>
            <Text style={styles.productPriceLabel}>Valor Unit.</Text>
            <Text style={styles.productPrice}>R$ {item.unitPrice.toFixed(2)}</Text>
          </View>
          <View>
            <Text style={styles.productTotalLabel}>Total</Text>
            <Text style={styles.productTotal}>R$ {totalValue.toFixed(2)}</Text>
          </View>
        </View>

        {item.location ? (
          <Text style={styles.productLocation}>📍 {item.location}</Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Estoque</Text>
            <Text style={styles.headerSubtitle}>{products.length} produtos</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{getLowStockProducts()}</Text>
            <Text style={styles.statLabel}>⚠️ Baixo</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>R$ {getTotalValue().toFixed(0)}</Text>
            <Text style={styles.statLabel}>💰 Total</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Busca */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar produto..."
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filtros */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.filterButton, filterCategory === cat.id && styles.filterButtonActive]}
            onPress={() => setFilterCategory(cat.id)}
          >
            <Text style={[styles.filterText, filterCategory === cat.id && styles.filterTextActive]}>
              {cat.icon} {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id || ''}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProducts(); }} tintColor="#8B5CF6" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>Nenhum produto no estoque</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => setModalVisible(true)}>
              <Text style={styles.emptyButtonText}>+ Adicionar Produto</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Modal Criar Produto */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Produto</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>📦 Nome *</Text>
                <TextInput style={styles.formInput} placeholder="Ex: Filtro de óleo" value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>📝 Descrição</Text>
                <TextInput style={[styles.formInput, { height: 60 }]} placeholder="Descrição..." value={formData.description} onChangeText={(text) => setFormData({ ...formData, description: text })} multiline />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>🏷️ Categoria *</Text>
                <View style={styles.pickerContainer}>
                  <select style={styles.picker as any} value={formData.category} onChange={(e: any) => setFormData({ ...formData, category: e.target.value })}>
                    <option value="peças">🔧 Peças</option>
                    <option value="fluidos">🛢️ Fluidos</option>
                    <option value="ferramentas">🔨 Ferramentas</option>
                    <option value="consumíveis">🧰 Consumíveis</option>
                    <option value="outros">📋 Outros</option>
                  </select>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>📊 Quantidade *</Text>
                  <TextInput style={styles.formInput} placeholder="0" value={formData.quantity} onChangeText={(text) => setFormData({ ...formData, quantity: text.replace(/[^0-9]/g, '') })} keyboardType="number-pad" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>⚠️ Mín. *</Text>
                  <TextInput style={styles.formInput} placeholder="0" value={formData.minQuantity} onChangeText={(text) => setFormData({ ...formData, minQuantity: text.replace(/[^0-9]/g, '') })} keyboardType="number-pad" />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>💰 Preço Unit. *</Text>
                <TextInput style={styles.formInput} placeholder="0.00" value={formData.unitPrice} onChangeText={(text) => setFormData({ ...formData, unitPrice: text.replace(/[^0-9.]/g, '') })} keyboardType="decimal-pad" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>🏪 Fornecedor</Text>
                <TextInput style={styles.formInput} placeholder="Nome do fornecedor" value={formData.supplier} onChangeText={(text) => setFormData({ ...formData, supplier: text })} />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>📍 Localização</Text>
                <TextInput style={styles.formInput} placeholder="Ex: Prateleira A3" value={formData.location} onChangeText={(text) => setFormData({ ...formData, location: text })} />
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => { setModalVisible(false); resetForm(); }}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleCreate}>
                  <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.saveButtonGradient}>
                    <Text style={styles.saveButtonText}>Criar</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Ajustar Estoque */}
      <Modal visible={adjustModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajustar Estoque</Text>
              <TouchableOpacity onPress={() => { setAdjustModalVisible(false); setSelectedProduct(null); setAdjustData({ quantity: '', type: 'in', reason: '' }); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedProduct && (
              <>
                <View style={styles.selectedProductInfo}>
                  <Text style={styles.selectedProductName}>{selectedProduct.name}</Text>
                  <Text style={styles.selectedProductStock}>Estoque atual: {selectedProduct.quantity} unidades</Text>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Tipo</Text>
                  <View style={styles.typeButtons}>
                    <TouchableOpacity
                      style={[styles.typeButton, adjustData.type === 'in' && styles.typeButtonIn]}
                      onPress={() => setAdjustData({ ...adjustData, type: 'in' })}
                    >
                      <Text style={[styles.typeButtonText, adjustData.type === 'in' && styles.typeButtonTextActive]}>
                        ➕ Entrada
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeButton, adjustData.type === 'out' && styles.typeButtonOut]}
                      onPress={() => setAdjustData({ ...adjustData, type: 'out' })}
                    >
                      <Text style={[styles.typeButtonText, adjustData.type === 'out' && styles.typeButtonTextActive]}>
                        ➖ Saída
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>📊 Quantidade *</Text>
                  <TextInput style={styles.formInput} placeholder="0" value={adjustData.quantity} onChangeText={(text) => setAdjustData({ ...adjustData, quantity: text.replace(/[^0-9]/g, '') })} keyboardType="number-pad" />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>📝 Motivo *</Text>
                  <TextInput style={[styles.formInput, { height: 80 }]} placeholder="Ex: Compra, Venda, Uso em OS..." value={adjustData.reason} onChangeText={(text) => setAdjustData({ ...adjustData, reason: text })} multiline />
                </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => { setAdjustModalVisible(false); setSelectedProduct(null); setAdjustData({ quantity: '', type: 'in', reason: '' }); }}>
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleAdjustStock}>
                    <LinearGradient colors={adjustData.type === 'in' ? ['#10B981', '#059669'] : ['#EF4444', '#DC2626']} style={styles.saveButtonGradient}>
                      <Text style={styles.saveButtonText}>Confirmar</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingTop: 20, paddingBottom: 20 },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: '#FFF', fontWeight: 'bold' },
  headerTextContainer: { flex: 1, marginLeft: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  addIcon: { fontSize: 28, color: '#FFF', fontWeight: 'bold' },
  statsContainer: { flexDirection: 'row', gap: 12, paddingHorizontal: 20 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(139,92,246,0.1)', borderRadius: 12, marginHorizontal: 20, marginTop: 16, marginBottom: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E9D5FF' },
  searchIcon: { fontSize: 20, marginRight: 8 },
  searchInput: { flex: 1, height: 48, fontSize: 16, color: '#1F2937' },
  filterContainer: { paddingHorizontal: 20, marginBottom: 12 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 8 },
  filterButtonActive: { backgroundColor: '#8B5CF6' },
  filterText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  filterTextActive: { color: '#FFF' },
  listContent: { padding: 20 },
  productCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  productCardLowStock: { borderWidth: 2, borderColor: '#FCA5A5' },
  lowStockBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  lowStockText: { fontSize: 11, fontWeight: 'bold', color: '#DC2626' },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  productInfo: { flex: 1 },
  productName: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  productCategory: { fontSize: 13, color: '#6B7280' },
  productQuantityBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignItems: 'center' },
  productQuantity: { fontSize: 20, fontWeight: 'bold', color: '#8B5CF6' },
  productQuantityLabel: { fontSize: 11, color: '#6B7280' },
  productDescription: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  productPriceLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  productPrice: { fontSize: 16, fontWeight: '600', color: '#111827' },
  productTotalLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4, textAlign: 'right' },
  productTotal: { fontSize: 18, fontWeight: 'bold', color: '#8B5CF6', textAlign: 'right' },
  productLocation: { fontSize: 12, color: '#8B5CF6', marginTop: 8 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#9CA3AF', marginBottom: 24 },
  emptyButton: { backgroundColor: '#8B5CF6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  modalClose: { fontSize: 28, color: '#9CA3AF' },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  formInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, fontSize: 16, color: '#111827' },
  pickerContainer: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden' },
  picker: { width: '100%', height: 50, fontSize: 16, color: '#111827', backgroundColor: 'transparent' } as any,
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelButton: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16, alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  saveButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  saveButtonGradient: { padding: 16, alignItems: 'center' },
  saveButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  selectedProductInfo: { backgroundColor: '#F3F4F6', padding: 16, borderRadius: 12, marginBottom: 20 },
  selectedProductName: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  selectedProductStock: { fontSize: 14, color: '#6B7280' },
  typeButtons: { flexDirection: 'row', gap: 12 },
  typeButton: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center' },
  typeButtonIn: { backgroundColor: '#10B981' },
  typeButtonOut: { backgroundColor: '#EF4444' },
  typeButtonText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  typeButtonTextActive: { color: '#FFF' },
});