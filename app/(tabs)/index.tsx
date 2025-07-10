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
  ScrollView,
  Animated,
  Dimensions,
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
  Loader2
} from 'lucide-react-native';

const BURGUNDY = '#400605';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FilterOptions {
  categories: Array<{ id: string; name: string }>;
  brands: Array<{ id: string; name: string }>;
  warehouses: Array<{ id: number; name: string }>;
}

export default function ProductsScreen() {
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Pagination
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
    from: 0,
    to: 0,
  });
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category_id: '',
    brand_id: '',
    warehouse_id: undefined,
    sort_by: 'created_at',
    sort_order: 'asc',
    per_page: 50,
    page: 1,
  });
  const [appliedFilters, setAppliedFilters] = useState<ProductFilters>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    brands: [],
    warehouses: [],
  });

  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchAnimation = useRef(new Animated.Value(0)).current;
  const filterAnimation = useRef(new Animated.Value(0)).current;
  
  const isMounted = useRef(true);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    isMounted.current = true;
    loadSettings();
    loadFilterOptions();
    
    return () => {
      isMounted.current = false;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (useMockData !== null) {
      loadProducts(true);
    }
  }, [useMockData]);

  // Animate search bar focus
  useEffect(() => {
    Animated.timing(searchAnimation, {
      toValue: searchFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [searchFocused]);

  // Animate filter panel
  useEffect(() => {
    Animated.timing(filterAnimation, {
      toValue: showFilters ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showFilters]);

  const loadSettings = async () => {
    try {
      const settings = await StorageService.getSettings();
      const mockDataSetting = settings.useMockData !== undefined ? settings.useMockData : true;
      if (isMounted.current) {
        setUseMockData(mockDataSetting);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      if (isMounted.current) {
        setUseMockData(true);
      }
    }
  };

  const loadFilterOptions = async () => {
    try {
      const options = await apiService.getFilterOptions();
      if (isMounted.current) {
        setFilterOptions(options);
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

   const loadProducts = async (reset = false, loadMore = false) => {
  try {
    if (isMounted.current && !loadMore) {
      setError(null);
      if (reset) setLoading(true);
    }

    const currentFilters = reset ? filters : appliedFilters;
    const pageToLoad = loadMore ? pagination.current_page + 1 : 1;

    if (useMockData) {
      // Mock data with simulated filtering
      const mockProducts = MockDataService.getMockProducts();
      let filteredProducts = [...mockProducts];

      // Apply search filter
      if (currentFilters.search) {
        filteredProducts = filteredProducts.filter(product =>
          product.name.toLowerCase().includes(currentFilters.search!.toLowerCase()) ||
          product.description?.toLowerCase().includes(currentFilters.search!.toLowerCase())
        );
      }

      // Apply arrivage filter
      if (currentFilters.arrivage) {
   
      }


      // Apply category filter
      if (currentFilters.category_id) {
        filteredProducts = filteredProducts.filter(product =>
          product.category === currentFilters.category_id
        );
      }

      // Apply sorting
      if (currentFilters.sort_by) {
        filteredProducts.sort((a, b) => {
          let aValue: any, bValue: any;
          
          switch (currentFilters.sort_by) {
            case 'name':
              aValue = a.name.toLowerCase();
              bValue = b.name.toLowerCase();
              break;
            case 'price':
              aValue = parseFloat(a.price);
              bValue = parseFloat(b.price);
              break;
            case 'created_at':
              aValue = new Date(a.createdAt);
              bValue = new Date(b.createdAt);
              break;
            default:
              return 0;
          }

          if (currentFilters.sort_order === 'desc') {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
          } else {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          }
        });
      }

      // Simulate pagination
      const startIndex = (pageToLoad - 1) * (currentFilters.per_page || 20);
      const endIndex = startIndex + (currentFilters.per_page || 20);
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

      if (isMounted.current) {
        if (loadMore) {
          // **FIX: Prevent duplicates when loading more**
          setProducts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNewProducts = paginatedProducts.filter(p => !existingIds.has(p.id));
            return [...prev, ...uniqueNewProducts];
          });
        } else {
          setProducts(paginatedProducts);
        }
        
        setPagination({
          current_page: pageToLoad,
          last_page: Math.ceil(filteredProducts.length / (currentFilters.per_page || 20)),
          per_page: currentFilters.per_page || 20,
          total: filteredProducts.length,
          from: startIndex + 1,
          to: Math.min(endIndex, filteredProducts.length),
        });
        
        setIsOnline(true);
      }
    } else {
      // Real API call
      const result = await apiService.getProductsWithFilters({
        ...currentFilters,
        page: pageToLoad,
      });

      console.log('API Result:', result);

      if (isMounted.current) {
        if (loadMore) {
          // **FIX: Prevent duplicates for API calls too**
          setProducts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNewProducts = result.products.filter(p => !existingIds.has(p.id));
            return [...prev, ...uniqueNewProducts];
          });
        } else {
          setProducts(result.products);
        }
        
        setPagination(result.pagination);
        setAppliedFilters(result.appliedFilters);
        setIsOnline(true);
      }
    }

    if (!reset && !loadMore) {
      setAppliedFilters(currentFilters);
    }

  } catch (error) {
    console.error('Error loading products:', error);
    
    if (isMounted.current) {
      setIsOnline(false);
      if (!useMockData && !loadMore) {
        setError('Unable to load products. Please check your connection.');
      }
    }
  } finally {
    if (isMounted.current) {
      setLoading(false);
      setLoadingMore(false);
    }
  }
};
  const handleSearch = useCallback((text: string) => {
    setFilters(prev => ({ ...prev, search: text, page: 1 }));
    
    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (text !== appliedFilters.search) {
        loadProducts();
      }
    }, 500);
  }, [appliedFilters.search]);

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const applyFilters = () => {
    setShowFilters(false);
    loadProducts();
  };

  const clearFilters = () => {
    const defaultFilters: ProductFilters = {
      search: '',
      category_id: '',
      brand_id: '',
      warehouse_id: undefined,
      sort_by: 'created_at',
      sort_order: 'desc',
      per_page: 20,
      page: 1,
    };
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    loadProducts(true);
  };

  const onRefresh = async () => {
    if (isMounted.current) {
      setRefreshing(true);
    }
    await loadProducts(true);
    if (isMounted.current) {
      setRefreshing(false);
    }
  };

  const loadMoreProducts = () => {
    if (!loadingMore && pagination.current_page < pagination.last_page) {
      setLoadingMore(true);
      loadProducts(false, true);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (appliedFilters.search) count++;
    if (appliedFilters.category_id) count++;
    if (appliedFilters.brand_id) count++;
    if (appliedFilters.warehouse_id) count++;
    return count;
  };

  const handleProductPress = (product: Product) => {
    router.push(`/edit-product/${product.id}`);
  };

  const handleAddProduct = () => {
    router.push('/create-products');
  };

  const gotoWeb = () => {
    router.push('/toweb');
  };

  const renderSearchBar = () => {
    const searchBarWidth = searchAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [SCREEN_WIDTH - 120, SCREEN_WIDTH - 32],
    });

    return (
      <View style={styles.searchContainer}>
        <Animated.View style={[styles.searchBar, { width: searchBarWidth }]}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher des produits..."
            value={filters.search}
            onChangeText={handleSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
          />
          {filters.search ? (
            <TouchableOpacity
              onPress={() => handleSearch('')}
              style={styles.clearSearch}
            >
              <X size={16} color="#666" />
            </TouchableOpacity>
          ) : null}
        </Animated.View>

        {!searchFocused && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, getActiveFiltersCount() > 0 && styles.actionButtonActive]}
              onPress={() => setShowFilters(true)}
            >
              <Filter size={20} color={getActiveFiltersCount() > 0 ? 'white' : BURGUNDY} />
              {getActiveFiltersCount() > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? (
                <List size={20} color={BURGUNDY} />
              ) : (
                <Grid size={20} color={BURGUNDY} />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
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
            <X size={24} color={BURGUNDY} />
          </TouchableOpacity>
          <Text style={styles.filterTitle}>Filters</Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
          {/* Sort Options */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Sort By</Text>
            <View style={styles.sortOptions}>
              {[
                { key: 'created_at', label: 'Date Added' },
                { key: 'name', label: 'Name' },
                { key: 'price', label: 'Price' },
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
                        <SortAsc size={16} color="white" />
                      ) : (
                        <SortDesc size={16} color="white" />
                      )}
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
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
                  All Categories
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
              <Text style={styles.filterSectionTitle}>Brand</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
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
                    All Brands
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
            <Text style={styles.filterSectionTitle}>Warehouse</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
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
            <Text style={styles.filterSectionTitle}>Items Per Page</Text>
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
            <Text style={styles.applyFiltersButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <View style={styles.statusRow}>
            
          </View>
        </View>
      </View>
      
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {renderSearchBar()}
    </View>
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      onPress={() => handleProductPress(item)}
      viewMode={viewMode}
    />
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

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Package size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>
        {appliedFilters.search || getActiveFiltersCount() > 0 
          ? 'No products found' 
          : 'No products yet'
        }
      </Text>
      <Text style={styles.emptySubtitle}>
        {appliedFilters.search || getActiveFiltersCount() > 0
          ? 'Try adjusting your search or filters'
          : 'Tap the camera button to add your first products using our AI-powered creation tool'
        }
      </Text>
      {(!appliedFilters.search && getActiveFiltersCount() === 0) && (
        <TouchableOpacity style={styles.emptyButton} onPress={handleAddProduct}>
          <Text style={styles.emptyButtonText}>Add Products</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // Force re-render when view mode changes
        contentContainerStyle={[
          styles.productGrid,
          viewMode === 'list' && styles.productList
        ]}
        columnWrapperStyle={viewMode === 'grid' ? styles.row : undefined}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BURGUNDY}
          />
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        ListFooterComponent={renderLoadMoreFooter}
        onEndReached={loadMoreProducts}
        onEndReachedThreshold={0.1}
      />

      <View style={styles.floating}>
        <FloatingActionButton onPress={handleAddProduct} />
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  filterTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#333',
  },
  clearFiltersText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: BURGUNDY,
  },
  filterContent: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  
  // Sort Options
  sortOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    gap: 8,
  },
  sortOptionActive: {
    backgroundColor: BURGUNDY,
  },
  sortOptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  sortOptionTextActive: {
    color: 'white',
  },

  // Filter Options
  filterOptions: {
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: BURGUNDY,
  },
  filterChipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: 'white',
  },

  // Items Per Page Options
  perPageOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  perPageOption: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    minWidth: 50,
    alignItems: 'center',
  },
  perPageOptionActive: {
    backgroundColor: BURGUNDY,
  },
  perPageOptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  perPageOptionTextActive: {
    color: 'white',
  },

  // Filter Footer
  filterFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  applyFiltersButton: {
    backgroundColor: BURGUNDY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyFiltersButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
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