import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Package, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { Product } from '@/types/Product';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_MARGIN = 16;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_MARGIN * 3) / 2;
const BURGUNDY = '#400605';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

export default function ProductCard({ product, onPress }: ProductCardProps) {
  const lowStock = product.stockQuantity <= 5;
  const outOfStock = product.stockQuantity === 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        {product.images.length > 0 ? (
          <Image 
            source={{ uri: product.images[0] }} 
            style={styles.image}
            defaultSource={{ uri: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=400' }}
          />
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
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        
        <Text style={styles.price}>
          {product.price}f
        </Text>
        
        {product.category && (
          <Text style={styles.category} numberOfLines={1}>
            {product.category}
          </Text>
        )}
        
        <View style={styles.details}>
          <View style={styles.colorRow}>
            {product.colors.slice(0, 3).map((color, index) => (
              <View
                key={index}
                style={[styles.colorDot, { backgroundColor: color.toLowerCase() }]}
              />
            ))}
            {product.colors.length > 3 && (
              <Text style={styles.moreColors}>+{product.colors.length - 3}</Text>
            )}
          </View>
          
          <View style={styles.sizeRow}>
            {product.sizes.slice(0, 2).map((size, index) => (
              <Text key={index} style={styles.sizeText}>
                {size}
              </Text>
            ))}
            {product.sizes.length > 2 && (
              <Text style={styles.moreText}>+{product.sizes.length - 2}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.stockRow}>
          <View style={[
            styles.stockBadge, 
            lowStock && styles.lowStockBadge,
            outOfStock && styles.outOfStockBadge
          ]}>
            {lowStock && !outOfStock && <AlertTriangle size={12} color="#f59e0b" />}
            <Text style={[
              styles.stockText, 
              lowStock && styles.lowStockText,
              outOfStock && styles.outOfStockText
            ]}>
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
    width: CARD_WIDTH,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 140,
    overflow: 'hidden',
  },
  image: {
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
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: 'white',
  },
  content: {
    padding: 12,
  },
  name: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    minHeight: 36,
  },
  price: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: BURGUNDY,
    marginBottom: 4,
  },
  category: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  details: {
    marginBottom: 8,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  moreColors: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#666',
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sizeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#666',
    marginRight: 4,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  moreText: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#666',
  },
  stockRow: {
    alignItems: 'flex-start',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
    fontSize: 10,
    color: '#0369a1',
  },
  lowStockText: {
    color: '#f59e0b',
  },
  outOfStockText: {
    color: '#dc2626',
  },
});