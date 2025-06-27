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
import { router } from 'expo-router';
import { Camera, Image as ImageIcon, Wand as Wand2, X, Plus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Product, AIProductResult } from '@/types/Product';
import { StorageService } from '@/services/StorageService';
import { AIService } from '@/services/AIService';

const BURGUNDY = '#400605';

interface ProductForm {
  name: string;
  price: string;
  description: string;
  category: string;
  colors: string[];
  sizes: string[];
  stockQuantity: number;
  images: string[];
}

const DEFAULT_CATEGORIES = [
  'Dresses', 'Shirts', 'Pants', 'Shoes', 'Accessories', 
  'Bags', 'Jewelry', 'Electronics', 'Home', 'Beauty'
];

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const DEFAULT_COLORS = [
  'red', 'blue', 'green', 'yellow', 'black', 'white', 
  'pink', 'purple', 'orange', 'brown', 'beige', 'gray'
];

export default function AddProductScreen() {
  const [form, setForm] = useState<ProductForm>({
    name: '',
    price: '',
    description: '',
    category: '',
    colors: [],
    sizes: [],
    stockQuantity: 0,
    images: [],
  });

  const [loading, setLoading] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [imageCaption, setImageCaption] = useState('');
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [sizeModalVisible, setSizeModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [aiSettings, setAiSettings] = useState<any>({});
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadAISettings();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadAISettings = async () => {
    try {
      const settings = await StorageService.getSettings();
      if (isMounted.current) {
        setAiSettings(settings);
      }
    } catch (error) {
      console.error('Error loading AI settings:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && isMounted.current) {
        const newImages = result.assets.map(asset => asset.uri);
        setForm(prev => ({
          ...prev,
          images: [...prev.images, ...newImages]
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Camera Not Available', 'Camera is not available on web. Please use image picker instead.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0] && isMounted.current) {
        setForm(prev => ({
          ...prev,
          images: [...prev.images, result.assets[0].uri]
        }));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    if (!isMounted.current) return;
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const analyzeWithAI = async () => {
    if (!form.images.length) {
      Alert.alert('No Images', 'Please add at least one image before using AI analysis.');
      return;
    }

    if (!aiSettings.aiEnabled) {
      Alert.alert('AI Disabled', 'AI analysis is disabled. Please enable it in settings.');
      return;
    }

    const apiKey = aiSettings.aiProvider === 'openai' ? aiSettings.openaiApiKey : aiSettings.deepinfraApiKey;
    if (!apiKey) {
      Alert.alert('API Key Missing', 'Please configure your AI API key in settings.');
      return;
    }

    if (isMounted.current) {
      setLoading(true);
    }
    
    try {
      const aiService = new AIService({
        apiKey,
        provider: aiSettings.aiProvider || 'openai',
      });

      const result = await aiService.analyzeProductFromImage(
        form.images[0],
        imageCaption,
        DEFAULT_CATEGORIES,
        DEFAULT_SIZES,
        DEFAULT_COLORS
      );

      // Apply AI results to form only if component is still mounted
      if (isMounted.current) {
        setForm(prev => ({
          ...prev,
          name: result.name,
          price: result.price,
          description: result.description,
          category: result.category,
          colors: result.colors,
          sizes: result.sizes,
        }));

        Alert.alert('AI Analysis Complete', 'Product details have been filled automatically. Please review and adjust as needed.');
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
      Alert.alert('AI Analysis Failed', 'Failed to analyze product with AI. Please fill details manually.');
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const toggleColor = (color: string) => {
    if (!isMounted.current) return;
    setForm(prev => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color]
    }));
  };

  const toggleSize = (size: string) => {
    if (!isMounted.current) return;
    setForm(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const saveProduct = async () => {
    if (!form.name.trim() || !form.price.trim()) {
      Alert.alert('Missing Information', 'Please fill in product name and price.');
      return;
    }

    if (form.colors.length === 0 || form.sizes.length === 0) {
      Alert.alert('Missing Information', 'Please select at least one color and one size.');
      return;
    }

    if (isMounted.current) {
      setLoading(true);
    }
    
    try {
      const product: Product = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: form.name.trim(),
        price: form.price.trim(),
        description: form.description.trim(),
        category: form.category,
        colors: form.colors,
        sizes: form.sizes,
        stockQuantity: form.stockQuantity,
        images: form.images,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await StorageService.addProduct(product);
      Alert.alert('Success', 'Product added successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Failed to save product. Please try again.');
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Product</Text>
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={saveProduct}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* AI Mode Toggle */}
        <View style={styles.section}>
          <View style={styles.aiToggle}>
            <TouchableOpacity
              style={[styles.modeButton, !aiMode && styles.activeModeButton]}
              onPress={() => setAiMode(false)}
            >
              <Text style={[styles.modeButtonText, !aiMode && styles.activeModeButtonText]}>
                Manual
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, aiMode && styles.activeModeButton]}
              onPress={() => setAiMode(true)}
            >
              <Wand2 size={16} color={aiMode ? 'white' : BURGUNDY} />
              <Text style={[styles.modeButtonText, aiMode && styles.activeModeButtonText]}>
                AI Assist
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Images Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Images</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.imageRow}>
              {form.images.map((uri, index) => (
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
                <Text style={styles.addImageText}>Gallery</Text>
              </TouchableOpacity>
              
              {Platform.OS !== 'web' && (
                <TouchableOpacity style={styles.addImageButton} onPress={takePhoto}>
                  <Camera size={24} color={BURGUNDY} />
                  <Text style={styles.addImageText}>Camera</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>

        {/* AI Caption (if AI mode) */}
        {aiMode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Describe Your Product</Text>
            <TextInput
              style={styles.captionInput}
              value={imageCaption}
              onChangeText={setImageCaption}
              placeholder="e.g., Red dress size M L, 15000f"
              multiline
            />
            <TouchableOpacity
              style={styles.aiButton}
              onPress={analyzeWithAI}
              disabled={loading}
            >
              <Wand2 size={20} color="white" />
              <Text style={styles.aiButtonText}>
                {loading ? 'Analyzing...' : 'Analyze with AI'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Product Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Product Name *</Text>
            <TextInput
              style={styles.textInput}
              value={form.name}
              onChangeText={(text) => setForm(prev => ({ ...prev, name: text }))}
              placeholder="Enter product name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Price (CFA) *</Text>
            <TextInput
              style={styles.textInput}
              value={form.price}
              onChangeText={(text) => setForm(prev => ({ ...prev, price: text }))}
              placeholder="Enter price"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={form.description}
              onChangeText={(text) => setForm(prev => ({ ...prev, description: text }))}
              placeholder="Enter product description"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setCategoryModalVisible(true)}
            >
              <Text style={styles.selectButtonText}>
                {form.category || 'Select category'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Colors *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setColorModalVisible(true)}
            >
              <Text style={styles.selectButtonText}>
                {form.colors.length > 0 ? `${form.colors.length} colors selected` : 'Select colors'}
              </Text>
            </TouchableOpacity>
            {form.colors.length > 0 && (
              <View style={styles.selectedItems}>
                {form.colors.map(color => (
                  <View key={color} style={styles.selectedItem}>
                    <View style={[styles.colorDot, { backgroundColor: color }]} />
                    <Text style={styles.selectedItemText}>{color}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Sizes *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setSizeModalVisible(true)}
            >
              <Text style={styles.selectButtonText}>
                {form.sizes.length > 0 ? `${form.sizes.length} sizes selected` : 'Select sizes'}
              </Text>
            </TouchableOpacity>
            {form.sizes.length > 0 && (
              <View style={styles.selectedItems}>
                {form.sizes.map(size => (
                  <View key={size} style={styles.selectedItem}>
                    <Text style={styles.selectedItemText}>{size}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Initial Stock Quantity</Text>
            <TextInput
              style={styles.textInput}
              value={form.stockQuantity.toString()}
              onChangeText={(text) => setForm(prev => ({ ...prev, stockQuantity: parseInt(text) || 0 }))}
              placeholder="Enter stock quantity"
              keyboardType="numeric"
            />
          </View>
        </View>
      </ScrollView>

      {/* Color Selection Modal */}
      <Modal
        visible={colorModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setColorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Colors</Text>
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
                    form.colors.includes(color) && styles.selectedOption
                  ]}
                  onPress={() => toggleColor(color)}
                >
                  <View style={[styles.colorDot, { backgroundColor: color }]} />
                  <Text style={styles.optionText}>{color}</Text>
                  {form.colors.includes(color) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Size Selection Modal */}
      <Modal
        visible={sizeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSizeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Sizes</Text>
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
                    form.sizes.includes(size) && styles.selectedOption
                  ]}
                  onPress={() => toggleSize(size)}
                >
                  <Text style={styles.optionText}>{size}</Text>
                  {form.sizes.includes(size) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Category Selection Modal */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
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
                    form.category === category && styles.selectedOption
                  ]}
                  onPress={() => {
                    setForm(prev => ({ ...prev, category }));
                    setCategoryModalVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>{category}</Text>
                  {form.category === category && (
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
  aiToggle: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  activeModeButton: {
    backgroundColor: BURGUNDY,
  },
  modeButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: BURGUNDY,
  },
  activeModeButtonText: {
    color: 'white',
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
  captionInput: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  aiButton: {
    flexDirection: 'row',
    backgroundColor: BURGUNDY,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  aiButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'white',
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