import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Package, TriangleAlert as AlertTriangle, Check } from 'lucide-react-native';
import { Product } from '@/types/Product';
const DEFAULT_COLORS = [
  { id: '1', name: 'Rouge', value: 'rouge', code: 'red', categories: ['robes', 'sacs-a-main', 'les-hauts', 'pantalons', 'ensemble-tailleur', 'chaussures'] },
  { id: '2', name: 'Bleu', value: 'bleu', code: 'blue', categories: ['robes', 'sacs-a-main', 'les-hauts', 'pantalons', 'ensemble-tailleur', 'chaussures'] },
  { id: '3', name: 'Vert', value: 'vert', code: 'green', categories: ['robes', 'sacs-a-main', 'les-hauts', 'pantalons', 'ensemble-tailleur', 'chaussures'] },
  { id: '4', name: 'Jaune', value: 'jaune', code: 'yellow', categories: ['robes', 'les-hauts', 'pantalons', 'chaussures'] },
  { id: '5', name: 'Blanc', value: 'blanc', code: 'white', categories: ['robes', 'sacs-a-main', 'les-hauts', 'pantalons', 'chaussures', 'ensemble-tailleur'] },
  { id: '6', name: 'Noir', value: 'noir', code: 'black', categories: ['robes', 'sacs-a-main', 'les-hauts', 'pantalons', 'chaussures', 'ensemble-tailleur'] },
  { id: '7', name: 'Marron', value: 'marron', code: '#5D4037', categories: ['chaussures', 'ensemble-tailleur', 'sacs-a-main', 'pantalons'] },
  { id: '8', name: 'Gris', value: 'gris', code: 'gray', categories: ['chaussures', 'ensemble-tailleur', 'pantalons', 'les-hauts'] },
  { id: '9', name: 'Beige', value: 'beige', code: '#F5F5DC', categories: ['robes', 'sacs-a-main', 'chaussures', 'ensemble-tailleur'] },
  { id: '10', name: 'Argent', value: 'argent', code: '#C0C0C0', categories: ['chaussures', 'ensemble-tailleur', 'sacs-a-main'] },
  { id: '11', name: 'Or', value: 'or', code: '#FFD700', categories: ['chaussures', 'ensemble-tailleur', 'sacs-a-main', 'perles'] },
  { id: '12', name: 'Transparent', value: 'transparent', code: 'transparent', categories: ['robes', 'les-hauts'] },
  { id: '13', name: 'Rose', value: 'rose', code: 'pink', categories: ['robes', 'sacs-a-main'] },
  { id: '14', name: 'Violet', value: 'violet', code: 'purple', categories: ['robes', 'les-hauts', 'chaussures', 'ensemble-tailleur'] },
  { id: '15', name: 'Bordeaux', value: 'bordeaux', code: '#800020', categories: ['robes', 'chaussures', 'ensemble-tailleur'] },
  { id: '16', name: 'Turquoise', value: 'turquoise', code: '#40E0D0', categories: ['robes', 'sacs-a-main'] },
  { id: '17', name: 'Camel', value: 'camel', code: '#C19A6B', categories: ['chaussures', 'ensemble-tailleur', 'sacs-a-main'] },
  { id: '18', name: 'Kaki', value: 'kaki', code: '#78866B', categories: ['pantalons', 'chaussures', 'ensemble-tailleur'] },
  { id: '19', name: 'Multicolore', value: 'multicolore', code: '#FF00FF', categories: ['robes', 'perles'] },
];

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_MARGIN = 12;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_MARGIN * 3) / 2;
const BURGUNDY = '#400605';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onLongPress?: () => void;
  viewMode: 'grid' | 'list';
  isSelected?: boolean;
  selectionMode?: boolean;
}

 function ProductCard({
  product,
  onPress,
  onLongPress,
  viewMode,
  isSelected = false,
  selectionMode = false,
}: ProductCardProps) {
  const isList = viewMode === 'list';
  const lowStock = product.stockQuantity <= 5;
  const outOfStock = product.stockQuantity === -5;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          width: isList ? SCREEN_WIDTH - CARD_MARGIN * 2 : CARD_WIDTH,
          flexDirection: isList ? 'row' : 'column',
        },
        isSelected && styles.selectedCard,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={250}
    >
      <View style={[styles.imageContainer, isList && styles.imageContainerList]}>
        {product.images.length > 0 ? (
          <Image source={{ uri: product.images[0] }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Package size={32} color="#ccc" />
          </View>
        )}

        {outOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Rupture de stock</Text>
          </View>
        )}

        {selectionMode && (
          <View style={styles.checkboxContainer}>
            <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
              {isSelected && <Check size={12} color="#fff" />}
            </View>
          </View>
        )}
      </View>

      <View style={[styles.content, isList && styles.contentList]}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.price}>{product.price}f</Text>
        {product.category && (
          <Text style={styles.category} numberOfLines={1}>
            {product.category}
          </Text>
        )}

        <View style={styles.details}>
          <View style={styles.colorRow}>
            {product.colors.slice(0, 10).map((color, index) => {
              const match = DEFAULT_COLORS.find(c => c.value.toLowerCase() === color.toLowerCase());
              return (
                <View
                  key={index}
                  style={[styles.colorDot, { backgroundColor: match?.code || '#333' }]}
                />
              );
            })}
            {product.colors.length > 3 && (
              <Text style={styles.moreColors}>+{product.colors.length - 3}</Text>
            )}
          </View>
          <View style={styles.sizeRow}>
            {product.sizes.slice(0, 10).map((size, index) => (
              <Text key={index} style={styles.sizeText}>
                {size}
              </Text>
            ))}
            {product.sizes.length > 10 && (
              <Text style={styles.moreText}>{product.sizes.length - 2}</Text>
            )}
          </View>
        </View>

        <View style={styles.stockRow}>
          <View
            style={[
              styles.stockBadge,
              lowStock && styles.lowStockBadge,
              outOfStock && styles.outOfStockBadge,
            ]}
          >
            {lowStock && !outOfStock && <AlertTriangle size={12} color="#f59e0b" />}
            <Text
              style={[
                styles.stockText,
                lowStock && styles.lowStockText,
                outOfStock && styles.outOfStockText,
              ]}
            >
              {outOfStock ? 'Rupture de stock' : `${product.stockQuantity} en stock`}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 6,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: BURGUNDY,
  },
  imageContainer: {
    height: 140,
    overflow: 'hidden',
  },
  imageContainerList: {
    width: 120,
    height: 120,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    color: '#dc2626'
  },
  content: {
    padding: 8,
  },
  contentList: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  name: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#222',
    marginBottom: 2,
    minHeight: 14,
  },
  price: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    color: BURGUNDY,
    marginBottom: 2,
  },
  category: {
    fontFamily: 'Inter-Regular',
    fontSize: 9,
    color: '#555',
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  details: {
    marginBottom: 6,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 3,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  moreColors: {
    fontFamily: 'Inter-Regular',
    fontSize: 9,
    color: '#555',
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  sizeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 9,
    color: '#555',
    marginRight: 3,
    backgroundColor: '#eaeaea',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  moreText: {
    fontFamily: 'Inter-Regular',
    fontSize: 9,
    color: '#555',
  },
  stockRow: {
    alignItems: 'flex-start',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  lowStockBadge: {
    backgroundColor: '#fef3c7',
  },
  outOfStockBadge: {
    backgroundColor: '#fef2f2',
  },
  stockText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 9,
    color: '#0369a1',
  },
  lowStockText: {
    color: '#f59e0b',
  },
  checkboxContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#aaa',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: BURGUNDY,
    borderColor: BURGUNDY,
    borderWidth: 1,
  }
});

export default React.memo(ProductCard);