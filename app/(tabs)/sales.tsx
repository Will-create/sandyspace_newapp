import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { ShoppingCart, Receipt, DollarSign } from 'lucide-react-native';
import { Product, Sale } from '@/types/Product';
import { StorageService } from '@/services/StorageService';

const BURGUNDY = '#400605';

export default function SalesScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadData();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [cart]);

  const loadData = async () => {
    try {
      const [storedProducts, allSales] = await Promise.all([
        StorageService.getProducts(),
        StorageService.getSales(),
      ]);
      
      if (isMounted.current) {
        setProducts(storedProducts);
        
        // Filtrer les ventes d'aujourd'hui
        const today = new Date().toDateString();
        const todaysSales = allSales.filter(
          sale => new Date(sale.timestamp).toDateString() === today
        );
        setTodaySales(todaysSales);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const calculateTotal = () => {
    const total = cart.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);
    if (isMounted.current) {
      setTotalAmount(total);
    }
  };

  const addToCart = (product: Product) => {
    if (!isMounted.current) return;
    
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        availableSizes: product.sizes,
        availableColors: product.colors,
        selectedSize: product.sizes[0] || '',
        selectedColor: product.colors[0] || '',
      }]);
    }
  };

  const removeFromCart = (productId: string) => {
    if (!isMounted.current) return;
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateCartItemQuantity = (productId: string, quantity: number) => {
    if (!isMounted.current) return;
    
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(cart.map(item =>
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  const processSale = async (paymentMethod: 'cash' | 'mobile-money' | 'credit') => {
    if (cart.length === 0) {
      Alert.alert('Panier vide', 'Veuillez ajouter des produits au panier avant de traiter la vente.');
      return;
    }

    try {
      const sales: Sale[] = cart.map(item => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        size: item.selectedSize,
        color: item.selectedColor,
        unitPrice: item.price,
        totalPrice: (parseFloat(item.price) * item.quantity).toString(),
        paymentMethod,
        timestamp: new Date().toISOString(),
      }));

      // Sauvegarder les ventes
      for (const sale of sales) {
        await StorageService.addSale(sale);
        
        // Mettre à jour le stock du produit
        const product = products.find(p => p.id === sale.productId);
        if (product && product.id) {
          const newStock = Math.max(0, product.stockQuantity - sale.quantity);
          await StorageService.updateProduct(product.id, { stockQuantity: newStock });
        }
      }

      // Générer le reçu
      generateReceipt(sales, paymentMethod);
      
      // Vider le panier et recharger les données seulement si le composant est encore monté
      if (isMounted.current) {
        setCart([]);
        await loadData();
      }
      
      Alert.alert('Vente terminée', 'La vente a été traitée avec succès !');
    } catch (error) {
      console.error('Erreur lors du traitement de la vente:', error);
      Alert.alert('Erreur', 'Échec du traitement de la vente. Veuillez réessayer.');
    }
  };

  const generateReceipt = (sales: Sale[], paymentMethod: string) => {
    // Dans une vraie application, ceci s'intégrerait avec expo-print
    console.log('Reçu généré pour les ventes:', sales);
    console.log('Mode de paiement:', paymentMethod);
    console.log('Montant total:', totalAmount);
  };

  const todayTotal = todaySales.reduce((sum, sale) => sum + parseFloat(sale.totalPrice), 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ventes</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <DollarSign size={20} color={BURGUNDY} />
            <Text style={styles.statValue}>{todayTotal.toFixed(0)}f</Text>
            <Text style={styles.statLabel}>Ventes du jour</Text>
          </View>
          <View style={styles.statCard}>
            <Receipt size={20} color={BURGUNDY} />
            <Text style={styles.statValue}>{todaySales.length}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Sélection des produits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sélectionner les produits</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {products.map(product => (
              <TouchableOpacity
                key={product.id}
                style={styles.productButton}
                onPress={() => addToCart(product)}
              >
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>{product.price}f</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Panier */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Panier ({cart.length} articles)</Text>
          {cart.map(item => (
            <View key={item.id} style={styles.cartItem}>
              <View style={styles.cartItemInfo}>
                <Text style={styles.cartItemName}>{item.name}</Text>
                <Text style={styles.cartItemPrice}>{item.price}f chacun</Text>
              </View>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Section de commande */}
      {cart.length > 0 && (
        <View style={styles.checkout}>
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Montant total</Text>
            <Text style={styles.totalAmount}>{totalAmount.toFixed(0)}f</Text>
          </View>
          
          <View style={styles.paymentButtons}>
            <TouchableOpacity
              style={[styles.paymentButton, styles.cashButton]}
              onPress={() => processSale('cash')}
            >
              <Text style={styles.paymentButtonText}>Espèces</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.paymentButton, styles.mobileButton]}
              onPress={() => processSale('mobile-money')}
            >
              <Text style={styles.paymentButtonText}>Mobile Money</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.paymentButton, styles.creditButton]}
              onPress={() => processSale('credit')}
            >
              <Text style={styles.paymentButtonText}>Crédit</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: BURGUNDY,
    marginTop: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#333',
    marginBottom: 12,
  },
  productButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  productName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#333',
  },
  productPrice: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: BURGUNDY,
    marginTop: 2,
  },
  cartItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333',
  },
  cartItemPrice: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BURGUNDY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: 'white',
  },
  quantity: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333',
    marginHorizontal: 16,
  },
  checkout: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#333',
  },
  totalAmount: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: BURGUNDY,
  },
  paymentButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cashButton: {
    backgroundColor: '#22c55e',
  },
  mobileButton: {
    backgroundColor: '#3b82f6',
  },
  creditButton: {
    backgroundColor: '#f59e0b',
  },
  paymentButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: 'white',
  },
});