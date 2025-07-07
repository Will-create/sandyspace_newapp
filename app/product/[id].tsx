import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, LocationEdit as Edit3, Package, ShoppingCart, Image as ImageIcon } from 'lucide-react-native';
import { Product } from '@/types/Product';
import { StorageService } from '@/services/StorageService';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BURGUNDY = '#400605';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const products = await StorageService.getProducts();
      const foundProduct = products.find(p => p.id === id);
      if (foundProduct) {
        setProduct(foundProduct);
      } else {
        Alert.alert('Erreur', 'Produit non trouvé');
        router.back();
      }
    } catch (error) {
      console.error('Erreur lors du chargement du produit:', error);
      Alert.alert('Erreur', 'Échec du chargement du produit');
      router.back();
    }
  };

  const handleEdit = () => {
    if (product) {
      router.push(`/edit-product/${product.id}`);
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { status: 'out', color: '#dc2626', text: 'Rupture de stock' };
    if (quantity <= 5) return { status: 'low', color: '#f59e0b', text: 'Stock faible' };
    if (quantity <= 20) return { status: 'medium', color: '#eab308', text: 'Stock moyen' };
    return { status: 'good', color: '#22c55e', text: 'En stock' };
  };

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const stockStatus = getStockStatus(product.stockQuantity);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du produit</Text>
        <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
          <Edit3 size={20} color={BURGUNDY} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Galerie d'images */}
        <View style={styles.imageSection}>
          <View style={styles.mainImageContainer}>
            {product.images.length > 0 ? (
              <View style={styles.mainImage}>
                <ImageIcon size={120} color="#ccc" />
              </View>
            ) : (
              <View style={styles.placeholderImage}>
                <Package size={120} color="#ccc" />
                <Text style={styles.placeholderText}>Aucune image</Text>
              </View>
            )}
          </View>

          {product.images.length > 1 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.thumbnailContainer}
            >
              {product.images.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.thumbnail,
                    selectedImageIndex === index && styles.selectedThumbnail
                  ]}
                  onPress={() => setSelectedImageIndex(index)}
                >
                  
                  <ImageIcon size={40} color="#ccc" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Informations du produit */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={styles.productName}>{product.name}</Text>
            <View style={[styles.stockBadge, { backgroundColor: stockStatus.color + '20' }]}>
              <Text style={[styles.stockText, { color: stockStatus.color }]}>
                {stockStatus.text}
              </Text>
            </View>
          </View>

          <Text style={styles.productPrice}>{product.price}f</Text>

          {product.category && (
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryLabel}>Catégorie</Text>
              <Text style={styles.categoryValue}>{product.category}</Text>
            </View>
          )}

          {product.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {/* Couleurs */}
          <View style={styles.attributeSection}>
            <Text style={styles.sectionTitle}>Couleurs disponibles</Text>
            <View style={styles.colorGrid}>
              {product.colors.map((color, index) => (
                <View key={index} style={styles.colorItem}>
                  <View style={[styles.colorDot, { backgroundColor: color.toLowerCase() }]} />
                  <Text style={styles.colorName}>{color}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Tailles */}
          <View style={styles.attributeSection}>
            <Text style={styles.sectionTitle}>Tailles disponibles</Text>
            <View style={styles.sizeGrid}>
              {product.sizes.map((size, index) => (
                <View key={index} style={styles.sizeItem}>
                  <Text style={styles.sizeText}>{size}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Informations de stock */}
          <View style={styles.stockSection}>
            <Text style={styles.sectionTitle}>Informations de stock</Text>
            <View style={styles.stockInfo}>
              <View style={styles.stockItem}>
                <Package size={20} color="#666" />
                <Text style={styles.stockLabel}>Stock actuel</Text>
                <Text style={styles.stockValue}>{product.stockQuantity} unités</Text>
              </View>
              
              <View style={styles.stockItem}>
                <ShoppingCart size={20} color="#666" />
                <Text style={styles.stockLabel}>Valeur totale</Text>
                <Text style={styles.stockValue}>
                  {(parseFloat(product.price) * product.stockQuantity).toFixed(0)}f
                </Text>
              </View>
            </View>
          </View>

          {/* Horodatage */}
          <View style={styles.timestampSection}>
            <View style={styles.timestampItem}>
              <Text style={styles.timestampLabel}>Créé</Text>
              <Text style={styles.timestampValue}>
                {new Date(product.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.timestampItem}>
              <Text style={styles.timestampLabel}>Dernière mise à jour</Text>
              <Text style={styles.timestampValue}>
                {new Date(product.updatedAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bouton d'action */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.editActionButton} onPress={handleEdit}>
          <Edit3 size={20} color="white" />
          <Text style={styles.editActionText}>Modifier le produit</Text>
        </TouchableOpacity>
      </View>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#333',
  },
  editButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  imageSection: {
    backgroundColor: 'white',
    paddingVertical: 20,
  },
  mainImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mainImage: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderImage: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  thumbnailContainer: {
    paddingHorizontal: 16,
  },
  thumbnail: {
    width: 60,
    height: 60,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedThumbnail: {
    borderColor: BURGUNDY,
  },
  infoSection: {
    backgroundColor: 'white',
    marginTop: 8,
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    flex: 1,
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#333',
    marginRight: 12,
  },
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  stockText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
  },
  productPrice: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: BURGUNDY,
    marginBottom: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  categoryValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  attributeSection: {
    marginBottom: 24,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorItem: {
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
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizeItem: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  sizeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#333',
  },
  stockSection: {
    marginBottom: 24,
  },
  stockInfo: {
    gap: 12,
  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  stockLabel: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  stockValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#333',
  },
  timestampSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  timestampItem: {
    alignItems: 'center',
  },
  timestampLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  timestampValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#333',
  },
  actionContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  editActionButton: {
    flexDirection: 'row',
    backgroundColor: BURGUNDY,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  editActionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'white',
  },
});