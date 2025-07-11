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
  Switch,
} from 'react-native';
import { StorageService } from '@/services/StorageService';

interface ProductListHeaderProps {
  error: string | null;
  onSearchChange: (text: string) => void;
  activeFiltersCount: number;
  onShowFilters: (show: boolean) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  appliedSearch: string;
}

const ProductListHeader = React.memo(({
  error,
  onSearchChange,
  activeFiltersCount,
  onShowFilters,
  viewMode,
  onViewModeChange,
}: ProductListHeaderProps) => {
    const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const searchInputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sourceProducts, setSourceProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
  useEffect(() => {
  const fetchFilters = async () => {
    const response = await apiService.getProductsWithFilters(); // replace with your actual API
    setFilterOptions(response.options);
  };
  fetchFilters();
}, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      onSearchChange(internalSearchQuery);
    }, 300); // Debounce time

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [internalSearchQuery, onSearchChange]);

  const handleInternalSearchChange = (text: string) => {
    setInternalSearchQuery(text);
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
            value={internalSearchQuery}
            onChangeText={handleInternalSearchChange}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {internalSearchQuery ? (
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