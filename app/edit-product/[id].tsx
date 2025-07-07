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
import { Product } from '@/types/Product';
import { StorageService } from '@/services/StorageService';
// import api service
import { apiService } from '@/services/ApiService';

const BURGUNDY = '#400605';

const DEFAULT_CATEGORIES = [
  'Robes', 'Chemises', 'Pantalons', 'Chaussures', 'Accessoires',
  'Sacs', 'Bijoux', 'Électronique', 'Maison', 'Beauté'
];

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const DEFAULT_COLORS = [
  'rouge', 'bleu', 'vert', 'jaune', 'noir', 'blanc',
  'rose', 'violet', 'orange', 'marron', 'beige', 'gris'
];

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [sizeModalVisible, setSizeModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadProduct();

    return () => {
      isMounted.current = false;
    };
  }, [id]);

  const loadProduct = async () => {
    try {

      // call getProduct details from api service
      const foundProduct = await apiService.getProductDetails(id);
      if (foundProduct && isMounted.current) {
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

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && product && isMounted.current) {
        const newImages = result.assets.map(asset => asset.uri);
        setProduct(prev => prev ? ({
          ...prev,
          images: [...prev.images, ...newImages]
        }) : null);
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
        quality: 0.8,
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

  if (product.colors.length === 0 || product.sizes.length === 0) {
    Alert.alert('Informations manquantes', 'Veuillez sélectionner au moins une couleur et une taille.');
    return;
  }

  setLoading(true);

  try {
    const formData = new FormData();

    formData.append('name', product.name);
    formData.append('price', product.price);
    formData.append('description', product.description || '');
    formData.append('category', product.category || '');
    formData.append('stockQuantity', String(product.stockQuantity));
    formData.append('colors', JSON.stringify(product.colors));
    formData.append('sizes', JSON.stringify(product.sizes));

    // Variant support
    if (product.is_variant) {
      formData.append('is_variant', '1');
      formData.append('variant_option', JSON.stringify(product.variantOptions));
      formData.append('variant_value', JSON.stringify(product.variantValues));

      product.variants.forEach((variant, index) => {
        formData.append(`variant_name[]`, variant.name);
        formData.append(`item_code[]`, variant.item_code);
        formData.append(`additional_price[]`, variant.additional_price);
        formData.append(`additional_cost[]`, variant.additional_cost);
      });
    }

    // Images
    product.images.forEach((uri, index) => {
      if (uri.startsWith('file://') || uri.startsWith('data:')) {
        const name = uri.split('/').pop() || `image_${index}.jpg`;
        const type = `image/${name.split('.').pop()}`;
        formData.append('image[]', {
          uri,
          name,
          type,
        } as any);
      }
    });

    // Fire update to Laravel
    await apiService.updateProduct(product.id, formData);

    Alert.alert('Succès', 'Produit mis à jour avec succès !', [
      { text: 'OK', onPress: () => router.back() }
    ]);
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
            await apiService.deleteProduct(product.id);
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
            style={styles.saveButton}
            onPress={updateProduct}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>Sauvegarder</Text>
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
                {product.category || 'Sélectionner une catégorie'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Couleurs *</Text>
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
                    <View style={[styles.colorDot, { backgroundColor: color }]} />
                    <Text style={styles.selectedItemText}>{color}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tailles *</Text>
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
                    <Text style={styles.selectedItemText}>{size}</Text>
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
              {DEFAULT_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.optionItem,
                    product.colors.includes(color) && styles.selectedOption
                  ]}
                  onPress={() => toggleColor(color)}
                >
                  <View style={[styles.colorDot, { backgroundColor: color }]} />
                  <Text style={styles.optionText}>{color}</Text>
                  {product.colors.includes(color) && (
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
              {DEFAULT_SIZES.map(size => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.optionItem,
                    product.sizes.includes(size) && styles.selectedOption
                  ]}
                  onPress={() => toggleSize(size)}
                >
                  <Text style={styles.optionText}>{size}</Text>
                  {product.sizes.includes(size) && (
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
                  key={category}
                  style={[
                    styles.optionItem,
                    product.category === category && styles.selectedOption
                  ]}
                  onPress={() => {
                    setProduct(prev => prev ? ({ ...prev, category }) : null);
                    setCategoryModalVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>{category}</Text>
                  {product.category === category && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#666',
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
    width: 10,
    height: 10,
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
  }
});
