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
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera, Image as ImageIcon, X, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Product } from '@/types/Product';
import { StorageService } from '@/services/StorageService';

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
      const products = await StorageService.getProducts();
      const foundProduct = products.find(p => p.id === id);
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

    if (isMounted.current) {
      setLoading(true);
    }
    
    try {
      const updatedProduct = {
        ...product,
        updatedAt: new Date().toISOString(),
      };

      await StorageService.updateProduct(product.id, updatedProduct);
      Alert.alert('Succès', 'Produit mis à jour avec succès !', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      Alert.alert('Erreur', 'Échec de la mise à jour du produit. Veuillez réessayer.');
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
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
              await StorageService.deleteProduct(product.id);
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.imageRow}>
              {product.images.map((uri, index) => (
                <View key={index} style={styles.imageContainer}>
                  <ImageIcon size={80} color="#ccc" />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <X size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
              
              <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                <ImageIcon size={24} color={BURGUNDY} />
                <Text style={styles.addImageText}>Galerie</Text>
              </TouchableOpacity>
              
              {Platform.OS !== 'web' && (
                <TouchableOpacity style={styles.addImageButton} onPress={takePhoto}>
                  <Camera size={24} color={BURGUNDY} />
                  <Text style={styles.addImageText}>Caméra</Text>
                </TouchableOpacity>
              )}
            </View>
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
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={product.description || ''}
              onChangeText={(text) => setProduct(prev => prev ? ({ ...prev, description: text }) : null)}
              placeholder="Entrer la description du produit"
              multiline
              numberOfLines={3}
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
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    padding: 8,
  },
  saveButton: {
    backgroundColor: BURGUNDY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: 'white',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  imageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  imageContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 80,
    height: 80,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: BURGUNDY,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: BURGUNDY,
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectButton: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
  },
  selectButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  selectedItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  selectedItemText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#333',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#333',
  },
  optionsList: {
    maxHeight: 400,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  selectedOption: {
    backgroundColor: '#f8f9fa',
  },
  optionText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#333',
  },
  checkmark: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: BURGUNDY,
  },
});