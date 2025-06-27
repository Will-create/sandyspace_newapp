import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
  Image,
  Platform,
  ScrollView,
} from 'react-native';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  ScanLine, 
  Settings,
  CircleAlert as AlertCircle,
  User,
  Package,
  Percent,
  Calculator,
  Receipt,
  Gift,
  Clock,
  MapPin
} from 'lucide-react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Product, Sale } from '@/types/Product';
import { StorageService } from '@/services/StorageService';
import { apiService } from '@/services/ApiService';
import { MockDataService } from '@/services/MockDataService';
import { CameraView, Camera } from "expo-camera";

const BURGUNDY = '#400605';

interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  unitPrice: number;
  discount: number;
  tax: number;
  taxRate: number;
  total: number;
  imeiNumber?: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  points?: number;
  group?: string;
}

interface PaymentMethod {
  id: number;
  name: string;
  icon: React.ReactNode;
}

interface SaleData {
  customerId: string;
  warehouseId: string;
  billerId?: string;
  saleStatus: number; // 1: completed, 3: draft, 5: pending
  paymentStatus: number; // 1: pending, 2: partial, 3: paid, 4: overpaid
  totalQty: number;
  totalPrice: number;
  orderTax: number;
  orderTaxRate: number;
  orderDiscount: number;
  shippingCost: number;
  grandTotal: number;
  paidAmount: number;
  paymentNote?: string;
  saleNote?: string;
  staffNote?: string;
  couponId?: string;
  couponDiscount?: number;
}

export default function PosScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modals
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [variantModalVisible, setVariantModalVisible] = useState(false);
  const [scannerModalVisible, setScannerModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [discountModalVisible, setDiscountModalVisible] = useState(false);
  const [taxModalVisible, setTaxModalVisible] = useState(false);
  
  // Selected items
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCartIndex, setSelectedCartIndex] = useState<number>(-1);
  
  // Scanner
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  // Settings
  const [useMockData, setUseMockData] = useState(true);
  
  // Sale data
  const [saleData, setSaleData] = useState<Partial<SaleData>>({
    saleStatus: 1,
    paymentStatus: 1,
    orderTaxRate: 0,
    orderDiscount: 0,
    shippingCost: 0,
  });
  
  // Payment
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: 1, name: 'Espèces', icon: <Banknote size={20} color="white" /> },
    { id: 2, name: 'Carte Cadeau', icon: <Gift size={20} color="white" /> },
    { id: 3, name: 'Carte de Crédit', icon: <CreditCard size={20} color="white" /> },
    { id: 4, name: 'Chèque', icon: <Receipt size={20} color="white" /> },
    { id: 5, name: 'PayPal', icon: <Smartphone size={20} color="white" /> },
    { id: 6, name: 'Dépôt', icon: <Package size={20} color="white" /> },
    { id: 7, name: 'Points', icon: <Gift size={20} color="white" /> },
    { id: 8, name: 'Mobile Money', icon: <Smartphone size={20} color="white" /> },
  ]);
  
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<{[key: number]: number}>({});
  const [paymentAmounts, setPaymentAmounts] = useState<{[key: number]: string}>({});
  
  // Customers mock data
  const [customers] = useState<Customer[]>([
    { id: '1', name: 'Client par défaut', email: 'default@example.com', phone: '+237000000000', points: 0, group: 'Général' },
    { id: '2', name: 'Jean Dupont', email: 'jean@example.com', phone: '+237123456789', points: 150, group: 'VIP' },
    { id: '3', name: 'Marie Martin', email: 'marie@example.com', phone: '+237987654321', points: 75, group: 'Régulier' },
    { id: '4', name: 'Paul Durand', email: 'paul@example.com', phone: '+237555666777', points: 200, group: 'VIP' },
  ]);
  
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadSettings();
    setSelectedCustomer(customers[0]); // Default customer
    
    return () => {
      isMounted.current = false;
    };
  }, []);
 useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };

    getCameraPermissions();
  }, []);

  const handleBarcodeScanned = ({ type, data }) => {
    setScanned(true);
    alert(`Bar code with type ${type} and data ${data} has been scanned!`);
  };
  useEffect(() => {
    if (useMockData !== null) {
      loadProducts();
    }
  }, [useMockData]);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, products]);

  useEffect(() => {
    calculateTotals();
  }, [cart, saleData.orderTaxRate, saleData.orderDiscount, saleData.shippingCost]);

  const loadSettings = async () => {
    try {
      const settings = await StorageService.getSettings();
      const mockDataSetting = settings.useMockData !== undefined ? settings.useMockData : true;
      if (isMounted.current) {
        setUseMockData(mockDataSetting);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      if (isMounted.current) {
        setUseMockData(true);
      }
    }
  };

  const loadProducts = async () => {
    try {
      setError(null);
      
      if (useMockData) {
        const mockProducts = MockDataService.getMockProducts();
        if (isMounted.current) {
          setProducts(mockProducts);
        }
        await StorageService.saveProducts(mockProducts);
      } else {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        try {
          const apiProducts = await apiService.getProducts();
          clearTimeout(timeoutId);
          
          const convertedProducts = apiProducts.map(convertApiProductToProduct);
          
          if (isMounted.current) {
            setProducts(convertedProducts);
          }
          
          await StorageService.saveProducts(convertedProducts);
        } catch (apiError) {
          clearTimeout(timeoutId);
          throw apiError;
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      
      let errorMessage = 'Erreur de connexion';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Impossible de se connecter au serveur. Utilisation des données locales.';
        } else if (error.name === 'AbortError') {
          errorMessage = 'Délai d\'attente dépassé. Utilisation des données locales.';
        } else {
          errorMessage = error.message;
        }
      }
      
      if (isMounted.current) {
        setError(errorMessage);
      }
      
      if (!useMockData) {
        try {
          const localProducts = await StorageService.getProducts();
          if (localProducts && localProducts.length > 0) {
            if (isMounted.current) {
              setProducts(localProducts);
              setError(errorMessage + ' Données locales chargées.');
            }
          } else {
            throw new Error('Aucune donnée locale disponible');
          }
        } catch (localError) {
          console.error('Erreur lors du chargement des produits locaux:', localError);
          const mockProducts = MockDataService.getMockProducts();
          if (isMounted.current) {
            setProducts(mockProducts);
            setError(errorMessage + ' Utilisation des données de démonstration.');
          }
        }
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const convertApiProductToProduct = (apiProduct: any): Product => ({
    id: apiProduct.id,
    name: apiProduct.name,
    price: apiProduct.price,
    description: apiProduct.description,
    category: apiProduct.category?.name,
    colors: apiProduct.colors,
    sizes: apiProduct.sizes,
    stockQuantity: apiProduct.stock_quantity,
    images: apiProduct.images,
    createdAt: apiProduct.created_at,
    updatedAt: apiProduct.updated_at,
  });

  const filterProducts = () => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.colors.some(color => color.toLowerCase().includes(searchQuery.toLowerCase())) ||
      product.sizes.some(size => size.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    setFilteredProducts(filtered);
  };

  const calculateTotals = () => {
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.total, 0);
    
    const orderTax = (totalPrice * (saleData.orderTaxRate || 0)) / 100;
    const orderDiscount = saleData.orderDiscount || 0;
    const shippingCost = saleData.shippingCost || 0;
    
    const grandTotal = totalPrice + orderTax - orderDiscount + shippingCost;
    
    setSaleData(prev => ({
      ...prev,
      totalQty,
      totalPrice,
      orderTax,
      grandTotal,
    }));
  };



  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScannerModalVisible(false);
    console.log(`Bar code with type ${type} and data ${data} has been scanned!`);
    const product = useMockData 
      ? MockDataService.findProductByBarcode(data)
      : products.find(p => p.id === data);
    
    if (product) {
      addToCart(product);
      Alert.alert('Produit trouvé', `${product.name} ajouté au panier`);
    } else {
      Alert.alert('Produit non trouvé', `Aucun produit trouvé avec le code-barres: ${data}`);
    }
  };

  const addToCart = (product: Product, size?: string, color?: string) => {
    if (product.stockQuantity === 0) {
      Alert.alert('Stock épuisé', 'Ce produit n\'est plus en stock.');
      return;
    }

    if ((product.colors.length > 1 || product.sizes.length > 1) && !size && !color) {
      setSelectedProduct(product);
      setVariantModalVisible(true);
      return;
    }

    const selectedSize = size || product.sizes[0];
    const selectedColor = color || product.colors[0];
    const unitPrice = parseFloat(product.price);
    
    const cartItem: CartItem = {
      product,
      quantity: 1,
      selectedSize,
      selectedColor,
      unitPrice,
      discount: 0,
      tax: 0,
      taxRate: 0,
      total: unitPrice,
    };

    setCart(prev => {
      const existingIndex = prev.findIndex(item => 
        item.product.id === product.id &&
        item.selectedSize === selectedSize &&
        item.selectedColor === selectedColor
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].unitPrice - updated[existingIndex].discount + updated[existingIndex].tax;
        return updated;
      }

      return [...prev, cartItem];
    });
  };

  const updateCartQuantity = (index: number, change: number) => {
    setCart(prev => {
      const updated = [...prev];
      updated[index].quantity += change;
      
      if (updated[index].quantity <= 0) {
        updated.splice(index, 1);
      } else {
        updated[index].total = updated[index].quantity * updated[index].unitPrice - updated[index].discount + updated[index].tax;
      }
      
      return updated;
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const openDiscountModal = (index: number) => {
    setSelectedCartIndex(index);
    setDiscountModalVisible(true);
  };

  const applyDiscount = (discount: number) => {
    if (selectedCartIndex >= 0) {
      setCart(prev => {
        const updated = [...prev];
        updated[selectedCartIndex].discount = discount;
        updated[selectedCartIndex].total = updated[selectedCartIndex].quantity * updated[selectedCartIndex].unitPrice - discount + updated[selectedCartIndex].tax;
        return updated;
      });
    }
    setDiscountModalVisible(false);
    setSelectedCartIndex(-1);
  };

  const processSale = async (paymentMethodIds: number[], amounts: number[]) => {
    if (cart.length === 0) {
      Alert.alert('Panier vide', 'Veuillez ajouter des produits au panier avant de traiter la vente.');
      return;
    }

    if (!selectedCustomer) {
      Alert.alert('Client requis', 'Veuillez sélectionner un client.');
      return;
    }

    try {
      // Generate reference number
      const referenceNo = `posr-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now()}`;
      
      // Calculate payment status
      const totalPaid = amounts.reduce((sum, amount) => sum + amount, 0);
      let paymentStatus = 1; // pending
      if (totalPaid >= (saleData.grandTotal || 0)) {
        paymentStatus = totalPaid > (saleData.grandTotal || 0) ? 4 : 3; // overpaid : paid
      } else if (totalPaid > 0) {
        paymentStatus = 2; // partial
      }

      // Create sale record
      const sale: Sale = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        productId: cart[0].product.id, // For compatibility, use first product
        productName: `Vente POS - ${cart.length} articles`,
        quantity: saleData.totalQty || 0,
        size: '',
        color: '',
        unitPrice: (saleData.grandTotal || 0).toString(),
        totalPrice: (saleData.grandTotal || 0).toString(),
        paymentMethod: paymentMethodIds.length > 0 ? getPaymentMethodName(paymentMethodIds[0]) : 'cash',
        timestamp: new Date().toISOString(),
      };

      // Save sale
      await StorageService.addSale(sale);

      // Update product stock
      for (const item of cart) {
        const newStock = Math.max(0, item.product.stockQuantity - item.quantity);
        await StorageService.updateProduct(item.product.id, { stockQuantity: newStock });
      }

      // Clear cart
      setCart([]);
      setCheckoutModalVisible(false);
      
      Alert.alert(
        'Vente terminée', 
        `Vente de ${(saleData.grandTotal || 0).toFixed(0)}f traitée avec succès !\nRéférence: ${referenceNo}`,
        [{ text: 'OK' }]
      );
      
      // Reload products to update stock
      await loadProducts();
    } catch (error) {
      console.error('Erreur lors du traitement de la vente:', error);
      Alert.alert('Erreur', 'Échec du traitement de la vente. Veuillez réessayer.');
    }
  };

  const getPaymentMethodName = (id: number): 'cash' | 'mobile-money' | 'credit' => {
    switch (id) {
      case 8: return 'mobile-money';
      case 3: return 'credit';
      default: return 'cash';
    }
  };

  const toggleDataSource = async () => {
    const newUseMockData = !useMockData;
    setUseMockData(newUseMockData);
    await StorageService.updateSettings({ useMockData: newUseMockData });
    setSettingsModalVisible(false);
    setLoading(true);
    await loadProducts();
  };

  const retryLoadProducts = () => {
    setLoading(true);
    setError(null);
    loadProducts();
  };


  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }
  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={[styles.productItem, item.stockQuantity === 0 && styles.outOfStockItem]}
      onPress={() => addToCart(item)}
      disabled={item.stockQuantity === 0}
    >
      <View style={styles.productImageContainer}>
        {item.images.length > 0 ? (
          <Image 
            source={{ uri: item.images[0] }} 
            style={styles.productImage}
            defaultSource={{ uri: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=100' }}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <ShoppingCart size={24} color="#ccc" />
          </View>
        )}
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productPrice}>{item.price}f</Text>
        
        <View style={styles.productMeta}>
          <Text style={styles.stockText}>
            {item.stockQuantity === 0 ? 'Rupture de stock' : `${item.stockQuantity} en stock`}
          </Text>
          {item.category && (
            <Text style={styles.categoryText}>{item.category}</Text>
          )}
        </View>
        
        <View style={styles.variantInfo}>
          <Text style={styles.variantText}>
            {item.colors.slice(0, 2).join(', ')} {item.colors.length > 2 && `+${item.colors.length - 2}`}
          </Text>
          <Text style={styles.variantText}>
            {item.sizes.slice(0, 3).join(', ')} {item.sizes.length > 3 && `+${item.sizes.length - 3}`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCartItem = ({ item, index }: { item: CartItem; index: number }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName}>{item.product.name}</Text>
        <Text style={styles.cartItemVariant}>
          {item.selectedColor} • {item.selectedSize}
        </Text>
        <Text style={styles.cartItemPrice}>
          {item.unitPrice}f × {item.quantity} = {item.total.toFixed(0)}f
        </Text>
        {item.discount > 0 && (
          <Text style={styles.cartItemDiscount}>
            Remise: -{item.discount}f
          </Text>
        )}
      </View>
      
      <View style={styles.cartItemActions}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateCartQuantity(index, -1)}
        >
          <Minus size={16} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.quantityText}>{item.quantity}</Text>
        
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateCartQuantity(index, 1)}
        >
          <Plus size={16} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.discountButton}
          onPress={() => openDiscountModal(index)}
        >
          <Percent size={16} color={BURGUNDY} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFromCart(index)}
        >
          <X size={16} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement des produits...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Point de Vente</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.scanButton}
            onPress={() => setScannerModalVisible(true)}
          >
            <ScanLine size={20} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => setSettingsModalVisible(true)}
          >
            <Settings size={20} color={BURGUNDY} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={() => setCheckoutModalVisible(true)}
          >
            <ShoppingCart size={24} color="white" />
            {cart.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cart.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={16} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={retryLoadProducts}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Customer and Sale Info */}
      <View style={styles.saleInfoContainer}>
        <TouchableOpacity 
          style={styles.customerButton}
          onPress={() => setCustomerModalVisible(true)}
        >
          <User size={16} color={BURGUNDY} />
          <Text style={styles.customerText}>
            {selectedCustomer?.name || 'Sélectionner un client'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.saleStats}>
          <Text style={styles.saleStatText}>
            Articles: {saleData.totalQty || 0}
          </Text>
          <Text style={styles.saleStatText}>
            Total: {(saleData.grandTotal || 0).toFixed(0)}f
          </Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par nom, catégorie, couleur, taille..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.dataSourceIndicator}>
          <Text style={styles.dataSourceText}>
            {useMockData ? 'Données fictives' : 'API'}
          </Text>
        </View>
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productGrid}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Search size={48} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Aucun produit trouvé' : 'Aucun produit disponible'}
            </Text>
          </View>
        }
      />

      {/* Scanner Modal */}
      <Modal
        visible={scannerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setScannerModalVisible(false)}
      >
        <View style={styles.scannerModal}>
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>Scanner le code-barres</Text>
            <TouchableOpacity onPress={() => setScannerModalVisible(false)}>
              <X size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          {Platform.OS !== 'web' && hasPermission && (
            <>
              <CameraView
                onBarCodeScanned={handleBarCodeScanned}
                  barcodeScannerSettings={{
              barcodeTypes: ["qr", "pdf417", "code128", "code39", "codabar"],
            }}
                style={styles.scanner}
              />
              
            {scanned && (
              <Button title={"Tap to Scan Again"} onPress={() => setScanned(false)} />
          )}
            </>
          )}
          
          {Platform.OS === 'web' && (
            <View style={styles.webScannerPlaceholder}>
              <ScanLine size={64} color="#ccc" />
              <Text style={styles.webScannerText}>
                Scanner non disponible sur le web
              </Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={settingsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Paramètres de données</Text>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.settingsContent}>
              <Text style={styles.settingsDescription}>
                Choisissez la source de données pour l'application
              </Text>
              
              <TouchableOpacity
                style={[styles.dataSourceOption, useMockData && styles.selectedDataSource]}
                onPress={toggleDataSource}
              >
                <Text style={styles.dataSourceOptionText}>
                  {useMockData ? '✓ Données fictives (actuel)' : 'Données fictives'}
                </Text>
                <Text style={styles.dataSourceDescription}>
                  Utilise des données de démonstration locales
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.dataSourceOption, !useMockData && styles.selectedDataSource]}
                onPress={toggleDataSource}
              >
                <Text style={styles.dataSourceOptionText}>
                  {!useMockData ? '✓ API (actuel)' : 'API'}
                </Text>
                <Text style={styles.dataSourceDescription}>
                  Se connecte au serveur pour les données réelles
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Customer Selection Modal */}
      <Modal
        visible={customerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCustomerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner un client</Text>
              <TouchableOpacity onPress={() => setCustomerModalVisible(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.customerList}>
              {customers.map(customer => (
                <TouchableOpacity
                  key={customer.id}
                  style={[
                    styles.customerItem,
                    selectedCustomer?.id === customer.id && styles.selectedCustomer
                  ]}
                  onPress={() => {
                    setSelectedCustomer(customer);
                    setCustomerModalVisible(false);
                  }}
                >
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{customer.name}</Text>
                    <Text style={styles.customerDetails}>
                      {customer.email} • {customer.phone}
                    </Text>
                    <Text style={styles.customerGroup}>
                      {customer.group} • {customer.points} points
                    </Text>
                  </View>
                  {selectedCustomer?.id === customer.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Variant Selection Modal */}
      <Modal
        visible={variantModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setVariantModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner la variante</Text>
              <TouchableOpacity onPress={() => setVariantModalVisible(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {selectedProduct && (
              <View style={styles.variantSelection}>
                <Text style={styles.productModalName}>{selectedProduct.name}</Text>
                <Text style={styles.productModalPrice}>{selectedProduct.price}f</Text>
                
                <Text style={styles.variantLabel}>Couleurs :</Text>
                <View style={styles.variantOptions}>
                  {selectedProduct.colors.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={styles.colorOption}
                      onPress={() => {
                        addToCart(selectedProduct, selectedProduct.sizes[0], color);
                        setVariantModalVisible(false);
                      }}
                    >
                      <View style={[styles.colorDot, { backgroundColor: color.toLowerCase() }]} />
                      <Text style={styles.colorName}>{color}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <Text style={styles.variantLabel}>Tailles :</Text>
                <View style={styles.variantOptions}>
                  {selectedProduct.sizes.map(size => (
                    <TouchableOpacity
                      key={size}
                      style={styles.sizeOption}
                      onPress={() => {
                        addToCart(selectedProduct, size, selectedProduct.colors[0]);
                        setVariantModalVisible(false);
                      }}
                    >
                      <Text style={styles.sizeText}>{size}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Discount Modal */}
      <Modal
        visible={discountModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDiscountModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Appliquer une remise</Text>
              <TouchableOpacity onPress={() => setDiscountModalVisible(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.discountOptions}>
              {[5, 10, 15, 20, 25].map(percent => (
                <TouchableOpacity
                  key={percent}
                  style={styles.discountOption}
                  onPress={() => {
                    if (selectedCartIndex >= 0) {
                      const item = cart[selectedCartIndex];
                      const discount = (item.unitPrice * item.quantity * percent) / 100;
                      applyDiscount(discount);
                    }
                  }}
                >
                  <Text style={styles.discountOptionText}>{percent}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Checkout Modal */}
      <Modal
        visible={checkoutModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCheckoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.checkoutModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Finaliser la vente</Text>
              <TouchableOpacity onPress={() => setCheckoutModalVisible(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {/* Customer Info */}
            <View style={styles.checkoutCustomer}>
              <User size={16} color="#666" />
              <Text style={styles.checkoutCustomerText}>
                {selectedCustomer?.name || 'Aucun client sélectionné'}
              </Text>
            </View>
            
            {/* Cart Items */}
            <FlatList
              data={cart}
              renderItem={renderCartItem}
              keyExtractor={(item, index) => `${item.product.id}-${index}`}
              style={styles.cartList}
            />
            
            {/* Sale Summary */}
            <View style={styles.checkoutSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sous-total</Text>
                <Text style={styles.summaryValue}>{(saleData.totalPrice || 0).toFixed(0)}f</Text>
              </View>
              
              {(saleData.orderTax || 0) > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Taxe ({saleData.orderTaxRate}%)</Text>
                  <Text style={styles.summaryValue}>{(saleData.orderTax || 0).toFixed(0)}f</Text>
                </View>
              )}
              
              {(saleData.orderDiscount || 0) > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Remise</Text>
                  <Text style={styles.summaryValue}>-{(saleData.orderDiscount || 0).toFixed(0)}f</Text>
                </View>
              )}
              
              {(saleData.shippingCost || 0) > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Livraison</Text>
                  <Text style={styles.summaryValue}>{(saleData.shippingCost || 0).toFixed(0)}f</Text>
                </View>
              )}
              
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>{(saleData.grandTotal || 0).toFixed(0)}f</Text>
              </View>
              
              {/* Payment Methods */}
              <View style={styles.paymentSection}>
                <Text style={styles.paymentTitle}>Méthodes de paiement</Text>
                <View style={styles.paymentButtons}>
                  {paymentMethods.slice(0, 4).map(method => (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.paymentButton,
                        method.id === 1 && styles.cashButton,
                        method.id === 2 && styles.giftButton,
                        method.id === 3 && styles.creditButton,
                        method.id === 4 && styles.chequeButton,
                      ]}
                      onPress={() => processSale([method.id], [saleData.grandTotal || 0])}
                    >
                      {method.icon}
                      <Text style={styles.paymentButtonText}>{method.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <View style={styles.paymentButtons}>
                  {paymentMethods.slice(4).map(method => (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.paymentButton,
                        method.id === 5 && styles.paypalButton,
                        method.id === 6 && styles.depositButton,
                        method.id === 7 && styles.pointsButton,
                        method.id === 8 && styles.mobileButton,
                      ]}
                      onPress={() => processSale([method.id], [saleData.grandTotal || 0])}
                    >
                      {method.icon}
                      <Text style={styles.paymentButtonText}>{method.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#dc2626',
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  retryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scanButton: {
    backgroundColor: '#22c55e',
    padding: 10,
    borderRadius: 8,
  },
  settingsButton: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BURGUNDY,
  },
  cartButton: {
    backgroundColor: BURGUNDY,
    padding: 12,
    borderRadius: 12,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: 'white',
  },
  saleInfoContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  customerText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: BURGUNDY,
  },
  saleStats: {
    flexDirection: 'row',
    gap: 16,
  },
  saleStatText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#333',
  },
  searchContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#333',
  },
  dataSourceIndicator: {
    alignItems: 'center',
  },
  dataSourceText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  productGrid: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  productItem: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  outOfStockItem: {
    opacity: 0.6,
  },
  productImageContainer: {
    height: 120,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    minHeight: 36,
  },
  productPrice: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: BURGUNDY,
    marginBottom: 6,
  },
  productMeta: {
    marginBottom: 6,
  },
  stockText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
  },
  categoryText: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  variantInfo: {
    gap: 2,
  },
  variantText: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  scannerModal: {
    flex: 1,
    backgroundColor: 'black',
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  scannerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: 'white',
  },
  scanner: {
    flex: 1,
  },
  webScannerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  webScannerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#ccc',
    marginTop: 16,
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
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  checkoutModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '95%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#333',
  },
  settingsContent: {
    gap: 16,
  },
  settingsDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dataSourceOption: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e5e5',
  },
  selectedDataSource: {
    borderColor: BURGUNDY,
    backgroundColor: '#f8f9fa',
  },
  dataSourceOptionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  dataSourceDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
  },
  customerList: {
    maxHeight: 400,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedCustomer: {
    backgroundColor: '#f8f9fa',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333',
  },
  customerDetails: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  customerGroup: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  checkmark: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: BURGUNDY,
  },
  variantSelection: {
    gap: 16,
  },
  productModalName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#333',
  },
  productModalPrice: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: BURGUNDY,
  },
  variantLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333',
  },
  variantOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  colorName: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#333',
    textTransform: 'capitalize',
  },
  sizeOption: {
    backgroundColor: BURGUNDY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sizeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: 'white',
  },
  discountOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  discountOption: {
    backgroundColor: BURGUNDY,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  discountOptionText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: 'white',
  },
  checkoutCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  checkoutCustomerText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#333',
  },
  cartList: {
    maxHeight: 300,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#333',
  },
  cartItemVariant: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  cartItemPrice: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: BURGUNDY,
    marginTop: 2,
  },
  cartItemDiscount: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#22c55e',
    marginTop: 2,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    backgroundColor: BURGUNDY,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333',
    minWidth: 24,
    textAlign: 'center',
  },
  discountButton: {
    padding: 4,
  },
  removeButton: {
    padding: 4,
  },
  checkoutSummary: {
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 16,
    marginTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 8,
    marginTop: 8,
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
  paymentSection: {
    marginTop: 16,
  },
  paymentTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  paymentButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  paymentButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  cashButton: {
    backgroundColor: '#22c55e',
  },
  giftButton: {
    backgroundColor: '#f59e0b',
  },
  creditButton: {
    backgroundColor: '#3b82f6',
  },
  chequeButton: {
    backgroundColor: '#8b5cf6',
  },
  paypalButton: {
    backgroundColor: '#0070ba',
  },
  depositButton: {
    backgroundColor: '#06b6d4',
  },
  pointsButton: {
    backgroundColor: '#ec4899',
  },
  mobileButton: {
    backgroundColor: '#10b981',
  },
  paymentButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: 'white',
  },
});