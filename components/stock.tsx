import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Package, TriangleAlert as AlertTriangle, Plus, Minus } from 'lucide-react-native';
import { Product } from '@/types/Product';
import { StorageService } from '@/services/StorageService';

const BURGUNDY = '#400605';

export default function StockScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [stockInput, setStockInput] = useState('');
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadProducts();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadProducts = async () => {
    try {
      const storedProducts = await StorageService.getProducts();
      if (isMounted.current) {
        setProducts(storedProducts);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    if (isMounted.current) {
      setRefreshing(true);
    }
    await loadProducts();
    if (isMounted.current) {
      setRefreshing(false);
    }
  };

  const openStockModal = (product: Product) => {
    setSelectedProduct(product);
    setStockInput(product.stockQuantity.toString());
    setStockModalVisible(true);
  };

  const updateStock = async (operation: 'set' | 'add' | 'subtract') => {
    if (!selectedProduct) return;

    const inputValue = parseInt(stockInput) || 0;
    let newStock = selectedProduct.stockQuantity;

    switch (operation) {
      case 'set':
        newStock = inputValue;
        break;
      case 'add':
        newStock = selectedProduct.stockQuantity + inputValue;
        break;
      case 'subtract':
        newStock = Math.max(0, selectedProduct.stockQuantity - inputValue);
        break;
    }

    try {
      await StorageService.updateProduct(selectedProduct.id, { stockQuantity: newStock });
      await loadProducts();
      setStockModalVisible(false);
      setSelectedProduct(null);
      setStockInput('');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stock:', error);
      Alert.alert('Erreur', 'Échec de la mise à jour du stock. Veuillez réessayer.');
    }
  };

  const quickAddStock = async (product: Product, amount: number) => {
    try {
      const newStock = product.stockQuantity + amount;
      await StorageService.updateProduct(product.id, { stockQuantity: newStock });
      await loadProducts();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stock:', error);
      Alert.alert('Erreur', 'Échec de la mise à jour du stock. Veuillez réessayer.');
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { status: 'out', color: '#dc2626', text: 'Rupture de stock' };
    if (quantity <= 5) return { status: 'low', color: '#f59e0b', text: 'Stock faible' };
    if (quantity <= 20) return { status: 'medium', color: '#eab308', text: 'Stock moyen' };
    return { status: 'good', color: '#22c55e', text: 'Stock suffisant' };
  };

  const renderStockItem = ({ item }: { item: Product }) => {
    const stockStatus = getStockStatus(item.stockQuantity);

    return (
      <View style={styles.stockItem}>
        <TouchableOpacity 
          style={styles.productInfo}
          onPress={() => openStockModal(item)}
        >
          <View style={styles.productHeader}>
            <Text style={styles.productName}>{item.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: stockStatus.color + '20' }]}>
              <Text style={[styles.statusText, { color: stockStatus.color }]}>
                {stockStatus.text}
              </Text>
            </View>
          </View>
          
          <View style={styles.stockDetails}>
            <View style={styles.stockInfo}>
              <Package size={16} color="#666" />
              <Text style={styles.stockQuantity}>{item.stockQuantity} unités</Text>
            </View>
            
            {item.stockQuantity <= 5 && (
              <View style={styles.warningInfo}>
                <AlertTriangle size={16} color="#dc2626" />
                <Text style={styles.warningText}>Réapprovisionnement nécessaire</Text>
              </View>
            )}
          </View>

          <View style={styles.productMeta}>
            <Text style={styles.productPrice}>{item.price}f par unité</Text>
            <Text style={styles.productValue}>
              Valeur totale: {(parseFloat(item.price) * item.stockQuantity).toFixed(0)}f
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => quickAddStock(item, 5)}
          >
            <Plus size={16} color={BURGUNDY} />
            <Text style={styles.quickButtonText}>+5</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => quickAddStock(item, 10)}
          >
            <Plus size={16} color={BURGUNDY} />
            <Text style={styles.quickButtonText}>+10</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const lowStockProducts = products.filter(p => p.stockQuantity <= 5);
  const outOfStockProducts = products.filter(p => p.stockQuantity === 0);
  const totalValue = products.reduce((sum, product) => {
    return sum + (parseFloat(product.price) * product.stockQuantity);
  }, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestion du stock</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{products.length}</Text>
            <Text style={styles.statLabel}>Total produits</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>{lowStockProducts.length}</Text>
            <Text style={styles.statLabel}>Stock faible</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#dc2626' }]}>{outOfStockProducts.length}</Text>
            <Text style={styles.statLabel}>Rupture de stock</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#22c55e' }]}>{totalValue.toFixed(0)}f</Text>
            <Text style={styles.statLabel}>Valeur totale</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={products}
        renderItem={renderStockItem}
        keyExtractor={(item) => item.id || ''}
        contentContainerStyle={styles.stockList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BURGUNDY}
          />
        }
      />

      {/* Modal de mise à jour du stock */}
      <Modal
        visible={stockModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStockModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mettre à jour le stock</Text>
            
            {selectedProduct && (
              <View style={styles.modalProductInfo}>
                <Text style={styles.modalProductName}>{selectedProduct.name}</Text>
                <Text style={styles.modalCurrentStock}>
                  Stock actuel: {selectedProduct.stockQuantity} unités
                </Text>
              </View>
            )}

            <TextInput
              style={styles.stockInput}
              value={stockInput}
              onChangeText={setStockInput}
              placeholder="Entrer la quantité"
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.setButton]}
                onPress={() => updateStock('set')}
              >
                <Text style={styles.modalButtonText}>Définir à {stockInput}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={() => updateStock('add')}
              >
                <Text style={styles.modalButtonText}>Ajouter {stockInput}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.subtractButton]}
                onPress={() => updateStock('subtract')}
              >
                <Text style={styles.modalButtonText}>Retirer {stockInput}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setStockModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: BURGUNDY,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  stockList: {
    padding: 16,
  },
  stockItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfo: {
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
  },
  stockDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockQuantity: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#333',
    marginLeft: 6,
  },
  warningInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#dc2626',
    marginLeft: 4,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productPrice: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
  },
  productValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: BURGUNDY,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BURGUNDY,
  },
  quickButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: BURGUNDY,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalProductInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalProductName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  modalCurrentStock: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  stockInput: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Inter-Regular',
  },
  modalButtons: {
    gap: 8,
    marginBottom: 16,
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  setButton: {
    backgroundColor: BURGUNDY,
  },
  addButton: {
    backgroundColor: '#22c55e',
  },
  subtractButton: {
    backgroundColor: '#f59e0b',
  },
  modalButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: 'white',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#666',
  },
});