import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
  Image,
  Platform,
} from 'react-native';
import RichTextEditor from '@/components/RichTextEditor'; // Adjust path as needed

import { router, useLocalSearchParams } from 'expo-router';
import { Camera, Image as ImageIcon, X, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Product, ProductVariant } from '@/types/Product';
import { StorageService } from '@/services/StorageService';
// import api service
import { apiService } from '@/services/ApiService';

const BURGUNDY = '#400605';


const DEFAULT_CATEGORIES = [
  { id: 41, name: 'Robes', value: 'robes' },
  { id: 42, name: 'Pantalons', value: 'pantalons' },
  { id: 43, name: 'Complement alimentaire', value: 'complement-alimentaire' },
  { id: 44, name: 'Chaussures', value: 'chaussures' },
  { id: 45, name: 'Les hauts', value: 'les-hauts' },
  { id: 46, name: 'Perles', value: 'perles' },
  { id: 47, name: 'Sacs à main', value: 'sacs-a-main' },
  { id: 48, name: 'Loveweight', value: 'loveweight' },
  { id: 49, name: 'Ensemble tailleur', value: 'ensemble-tailleur' },
];

const DEFAULT_SIZES = [
  // Vêtements standards
  { id: '1', name: 'XS', value: 'XS', categories: ['robes', 'les-hauts', 'pantalons', 'ensemble-tailleur'] },
  { id: '2', name: 'S', value: 'S', categories: ['robes', 'les-hauts', 'pantalons', 'ensemble-tailleur'] },
  { id: '3', name: 'M', value: 'M', categories: ['robes', 'les-hauts', 'pantalons', 'ensemble-tailleur'] },
  { id: '4', name: 'L', value: 'L', categories: ['robes', 'les-hauts', 'pantalons', 'ensemble-tailleur'] },
  { id: '5', name: 'XL', value: 'XL', categories: ['robes', 'les-hauts', 'pantalons', 'ensemble-tailleur'] },
  { id: '6', name: 'XXL', value: 'XXL', categories: ['robes', 'les-hauts', 'pantalons', 'ensemble-tailleur'] },
  { id: '7', name: '3XL', value: '3XL', categories: ['robes', 'les-hauts', 'pantalons', 'ensemble-tailleur'] },

  // Tailles en chiffres pour pantalons
  { id: '8', name: '28', value: '28', categories: ['pantalons'] },
  { id: '9', name: '30', value: '30', categories: ['pantalons'] },
  { id: '10', name: '32', value: '32', categories: ['pantalons'] },
  { id: '11', name: '34', value: '34', categories: ['pantalons'] },
  { id: '12', name: '36', value: '36', categories: ['pantalons'] },
  { id: '13', name: '38', value: '38', categories: ['pantalons'] },
  { id: '14', name: '40', value: '40', categories: ['pantalons'] },

  // Pointure Chaussures
  ...Array.from({ length: 18 }, (_, i) => {
    const size = 33 + i;
    return {
      id: `sh-${size}`,
      name: `${size}`,
      value: `${size}`,
      categories: ['chaussures'],
    };
  }),

  // Sans taille (accessoires, perles, compléments, sacs)
  { id: '15', name: 'Taille unique', value: 'unique', categories: ['sacs-a-main', 'perles', 'complement-alimentaire', 'loveweight'] },
];



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
  { id: '19', name: 'Multicolore', value: 'multicolore', code: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)', categories: ['robes', 'perles'] },
];



export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [sizeModalVisible, setSizeModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [newImages, setNewImages] = useState<string[]>([])
  const isMounted = useRef(true);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  useEffect(() => {
    isMounted.current = true;
    loadProduct();

    return () => {
      isMounted.current = false;
    };
  }, [id]);

  const toastSuccess = (message: string) => {
    Alert.alert('✅ Succès', message);
  };

  const loadProduct = async () => {
    try {

      // call getProduct details from api service
      const foundProduct = await apiService.getProductDetails(id);
      if (foundProduct && isMounted.current) {
        if (foundProduct.variants) {
          const mappedVariants: ProductVariant[] = foundProduct.variants.map((v: any) => ({
            name: v.name,
            item_code: v.pivot?.item_code || '',
            additional_price: String(v.pivot?.additional_price || '0'),
            additional_cost: String(v.pivot?.additional_cost || '0'),
          }));

          setVariants(mappedVariants);
        }
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

  const getColorFromVariantName = (name: string): string | null => {
    const colorPart = name.split('/')[0].toLowerCase();
    const colorMatch = DEFAULT_COLORS.find(c => c.value.toLowerCase() === colorPart);
    return colorMatch?.code || null;
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && product && isMounted.current) {
        const newImages = result.assets.map(asset => asset.uri);
        setNewImages(newImages);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert('Erreur', 'Échec de la sélection d\'image. Veuillez réessayer.');
    }
  };

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Caméra non disponible', 'La caméra n\'est pas disponible sur le web. Veuillez utiliser le sélecteur d\'images à la place.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 1,
      });

      if (!result.canceled && result.assets?.[0] && product && isMounted.current) {
        setProduct(prev => prev ? ({
          ...prev,
          images: [...prev.images, result.assets[0].uri]
        }) : null);
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Échec de la prise de photo. Veuillez réessayer.');
    }
  };

  const removeImage = (index: number) => {
    if (!product || !isMounted.current) return;
    setProduct(prev => prev ? ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }) : null);
  };

  const toggleColor = (color: string) => {
    if (!product || !isMounted.current) return;
    setProduct(prev => prev ? ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color]
    }) : null);
  };

  const toggleSize = (size: string) => {
    if (!product || !isMounted.current) return;
    setProduct(prev => prev ? ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }) : null);
  };

  const updateProduct = async () => {
    if (!product) return;

    if (!product.name.trim() || !product.price.trim()) {
      Alert.alert('Informations manquantes', 'Veuillez remplir le nom et le prix du produit.');
      return;
    }
    setLoading(true);
    try {
      console.log(product, newImages);

      await apiService.uploadProductToSandySpace(product, newImages);
      toastSuccess('Produit mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      Alert.alert('Erreur', 'Échec de la mise à jour du produit. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };



  const deleteProduct = async () => {
    if (!product) return;

    Alert.alert(
      'Supprimer le produit',
      'Êtes-vous sûr de vouloir supprimer ce produit ? Cette action ne peut pas être annulée.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              product.id && await apiService.deleteProduct(product.id);
              Alert.alert('Succès', 'Produit supprimé avec succès !', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error('Erreur lors de la suppression du produit:', error);
              Alert.alert('Erreur', 'Échec de la suppression du produit. Veuillez réessayer.');
            }
          }
        }
      ]
    );
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



  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Modifier le produit</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={deleteProduct}
          >
            <Trash2 size={20} color="#dc2626" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, { marginRight: 8 }]}
            onPress={updateProduct}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>Sauvegarder</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton]}
            onPress={() => router.back()}
          >
            <Text style={[styles.saveButtonText, { color: '#999' }]}>Quitter</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Images du produit</Text>

          {/* Main Image Preview */}
          {product.images.length > 0 && (
            <View style={styles.mainImageWrapper}>
              <Image
                source={{ uri: product.images[selectedImageIndex] }}
                style={styles.mainImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeImageButtonLarge}
                onPress={() => removeImage(selectedImageIndex)}
              >
                <X size={18} color="white" />
              </TouchableOpacity>
            </View>
          )}

          {/* Thumbnails */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.thumbnailScroll}
          >
            {product.images.map((uri, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.thumbnailWrapper,
                  selectedImageIndex === index && styles.thumbnailActive
                ]}
                onPress={() => setSelectedImageIndex(index)}
              >
                <Image
                  source={{ uri }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}

            {/* Add Image from Gallery */}
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <ImageIcon size={20} color={BURGUNDY} />
              <Text style={styles.addImageText}>Galerie</Text>
            </TouchableOpacity>

            {/* Add Image from Camera */}
            {Platform.OS !== 'web' && (
              <TouchableOpacity style={styles.addImageButton} onPress={takePhoto}>
                <Camera size={20} color={BURGUNDY} />
                <Text style={styles.addImageText}>Caméra</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Détails du produit */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails du produit</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom du produit *</Text>
            <TextInput
              style={styles.textInput}
              value={product.name}
              onChangeText={(text) => setProduct(prev => prev ? ({ ...prev, name: text }) : null)}
              placeholder="Entrer le nom du produit"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Cout (CFA) *</Text>
            <TextInput
              style={styles.textInput}
              value={product.cost}
              onChangeText={(text) => setProduct(prev => prev ? ({ ...prev, cost: text }) : null)}
              placeholder="Entrer le cout"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Prix (CFA) *</Text>
            <TextInput
              style={styles.textInput}
              value={product.price}
              onChangeText={(text) => setProduct(prev => prev ? ({ ...prev, price: text }) : null)}
              placeholder="Entrer le prix"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <RichTextEditor
              value={product.description || ''}
              onChangeText={(html) => setProduct(prev => prev ? ({ ...prev, description: html }) : null)}
              placeholder="Entrer une description détaillée du produit..."
              maxLength={5000}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Catégorie</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setCategoryModalVisible(true)}
            >
              <Text style={styles.selectButtonText}>
                {product.category_id ? DEFAULT_CATEGORIES.find(category => category.id === product.category_id)?.name : 'Sélectionner une catégorie'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Couleurs</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setColorModalVisible(true)}
            >
              <Text style={styles.selectButtonText}>
                {product.colors.length > 0 ? `${product.colors.length} couleurs sélectionnées` : 'Sélectionner les couleurs'}
              </Text>
            </TouchableOpacity>
            {product.colors.length > 0 && (
              <View style={styles.selectedItems}>
                {product.colors.map(color => (
                  <View key={color} style={styles.selectedItem}>
                    <View style={[styles.colorDot, { backgroundColor: DEFAULT_COLORS.find(c => c.value === color)?.code || '#333' }]} />
                    <Text style={styles.selectedItemText}>{DEFAULT_COLORS.find(c => c.value === color)?.name || color}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tailles</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setSizeModalVisible(true)}
            >
              <Text style={styles.selectButtonText}>
                {product.sizes.length > 0 ? `${product.sizes.length} tailles sélectionnées` : 'Sélectionner les tailles'}
              </Text>
            </TouchableOpacity>
            {product.sizes.length > 0 && (
              <View style={styles.selectedItems}>
                {product.sizes.map(size => (
                  <View key={size} style={styles.selectedItem}>
                    <Text style={styles.selectedItemText}>{DEFAULT_SIZES.find(s => s.value === size)?.name || size}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Quantité en stock</Text>
            <TextInput
              style={styles.textInput}
              value={product.stockQuantity.toString()}
              onChangeText={(text) => setProduct(prev => prev ? ({ ...prev, stockQuantity: parseInt(text) || 0 }) : null)}
              placeholder="Entrer la quantité en stock"
              keyboardType="numeric"
            />
          </View>
        </View>
        <View style={styles.variantHeaderRow}>
          <Text style={[styles.variantHeaderCell, { flex: 1.2 }]}>Nom de variance</Text>
          <Text style={[styles.variantHeaderCell, { flex: 0.8 }]}>Coût sup</Text>
          <Text style={[styles.variantHeaderCell, { flex: 0.8 }]}>Prix sup</Text>
        </View>
        {variants.length > 0 ? (
      
  variants.map((variant, index) => {
    const colorPreview = getColorFromVariantName(variant.name);

    return (
      <View key={index} style={[styles.variantRow, index < variants.length - 1 && styles.variantRowBorder]}>
        <View style={styles.variantNameBlock}>
          {colorPreview && <View style={[styles.colorDot, { backgroundColor: colorPreview }]} />}
          <View style={{ flex: 1 }}>
            <Text style={styles.variantName}>{variant.name}</Text>
            <Text style={styles.variantCode}>{variant.item_code}</Text>
          </View>
        </View>

        <TextInput
          style={styles.variantInput}
          keyboardType="numeric"
          value={String(variant.additional_cost || '0')}
          onChangeText={(text) => {
            const updated = [...variants];
            updated[index].additional_cost = text;
            setVariants(updated);
          }}
          placeholder="Coût"
        />
        <TextInput
          style={styles.variantInput}
          keyboardType="numeric"
          value={String(variant.additional_price || '0')}
          onChangeText={(text) => {
            const updated = [...variants];
            updated[index].additional_price = text;
            setVariants(updated);
          }}
          placeholder="Prix"
        />
      </View>
    );
  })
) : (
  <Text style={styles.selectButtonText}>Aucune variante</Text>
)}

      </ScrollView>

      {/* Modal Sélection de couleurs */}
      <Modal
        visible={colorModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setColorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner les couleurs</Text>
              <TouchableOpacity onPress={() => setColorModalVisible(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsList}>
              {DEFAULT_COLORS.filter(color => color.categories.includes(DEFAULT_CATEGORIES.find(category => category.id === product.category_id)?.value || 'robes')).map(color => (
                <TouchableOpacity
                  key={`${color.id}-${color.value}`}
                  style={[
                    styles.optionItem,
                    product.colors.includes(color.value) && styles.selectedOption
                  ]}
                  onPress={() => toggleColor(color.value)}
                >
                  <View style={[styles.colorDot, { backgroundColor: color.code }]} />
                  <Text style={styles.optionText}>{color.name}</Text>
                  {product.colors.includes(color.value) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Sélection de tailles */}
      <Modal
        visible={sizeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSizeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner les tailles</Text>
              <TouchableOpacity onPress={() => setSizeModalVisible(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsList}>
              {DEFAULT_SIZES.filter(size =>
                size.categories.includes(DEFAULT_CATEGORIES.find(category => category.id === product.category_id)?.value || 'robes')
              ).map(size => (
                <TouchableOpacity
                  key={`${size.id}-${size.value}`}
                  style={[
                    styles.optionItem,
                    product.sizes.includes(size.value) && styles.selectedOption
                  ]}
                  onPress={() => toggleSize(size.value)}
                >
                  <Text style={styles.optionText}>{size.name}</Text>
                  {product.sizes.includes(size.value) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Sélection de catégorie */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner une catégorie</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsList}>
              {DEFAULT_CATEGORIES.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.optionItem,
                    product.category_id === category.id && styles.selectedOption
                  ]}
                  onPress={() => {
                    // update product
                    setProduct(prev => prev ? ({ ...prev, category_id: category.id }) : null);
                    setCategoryModalVisible(false);
                  } 
                }
                >
                  <Text style={styles.optionText}>{category.name}</Text>
                  {product.category_id === category.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <Text style={styles.loadingText}>Sauvegarde en cours...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainImageWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButtonLarge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#dc2626',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  thumbnailScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  thumbnailWrapper: {
    width: 60,
    height: 60,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  thumbnailActive: {
    borderColor: BURGUNDY,
    borderWidth: 2,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },

  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 6,
  },
  saveButton: {
    borderRadius: 6,
  },
  saveButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: BURGUNDY,
  },
  content: {
    flex: 1,
    paddingBottom: 30
  },
  section: {
    margin: 12,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  imageRow: {
    flexDirection: 'row',
    gap: 8,
  },
  imageContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 64,
    height: 64,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: BURGUNDY,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontFamily: 'Inter-Regular',
    fontSize: 9,
    color: BURGUNDY,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  selectButton: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 6,
    padding: 10,
    backgroundColor: 'white',
  },
  selectButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  selectedItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  selectedItemText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#333',
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    color: '#333',
  },
  optionsList: {
    maxHeight: 360,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 10,
  },
  selectedOption: {
    backgroundColor: '#f8f9fa',
  },
  optionText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#333',
  },
  checkmark: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: BURGUNDY,
  },
  loadingOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0,0,0,0.3)',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 999,
},
loadingBox: {
  padding: 16,
  backgroundColor: 'white',
  borderRadius: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
},
loadingText: {
  fontSize: 15,
  fontFamily: 'Inter-SemiBold',
  color: BURGUNDY,
},
variantRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 8,
  paddingHorizontal: 12,
  gap: 8,
},
variantRowBorder: {
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
},
variantNameBlock: {
  flex: 1.2,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
variantName: {
  fontSize: 13,
  fontFamily: 'Inter-SemiBold',
  color: '#333',
},
variantCode: {
  fontSize: 11,
  fontFamily: 'Inter-Regular',
  color: '#999',
},
variantInput: {
  flex: 0.8,
  borderWidth: 1,
  borderColor: '#e5e5e5',
  borderRadius: 6,
  padding: 6,
  fontSize: 13,
  fontFamily: 'Inter-Regular',
},
variantHeaderRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginLeft: 15,
  marginTop: 8,
 
},
variantHeaderCell: {
  fontFamily: 'Inter-SemiBold',
  fontSize: 12,
  color: '#444',
},
});
