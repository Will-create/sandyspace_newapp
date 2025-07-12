import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
  Switch,
} from 'react-native';
import { Product } from '@/types/Product';
import { ProductFilters } from '@/services/ApiService';
import { StorageService } from '@/services/StorageService';
import { apiService } from '@/services/ApiService';
import { MockDataService } from '@/services/MockDataService';
import ProductCard from '@/components/ProductCard';
import FloatingActionButton from '@/components/FloatingActionButton';
import FloatingWebButton from '@/components/FloatingWebButton';
import { router } from 'expo-router';
import {
  Package,
  Wifi,
  WifiOff,
  Search,
  Filter,
  X,
  ChevronDown,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Loader2,
  Trash2,
  ShoppingCart,
  X as CloseIcon
} from 'lucide-react-native';

const BURGUNDY = '#400605';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FilterOptions {
  categories: Array<{ id: string; name: string }>;
  brands: Array<{ id: string; name: string }>;
  warehouses: Array<{ id: number; name: string }>;
}

interface ProductListHeaderProps {
  error: string | null;
  onSearchChange: (text: string) => void;
  activeFiltersCount: number;
  onShowFilters: (show: boolean) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  appliedSearch: string;
  appliedCategoryId: string;
  appliedBrandId: string;
  appliedWarehouseId: number | undefined;
  appliedArrivage: boolean;
  handleProductPress: (product: Product) => void;
}

const ProductListHeader = React.memo(({
  error,
  onSearchChange,
  activeFiltersCount,
  onShowFilters,
  viewMode,
  onViewModeChange,
  appliedSearch,
}: ProductListHeaderProps) => {
  const searchInputRef = useRef<TextInput>(null);

  const handleInternalSearchChange = (text: string) => {
    onSearchChange(text);
  };
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <View style={styles.statusRow} />
        </View>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            key="product-search-input"
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Rechercher des produits..."
            value={appliedSearch}
            onChangeText={handleInternalSearchChange}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {appliedSearch ? (
            <TouchableOpacity
              onPress={() => handleInternalSearchChange('')}
              style={styles.clearSearch}
            >
              <X size={16} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, activeFiltersCount > 0 && styles.actionButtonActive]}
            onPress={() => onShowFilters(true)}
          >
            <Filter size={20} color={activeFiltersCount > 0 ? 'white' : BURGUNDY} />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? (
              <List size={20} color={BURGUNDY} />
            ) : (
              <Grid size={20} color={BURGUNDY} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});
const ProductList = ({
  filters,
  sourceProducts,
  loading,
  loadingMore,
  onRefresh,
  loadMoreProducts,
  renderProduct,
  renderLoadMoreFooter,
  renderEmptyState,
  viewMode,
  handleProductPress,
}: {
  filters: ProductFilters;
  sourceProducts: Product[];
  loading: boolean;
  loadingMore: boolean;
  onRefresh: () => void;
  loadMoreProducts: () => void;
  renderProduct: ({ item }: { item: Product }) => ReturnType<typeof React.createElement>;
  renderLoadMoreFooter: () => ReturnType<typeof React.createElement> | null;
  renderEmptyState: () => ReturnType<typeof React.createElement>;
  viewMode: 'grid' | 'list';
  handleProductPress: (product: Product) => void;
}) => {
  if (loading && sourceProducts.length === 0) return <Loader2 size={24} color={BURGUNDY} style={{ marginTop: 40, alignSelf: 'center' }} />;

  return (
    <FlatList
      data={sourceProducts}
      key={viewMode}
      numColumns={viewMode === 'grid' ? 2 : 1}
      keyExtractor={(item: Product, index: number) => {
        return item?.id ? item.id.toString() : `product-${index}`;
      }}
      renderItem={renderProduct}
      ListEmptyComponent={renderEmptyState()}
      ListFooterComponent={renderLoadMoreFooter}
      contentContainerStyle={{
        paddingBottom: 100,
        paddingHorizontal: 16,
      }}
      columnWrapperStyle={viewMode === 'grid' ? styles.row : undefined}
      onEndReachedThreshold={0.3}
      onEndReached={loadMoreProducts}
      refreshControl={

        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
    />
  );
};

export default function ProductsScreen() {
  // State management
  const [showFilters, setShowFilters] = useState(false);
  const [sourceProducts, setSourceProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');


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
  const clearFilters = () => {
    setFilters({
      arrivage: false,
      sort_by: 'created_at',
      sort_order: 'asc',
      category_id: '',
      brand_id: '',
      warehouse_id: undefined,
      per_page: 20,
      search: '',
    });
  };
  const loadProducts = async (reset = false, loadMore = false) => {
    if (loading) return;

    setErr(null);
    if (reset) {
      setLoading(true);
      setPage(1);
      try {
        const response = await apiService.getProductsWithFilters({
          ...filters,
          page: 1,
        });
        setSourceProducts(response.products);
        setFilterOptions(response.options);
      } catch (err) {
        console.error(err);
        setErr('Erreur lors du chargement des produits');
      } finally {
        setLoading(false);
      }
    } else if (loadMore) {
      setLoadingMore(true);
      try {
        const nextPage = page + 1;
        const moreProducts = await apiService.getProductsWithFilters({
          ...filters,
          page: nextPage,
        });
        setSourceProducts((prev) => [...prev, ...moreProducts.products]);
        setPage(nextPage);
      } catch (err) {
        console.error('Erreur lors du chargement supplémentaire :', err);
      } finally {
        setLoadingMore(false);
      }
    }
  };
  const toggleProductSelection = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
      if (selectedProducts.length === 1) setSelectionMode(false);
    } else {
      setSelectedProducts(prev => [...prev, productId]);
      setSelectionMode(true);
    }
  };
  const clearSelection = () => {
    setSelectedProducts([]);
    setSelectionMode(false);
  };
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const refreshed = await apiService.getProductsWithFilters({
        ...appliedFilters,
        page: 1,
      });

      setSourceProducts(refreshed.products);
      setPage(1);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement :', error);
    } finally {
      setRefreshing(false);
    }
  };
  const loadMoreProducts = async () => {
    if (loadingMore) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const moreProducts = await apiService.getProductsWithFilters({
        ...appliedFilters,
        page: nextPage,
      });

      let prev = sourceProducts;

      if (!prev)
        prev = [];

      console.log(typeof (moreProducts.products))
      let final = [...prev, ...moreProducts.products];
      setSourceProducts(final);
      setPage(nextPage);
    } catch (error) {
      console.error('Erreur lors du chargement supplémentaire :', error);
    } finally {

      setLoadingMore(false);
    }
  };


  const handleSearch = (query: string) => {
    setSearchQuery(query); // ← this keeps TextInput synced

    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) {
      setFilteredProducts(sourceProducts);
      return;
    }

    const filtered = sourceProducts.filter((product) => {
      return (
        product.name?.toLowerCase().includes(cleanQuery) ||
        product.description?.toLowerCase().includes(cleanQuery)
      );
    });

    setFilteredProducts(filtered);
  };


  useEffect(() => {
    setFilteredProducts(sourceProducts);
  }, [sourceProducts]);

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  const applyFilters = () => {
    setAppliedFilters(filters);
    setShowFilters(false);
    fetchProducts(filters); // If you're doing a fresh fetch
  };

  const fetchProducts = useCallback(async (filtersToUse: ProductFilters) => {
    setLoading(true);
    setErr(null);

    try {
      const response = await apiService.getProductsWithFilters(filtersToUse); // Adjust method if needed
      setSourceProducts(response.products);
      setFilterOptions(response.options);
    } catch (err) {
      console.error(err);
      setErr('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleProductPress = (product: Product) => {
    if (selectionMode) {
      product.id && toggleProductSelection(product.id.toString());
    } else {
      router.push(`/edit-product/${product.id}`);
    }
  };

  const handleAddToCart = () => {
    if (selectedProducts.length > 0) {
      Alert.alert(
        'Ajouter au panier',
        `Voulez-vous vraiment ajouter ${selectedProducts.length} produit(s) au panier ?`,
        [
          {
            text: 'Annuler',
            style: 'cancel',
          },
          {
            text: 'Ajouter',
            style: 'destructive',
            onPress: () => { },
          },
        ],
        { cancelable: true }
      );
    }
  }
  const handleAddProduct = () => {
    router.push('/create-products');
  };

  const gotoWeb = () => {
    router.push('/toweb');
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <SafeAreaView style={styles.filterModal}>
        <View style={styles.filterHeader}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <X size={22} color={BURGUNDY} />
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
                        <SortAsc size={14} color="white" />
                      ) : (
                        <SortDesc size={14} color="white" />
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

          {/* Items Per Page */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Articles par page</Text>
            <View style={styles.perPageOptions}>
              {[10, 20, 50, 100].map(count => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.perPageOption,
                    filters.per_page === count && styles.perPageOptionActive
                  ]}
                  onPress={() => handleFilterChange('per_page', count)}
                >
                  <Text style={[
                    styles.perPageOptionText,
                    filters.per_page === count && styles.perPageOptionTextActive
                  ]}>
                    {count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.filterFooter}>
          <TouchableOpacity style={styles.applyFiltersButton} onPress={applyFilters}>
            <Text style={styles.applyFiltersButtonText}>Appliquer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
  const handleProductPressCallback = useCallback(
    (item: Product) => () => handleProductPress(item),
    [handleProductPress]
  );

  const toggleProductSelectionCallback = useCallback(
    (id: string) => () => toggleProductSelection(id),
    [toggleProductSelection]
  );
  const renderProduct = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard
        product={item}
        onPress={handleProductPressCallback(item)}
        onLongPress={toggleProductSelectionCallback(item.id.toString())}
        viewMode={viewMode}
        isSelected={selectedProducts.includes(item.id.toString())}
        selectionMode={selectionMode}
      />
    ),
    [handleProductPressCallback, toggleProductSelectionCallback, selectedProducts, viewMode, selectionMode]
  );

  const renderLoadMoreFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.loadMoreFooter}>
        <Loader2 size={24} color={BURGUNDY} />
        <Text style={styles.loadMoreText}>Loading more products...</Text>
      </View>
    );
  };
  const getActiveFiltersCount = () => {
    let count = 0;
    if (appliedFilters.search) count++;
    if (appliedFilters.category_id) count++;
    if (appliedFilters.brand_id) count++;
    if (appliedFilters.warehouse_id) count++;
    return count;
  };


  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Package size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>
        {appliedFilters.search || getActiveFiltersCount() > 0
          ? 'Aucun produit trouvé'
          : 'Aucun produit pour le moment'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {appliedFilters.search || getActiveFiltersCount() > 0
          ? 'Essayez de modifier votre recherche ou vos filtres'
          : ''}
      </Text>
    </View>
  );

  const handleShowFilters = useCallback((show: boolean) => {
    setShowFilters(show);
  }, []);

  const handleViewModeChange = useCallback((mode: 'grid' | 'list') => {
    setViewMode(mode);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ProductListHeader
        error={err}
        onSearchChange={handleSearch}
        appliedSearch={searchQuery}
        appliedCategoryId={appliedFilters.category_id ?? ''}
        appliedBrandId={appliedFilters.brand_id ?? ''}
        appliedWarehouseId={appliedFilters.warehouse_id}
        appliedArrivage={appliedFilters.arrivage ?? true}
        onShowFilters={handleShowFilters}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        activeFiltersCount={getActiveFiltersCount()}
        handleProductPress={handleProductPress}
      />
      {selectionMode && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          paddingVertical: 8,
          backgroundColor: '#fff0f0',
          borderBottomWidth: 1,
          borderBottomColor: '#ccc',
        }}>
          <Text style={{ fontSize: 12 }}>{selectedProducts.length} sélectionné(s)</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <TouchableOpacity onPress={handleAddToCart}>
              <ShoppingCart size={20} color="#333" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Confirmer la suppression',
                  `Supprimer ${selectedProducts.length} produit(s) ?`,
                  [
                    { text: 'Annuler', style: 'cancel' },
                    {
                      text: 'Supprimer',
                      style: 'destructive',
                      onPress: async () => {
                        await apiService.deleteProducts(selectedProducts);
                        clearSelection();
                        fetchProducts(appliedFilters);
                      },
                    },
                  ],
                  { cancelable: true }
                );
              }}
            >
              <Trash2 size={20} color="red" />
            </TouchableOpacity>

            <TouchableOpacity onPress={clearSelection}>
              <CloseIcon size={20} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

      )}

      <ProductList
        filters={filters}
        loadMoreProducts={loadMoreProducts}
        onRefresh={onRefresh}
        loadingMore={loadingMore}
        loading={loading}
        renderEmptyState={renderEmptyState}
        renderLoadMoreFooter={renderLoadMoreFooter}
        renderProduct={renderProduct}
        viewMode={viewMode}
        handleProductPress={handleProductPress}
        sourceProducts={filteredProducts}
      />

      <View style={styles.floating}>
        {/* <FloatingActionButton onPress={handleAddProduct} /> */}
        <FloatingWebButton onPress={gotoWeb} />
      </View>
      {renderFilterModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  floating: {
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    paddingHorizontal: 10,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    marginBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: '#333',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
  },
  dataSourceIndicator: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dataSourceText: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#666',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#dc2626',
  },

  // Search and Actions
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 34,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#333',
  },
  clearSearch: {
    padding: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  actionButtonActive: {
    backgroundColor: BURGUNDY,
  },
  filterBadge: {
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
  filterBadgeText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Inter-Bold',
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  filterTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 17,
    color: '#333',
  },
  clearFiltersText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: BURGUNDY,
  },
  filterContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#333',
    marginBottom: 10,
  },

  // Sort Options
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  sortOptionActive: {
    backgroundColor: BURGUNDY,
  },
  sortOptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
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
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: BURGUNDY,
  },
  filterChipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#666',
  },
  filterChipTextActive: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },

  // Items Per Page Options
  perPageOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  perPageOption: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    minWidth: 40,
    alignItems: 'center',
  },
  perPageOptionActive: {
    backgroundColor: BURGUNDY,
  },
  perPageOptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#666',
  },
  perPageOptionTextActive: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },

  // Filter Footer
  filterFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    backgroundColor: 'white',
  },
  applyFiltersButton: {
    backgroundColor: BURGUNDY,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyFiltersButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: 'white',
  },

  // Product Grid/List
  productGrid: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  productList: {
    paddingHorizontal: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  // Load More Footer
  loadMoreFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadMoreText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: BURGUNDY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'white',
  },
});
