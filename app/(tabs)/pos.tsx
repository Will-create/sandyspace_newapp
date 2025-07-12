import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Button,
  Dimensions,
  Switch,
  RefreshControl,
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
  CircleAlert as AlertCircle,
  User,
  Package,
  Percent,
  Calculator,
  Receipt,
  Gift,
  Clock,
  MapPin,
  Filter,
  Loader2,
  SortAsc,
  SortDesc,
} from 'lucide-react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Product, Sale } from '@/types/Product';
import { ProductFilters } from '@/services/ApiService';
import { StorageService } from '@/services/StorageService';
import { apiService } from '@/services/ApiService';
import { CameraView, Camera } from "expo-camera";

const BURGUNDY = '#400605';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

interface FilterOptions {
  categories: Array<{ id: string; name: string }>;
  brands: Array<{ id: string; name: string }>;
  warehouses: Array<{ id: number; name: string }>;
}

export default function PosScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // Modals
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [variantModalVisible, setVariantModalVisible] = useState(false);
  const [scannerModalVisible, setScannerModalVisible] = useState(false);
  const [discountModalVisible, setDiscountModalVisible] = useState(false);
  const [taxModalVisible, setTaxModalVisible] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Selected items
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCartIndex, setSelectedCartIndex] = useState<number>(-1);
  
  // Scanner
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  
  
  // Filters
  const [filters, setFilters] = useState<ProductFilters>({
    arrivage: false,
    sort_by: 'created_at',
    sort_order: 'asc',
    category_id: '',
    brand_id: '',
    warehouse_id: undefined,
    per_page: 20,
    search: '',
  });
  
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    brands: [],
    warehouses: [],
  });
  
  const [appliedFilters, setAppliedFilters] = useState<ProductFilters>({
    arrivage: false,
    sort_by: 'created_at',
    sort_order: 'asc',
    category_id: '',
    brand_id: '',
    warehouse_id: undefined,
    per_page: 20,
    search: '',
  });
  
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
    { id: 1, name: 'Cash', icon: <Banknote size={20} color="white" /> },
    { id: 3, name: 'VISA', icon: <CreditCard size={20} color="white" /> },
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
    const initializeData = async () => {
      try {
        await loadProducts(true);
      } catch (error) {
        console.error('Error initializing POS:', error);
      }
    };
    
    initializeData();
    setSelectedCustomer(customers[0]); // Default customer
    
    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading && isMounted.current) {
        setLoading(false);
        setError('Temps de chargement dépassé. Veuillez réessayer.');
      }
    }, 15000); // 15 seconds timeout
    
    return () => {
      isMounted.current = false;
      clearTimeout(timeout);
    };
  }, []);
 useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };

    getCameraPermissions();
  }, []);

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    alert(`Bar code with type ${type} and data ${data} has been scanned!`);
  };

  useEffect(() => {
    if (searchQuery) {
      const cleanQuery = searchQuery.trim().toLowerCase();
      const filtered = products.filter((product) => {
        return (
          product.name?.toLowerCase().includes(cleanQuery) ||
          product.description?.toLowerCase().includes(cleanQuery) ||
          product.category?.toLowerCase().includes(cleanQuery) ||
          product.code?.toLowerCase().includes(cleanQuery)
        );
      });
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  useEffect(() => {
    calculateTotals();
  }, [cart, saleData.orderTaxRate, saleData.orderDiscount, saleData.shippingCost]);

  const loadProducts = async (reset = false, loadMore = false) => {
    if (loading && !reset) return;
    
    try {
      console.log('Loading products...', { reset, loadMore, appliedFilters });
      setError(null);
      
      if (reset || (!loadMore && products.length === 0)) {
        setLoading(true);
        setPage(1);
        const response = await apiService.getProductsWithFilters({
          ...appliedFilters,
          page: 1,
        });
        
        console.log('Products loaded:', response);
        
        // Check if response has products
        if (!response || !response.products) {
          console.error('Invalid response format:', response);
          throw new Error('Format de réponse invalide');
        }
        
        const convertedProducts = response.products.map(convertApiProductToProduct);
        if (isMounted.current) {
          setProducts(convertedProducts);
          setFilterOptions(response.options || {
            categories: [],
            brands: [],
            warehouses: []
          });
          setHasMore(response.products.length === (appliedFilters.per_page || 20));
        }
      } else if (loadMore && hasMore) {
        setLoadingMore(true);
        const nextPage = page + 1;
        const response = await apiService.getProductsWithFilters({
          ...appliedFilters,
          page: nextPage,
        });
        
        // Check if response has products
        if (!response || !response.products) {
          console.error('Invalid response format:', response);
          throw new Error('Format de réponse invalide');
        }
        
        const convertedProducts = response.products.map(convertApiProductToProduct);
        if (isMounted.current) {
          setProducts(prev => [...prev, ...convertedProducts]);
          setPage(nextPage);
          setHasMore(response.products.length === (appliedFilters.per_page || 20));
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      
      let errorMessage = 'Erreur de connexion';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Impossible de se connecter au serveur.';
        } else if (error.name === 'AbortError') {
          errorMessage = 'Délai d\'attente dépassé.';
        } else {
          errorMessage = error.message;
        }
      }
      
      if (isMounted.current) {
        setError(errorMessage);
        
        // Set empty products array if no local products to prevent infinite loading
        if (!loadMore && products.length === 0) {
          setProducts([]);
        }
      }
      
      // Try to load local products
      if (!loadMore) {
        try {
          const localProducts = await StorageService.getProducts();
          if (localProducts && localProducts.length > 0 && isMounted.current) {
            setProducts(localProducts);
            setError(errorMessage + ' Données locales chargées.');
          }
        } catch (localError) {
          console.error('Erreur lors du chargement des produits locaux:', localError);
        }
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    }
  };

  const convertApiProductToProduct = (apiProduct: any): Product => ({
    id: apiProduct.id || '',
    name: apiProduct.name || 'Produit sans nom',
    price: apiProduct.price || '0',
    description: apiProduct.description || '',
    category: apiProduct.category?.name || '',
    colors: apiProduct.colors || [],
    sizes: apiProduct.sizes || [],
    stockQuantity: apiProduct.stock_quantity || 0,
    images: apiProduct.images || [],
    createdAt: apiProduct.created_at || new Date().toISOString(),
    updatedAt: apiProduct.updated_at || new Date().toISOString(),
    code: apiProduct.code || '',
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProducts(true);
  }, [appliedFilters]);

  const loadMoreProducts = useCallback(async () => {
    if (!loadingMore && hasMore) {
      await loadProducts(false, true);
    }
  }, [loadingMore, hasMore, page, appliedFilters]);

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const applyFilters = () => {
    setAppliedFilters(filters);
    setShowFilters(false);
    loadProducts(true);
  };

  const clearFilters = () => {
    const clearedFilters: ProductFilters = {
      arrivage: false,
      sort_by: 'created_at' as 'created_at',
      sort_order: 'asc' as 'asc',
      category_id: '',
      brand_id: '',
      warehouse_id: undefined,
      per_page: 20,
      search: '',
    };
    setFilters(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (appliedFilters.arrivage) count++;
    if (appliedFilters.category_id) count++;
    if (appliedFilters.brand_id) count++;
    if (appliedFilters.warehouse_id) count++;
    return count;
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
    setScanned(true);
    setScannerModalVisible(false);
    console.log(`Bar code with type ${type} and data ${data} has been scanned!`);
    const product = products.find(p => p.code === data || p.id === data);
    
    if (product) {
      addToCart(product);
      Alert.alert('Produit trouvé', `${product.name} ajouté au panier`);
    } else {
      Alert.alert('Produit non trouvé', `Aucun produit trouvé avec le code-barres: ${data}`);
    }
  };

  const addToCart = async (product: Product, size?: string, color?: string) => {
    // Allow adding out of stock items - removed stock check
    
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

  const retryLoadProducts = () => {
    loadProducts(true);
  };


  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }
  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[styles.productListItem, item.stockQuantity === 0 && styles.outOfStockItem]}
      onPress={() => addToCart(item)}
    >
      <View style={styles.productListImageContainer}>
        {item.images.length > 0 ? (
          <Image
            source={{ uri: item.images[0] }}
            style={styles.productListImage}
            defaultSource={{ uri: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=100' }}
          />
        ) : (
          <View style={styles.placeholderListImage}>
            <Package size={20} color="#ccc" />
          </View>
        )}
      </View>
      
      <View style={styles.productListInfo}>
        <Text style={styles.productListName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.productListDetails}>
          <Text style={styles.productListPrice}>{item.price}f</Text>
          <Text style={styles.productListStock}>
            Stock: {item.stockQuantity}
          </Text>
          {item.category && (
            <Text style={styles.productListCategory}>{item.category}</Text>
          )}
        </View>
        <View style={styles.productListVariants}>
          <Text style={styles.productListVariantText} numberOfLines={1}>
            {item.colors.length > 0 && `${item.colors.length} couleurs`} • {item.sizes.length > 0 && `${item.sizes.length} tailles`}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={[styles.addToCartButton, item.stockQuantity === 0 && styles.outOfStockButton]}
        onPress={() => addToCart(item)}
      >
        <Plus size={16} color="white" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderCartItem = ({ item, index }: { item: CartItem; index: number }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemImageContainer}>
        {item.product.images.length > 0 ? (
          <Image
            source={{ uri: item.product.images[0] }}
            style={styles.cartItemImage}
            defaultSource={{ uri: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=100' }}
          />
        ) : (
          <View style={styles.cartItemPlaceholderImage}>
            <Package size={16} color="#ccc" />
          </View>
        )}
      </View>
      
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
        {item.product.stockQuantity === 0 && (
          <Text style={styles.cartItemOutOfStock}>
            ⚠️ Rupture de stock
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
            onPress={() => {
              setScanned(false);
              setScannerModalVisible(true);
            }}
          >
            <ScanLine size={16} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => setCheckoutModalVisible(true)}
          >
            <ShoppingCart size={20} color="white" />
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
        <View style={styles.searchBar}>
          <Search size={18} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher des produits..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearSearch}
            >
              <X size={14} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <TouchableOpacity
          style={[styles.filterButton, getActiveFiltersCount() > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Filter size={18} color={getActiveFiltersCount() > 0 ? 'white' : BURGUNDY} />
          {getActiveFiltersCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.productList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMoreProducts}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadMoreFooter}>
              <Loader2 size={20} color={BURGUNDY} />
              <Text style={styles.loadMoreText}>Chargement...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Package size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'Aucun produit trouvé' : 'Aucun produit disponible'}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Scanner Modal */}
      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <SafeAreaView style={styles.filterModal}>
          <View style={styles.filterHeader}>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <X size={20} color={BURGUNDY} />
            </TouchableOpacity>
            <Text style={styles.filterTitle}>Filtres</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Effacer</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
            {/* Arrivage Filter */}
            <View style={styles.filterSection}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.filterSectionTitle}>Nouveautés</Text>
                <Switch
                  trackColor={{ false: "#767577", true: BURGUNDY }}
                  thumbColor={filters.arrivage ? "white" : "#f4f3f4"}
                  ios_backgroundColor="#3e3e3e"
                  onValueChange={(value) => handleFilterChange('arrivage', value)}
                  value={filters.arrivage}
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
              </View>
            </View>

            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Trier par</Text>
              <View style={styles.sortOptions}>
                {[
                  { key: 'created_at', label: "Date d'ajout" },
                  { key: 'name', label: 'Nom' },
                  { key: 'price', label: 'Prix' },
                ].map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.sortOption,
                      filters.sort_by === option.key && styles.sortOptionActive
                    ]}
                    onPress={() => handleFilterChange('sort_by', option.key)}
                  >
                    <Text style={[
                      styles.sortOptionText,
                      filters.sort_by === option.key && styles.sortOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                    {filters.sort_by === option.key && (
                      <TouchableOpacity
                        onPress={() => handleFilterChange('sort_order', filters.sort_order === 'asc' ? 'desc' : 'asc')}
                      >
                        {filters.sort_order === 'asc' ? (
                          <SortAsc size={12} color="white" />
                        ) : (
                          <SortDesc size={12} color="white" />
                        )}
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Catégorie</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    !filters.category_id && styles.filterChipActive
                  ]}
                  onPress={() => handleFilterChange('category_id', '')}
                >
                  <Text style={[
                    styles.filterChipText,
                    !filters.category_id && styles.filterChipTextActive
                  ]}>
                    Toutes
                  </Text>
                </TouchableOpacity>
                {filterOptions.categories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.filterChip,
                      filters.category_id === category.id && styles.filterChipActive
                    ]}
                    onPress={() => handleFilterChange('category_id', category.id)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      filters.category_id === category.id && styles.filterChipTextActive
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Brand Filter */}
            {filterOptions.brands.length > 0 && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Marque</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterOptions}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      !filters.brand_id && styles.filterChipActive
                    ]}
                    onPress={() => handleFilterChange('brand_id', '')}
                  >
                    <Text style={[
                      styles.filterChipText,
                      !filters.brand_id && styles.filterChipTextActive
                    ]}>
                      Toutes
                    </Text>
                  </TouchableOpacity>
                  {filterOptions.brands.map(brand => (
                    <TouchableOpacity
                      key={brand.id}
                      style={[
                        styles.filterChip,
                        filters.brand_id === brand.id && styles.filterChipActive
                      ]}
                      onPress={() => handleFilterChange('brand_id', brand.id)}
                    >
                      <Text style={[
                        styles.filterChipText,
                        filters.brand_id === brand.id && styles.filterChipTextActive
                      ]}>
                        {brand.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Warehouse Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Entrepôt</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterOptions}>
                {filterOptions.warehouses.map(warehouse => (
                  <TouchableOpacity
                    key={warehouse.id}
                    style={[
                      styles.filterChip,
                      filters.warehouse_id === warehouse.id && styles.filterChipActive
                    ]}
                    onPress={() => handleFilterChange('warehouse_id', warehouse.id === 0 ? undefined : warehouse.id)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      filters.warehouse_id === warehouse.id && styles.filterChipTextActive
                    ]}>
                      {warehouse.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          <View style={styles.filterFooter}>
            <TouchableOpacity style={styles.applyFiltersButton} onPress={applyFilters}>
              <Text style={styles.applyFiltersButtonText}>Appliquer</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Scanner Modal */}
      <Modal
        visible={scannerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setScannerModalVisible(false)}
      >
        <View style={styles.scannerModalOverlay}>
          <View style={styles.scannerModalContent}>
            <View style={styles.scannerModalHeader}>
              <Text style={styles.scannerModalTitle}>Scanner</Text>
              <TouchableOpacity onPress={() => setScannerModalVisible(false)}>
                <X size={20} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.scannerContainer}>
              {Platform.OS !== 'web' && hasPermission && (
                <CameraView
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ["qr", "pdf417", "code128", "code39", "codabar"],
                  }}
                  style={styles.cameraView}
                />
              )}
              
              {Platform.OS === 'web' && (
                <View style={styles.webScannerPlaceholder}>
                  <ScanLine size={48} color="#ccc" />
                  <Text style={styles.webScannerText}>
                    Scanner non disponible sur le web
                  </Text>
                </View>
              )}
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
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 10,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  errorText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#dc2626',
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
  },
  retryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scanButton: {
    backgroundColor: '#22c55e',
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartButton: {
    backgroundColor: BURGUNDY,
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: 'white',
  },
  saleInfoContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  customerText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: BURGUNDY,
  },
  saleStats: {
    flexDirection: 'row',
    gap: 12,
  },
  saleStatText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#333',
  },
  searchContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 32,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#333',
  },
  clearSearch: {
    padding: 2,
  },
  productList: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  productListItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  outOfStockItem: {
    opacity: 0.9,
    backgroundColor: '#f9f7f7',
  },
  outOfStockButton: {
    backgroundColor: BURGUNDY,
    opacity: 0.7,
  },
  productListImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 10,
  },
  productListImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderListImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productListInfo: {
    flex: 1,
  },
  productListName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#333',
    marginBottom: 3,
  },
  productListDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  productListPrice: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: BURGUNDY,
  },
  productListStock: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#666',
  },
  productListCategory: {
    fontFamily: 'Inter-Regular',
    fontSize: 9,
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  productListVariants: {
    flexDirection: 'row',
  },
  productListVariantText: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#999',
  },
  addToCartButton: {
    backgroundColor: BURGUNDY,
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 48,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  scannerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: 280,
    height: 320,
  },
  scannerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scannerModalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#333',
  },
  scannerContainer: {
    width: 248,
    height: 248,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  cameraView: {
    width: '100%',
    height: '100%',
  },
  webScannerPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  webScannerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxWidth: 360,
    maxHeight: '80%',
  },
  checkoutModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '95%',
    maxWidth: 420,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#333',
  },
  customerList: {
    maxHeight: 320,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
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
    fontSize: 13,
    color: '#333',
  },
  customerDetails: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#666',
    marginTop: 1,
  },
  customerGroup: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#999',
    marginTop: 1,
  },
  checkmark: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: BURGUNDY,
  },
  variantSelection: {
    gap: 12,
  },
  productModalName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#333',
  },
  productModalPrice: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: BURGUNDY,
  },
  variantLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#333',
  },
  variantOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  colorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  colorName: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#333',
    textTransform: 'capitalize',
  },
  sizeOption: {
    backgroundColor: BURGUNDY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sizeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: 'white',
  },
  discountOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  discountOption: {
    backgroundColor: BURGUNDY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 50,
    alignItems: 'center',
  },
  discountOptionText: {
    fontFamily: 'Inter-Bold',
    fontSize: 13,
    color: 'white',
  },
  checkoutCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  checkoutCustomerText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#333',
  },
  cartList: {
    maxHeight: 240,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  cartItemImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 10,
  },
  cartItemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cartItemPlaceholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#333',
  },
  cartItemVariant: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#666',
    marginTop: 1,
  },
  cartItemPrice: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: BURGUNDY,
    marginTop: 1,
  },
  cartItemDiscount: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#22c55e',
    marginTop: 1,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 10,
  },
  cartItemOutOfStock: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: BURGUNDY,
    marginTop: 1,
  },
  quantityButton: {
    backgroundColor: BURGUNDY,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#333',
    minWidth: 20,
    textAlign: 'center',
  },
  discountButton: {
    padding: 2,
  },
  removeButton: {
    padding: 2,
  },
  checkoutSummary: {
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 12,
    marginTop: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
  },
  summaryValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 6,
    marginTop: 6,
    marginBottom: 12,
  },
  totalLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#333',
  },
  totalAmount: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: BURGUNDY,
  },
  paymentSection: {
    marginTop: 12,
  },
  paymentTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#333',
    marginBottom: 10,
  },
  paymentButtons: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  paymentButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 4,
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
    fontSize: 10,
    color: 'white',
  },
  
  // Filter Button
  filterButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: BURGUNDY,
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#dc2626',
    borderRadius: 6,
    minWidth: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 9,
    fontFamily: 'Inter-Bold',
  },
  
  // Load More Footer
  loadMoreFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  loadMoreText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
  },
  
  // Filter Modal
  filterModal: {
    flex: 1,
    backgroundColor: 'white',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  filterTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    color: '#333',
  },
  clearFiltersText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: BURGUNDY,
  },
  filterContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#333',
    marginBottom: 8,
  },
  
  // Sort Options
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    gap: 4,
  },
  sortOptionActive: {
    backgroundColor: BURGUNDY,
  },
  sortOptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#666',
  },
  sortOptionTextActive: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  
  // Filter Options
  filterOptions: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: BURGUNDY,
  },
  filterChipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#666',
  },
  filterChipTextActive: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  
  // Filter Footer
  filterFooter: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    backgroundColor: 'white',
  },
  applyFiltersButton: {
    backgroundColor: BURGUNDY,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyFiltersButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: 'white',
  },
});