import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CircleCheck as CheckCircle, Circle as XCircle, Loader, RefreshCw, Save, Eye } from 'lucide-react-native';
import { ImageUploadItem, AIProductResult } from '@/types/Product';
import { AIService } from '@/services/AIService';
import { StorageService } from '@/services/StorageService';
import { apiService } from '@/services/ApiService';

const BURGUNDY = '#400605';

export default function ProcessProductsScreen() {
  const { images } = useLocalSearchParams<{ images: string }>();
  const [imageItems, setImageItems] = useState<ImageUploadItem[]>([]);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiSettings, setAiSettings] = useState<any>({});
  const [categories, setCategories] = useState<string[]>([]);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    if (images) {
      try {
        const parsedImages = JSON.parse(images);
        setImageItems(parsedImages);
      } catch (error) {
        console.error('Erreur lors de l\'analyse des images:', error);
        Alert.alert('Erreur', 'Échec du chargement des images');
        router.back();
      }
    }
    
    loadSettings();
    loadCategories();
    
    return () => {
      isMounted.current = false;
    };
  }, [images]);

  const loadSettings = async () => {
    try {
      const settings = await StorageService.getSettings();
      if (isMounted.current) {
        setAiSettings(settings);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres IA:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const apiCategories = await apiService.getCategories();
      if (isMounted.current) {
        setCategories(apiCategories.map(cat => cat.name));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      // Fallback vers les catégories par défaut
      if (isMounted.current) {
        setCategories([
          'Robes', 'Chemises', 'Pantalons', 'Chaussures', 'Accessoires', 
          'Sacs', 'Bijoux', 'Électronique', 'Maison', 'Beauté'
        ]);
      }
    }
  };

  const startProcessing = async () => {
    if (!aiSettings.aiEnabled) {
      Alert.alert('IA désactivée', 'L\'analyse IA est désactivée. Veuillez l\'activer dans les paramètres.');
      return;
    }

    const apiKey = aiSettings.aiProvider === 'openai' ? aiSettings.openaiApiKey : aiSettings.deepinfraApiKey;
    if (!apiKey) {
      Alert.alert('Clé API manquante', 'Veuillez configurer votre clé API IA dans les paramètres.');
      return;
    }

    if (isMounted.current) {
      setIsProcessing(true);
      setCurrentProcessingIndex(0);
    }

    const aiService = new AIService({
      apiKey,
      provider: aiSettings.aiProvider || 'openai',
    });

    for (let i = 0; i < imageItems.length; i++) {
      if (!isMounted.current) break;
      
      setCurrentProcessingIndex(i);
      
      try {
        if (isMounted.current) {
          setImageItems(prev => prev.map((item, index) => 
            index === i ? { ...item, status: 'processing' } : item
          ));
        }

        const result = await aiService.analyzeProductFromImage(
          imageItems[i].uri,
          imageItems[i].caption,
          categories,
          ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
          ['rouge', 'bleu', 'vert', 'jaune', 'noir', 'blanc', 'rose', 'violet', 'orange', 'marron', 'beige', 'gris']
        );

        if (isMounted.current) {
          setImageItems(prev => prev.map((item, index) => 
            index === i ? { ...item, status: 'completed', result } : item
          ));
        }

        // Petit délai entre les traitements
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Erreur lors du traitement de l'image ${i}:`, error);
        if (isMounted.current) {
          setImageItems(prev => prev.map((item, index) => 
            index === i ? { 
              ...item, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Échec du traitement'
            } : item
          ));
        }
      }
    }

    if (isMounted.current) {
      setIsProcessing(false);
    }
  };

  const retryProcessing = async (index: number) => {
    const apiKey = aiSettings.aiProvider === 'openai' ? aiSettings.openaiApiKey : aiSettings.deepinfraApiKey;
    if (!apiKey || !isMounted.current) return;

    const aiService = new AIService({
      apiKey,
      provider: aiSettings.aiProvider || 'openai',
    });

    try {
      if (isMounted.current) {
        setImageItems(prev => prev.map((item, i) => 
          i === index ? { ...item, status: 'processing', error: undefined } : item
        ));
      }

      const result = await aiService.analyzeProductFromImage(
        imageItems[index].uri,
        imageItems[index].caption,
        categories,
        ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        ['rouge', 'bleu', 'vert', 'jaune', 'noir', 'blanc', 'rose', 'violet', 'orange', 'marron', 'beige', 'gris']
      );

      if (isMounted.current) {
        setImageItems(prev => prev.map((item, i) => 
          i === index ? { ...item, status: 'completed', result } : item
        ));
      }

    } catch (error) {
      console.error(`Erreur lors de la nouvelle tentative pour l'image ${index}:`, error);
      if (isMounted.current) {
        setImageItems(prev => prev.map((item, i) => 
          i === index ? { 
            ...item, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Échec du traitement'
          } : item
        ));
      }
    }
  };

  const saveProducts = async () => {
    const completedItems = imageItems.filter(item => item.status === 'completed' && item.result);
    
    if (completedItems.length === 0) {
      Alert.alert('Aucun produit', 'Aucun produit n\'a été traité avec succès.');
      return;
    }

    try {
      for (const item of completedItems) {
        if (!item.result) continue;

        const product = {
          name: item.result.name,
          price: item.result.price,
          description: item.result.description,
          category_id: undefined, // Sera résolu par l'API
          colors: item.result.colors,
          sizes: item.result.sizes,
          stock_quantity: 0, // Stock par défaut
          images: [item.uri],
        };

        try {
          await apiService.createProduct(product);
        } catch (apiError) {
          console.error('Échec de la création via API, sauvegarde locale:', apiError);
          // Fallback vers le stockage local
          const localProduct = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: item.result.name,
            price: item.result.price,
            description: item.result.description,
            category: item.result.category,
            colors: item.result.colors,
            sizes: item.result.sizes,
            stockQuantity: 0,
            images: [item.uri],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await StorageService.addProduct(localProduct);
        }
      }

      Alert.alert(
        'Succès !', 
        `${completedItems.length} produits ont été créés avec succès !`,
        [
          { text: 'OK', onPress: () => router.replace('/(tabs)') }
        ]
      );

    } catch (error) {
      console.error('Erreur lors de la sauvegarde des produits:', error);
      Alert.alert('Erreur', 'Échec de la sauvegarde de certains produits. Veuillez réessayer.');
    }
  };

  const previewProduct = (item: ImageUploadItem) => {
    if (!item.result) return;
    
    Alert.alert(
      item.result.name,
      `Prix: ${item.result.price}f\nCouleurs: ${item.result.colors.join(', ')}\nTailles: ${item.result.sizes.join(', ')}\nCatégorie: ${item.result.category}\n\nDescription: ${item.result.description}`
    );
  };

  const renderProcessingItem = (item: ImageUploadItem, index: number) => {
    const getStatusIcon = () => {
      switch (item.status) {
        case 'processing':
          return <Loader size={20} color={BURGUNDY} style={{ transform: [{ rotate: '45deg' }] }} />;
        case 'completed':
          return <CheckCircle size={20} color="#22c55e" />;
        case 'error':
          return <XCircle size={20} color="#dc2626" />;
        default:
          return <View style={styles.pendingDot} />;
      }
    };

    const getStatusText = () => {
      switch (item.status) {
        case 'processing':
          return 'Traitement...';
        case 'completed':
          return 'Terminé';
        case 'error':
          return 'Échec';
        default:
          return 'En attente';
      }
    };

    return (
      <View key={item.id} style={styles.processingItem}>
        <Image source={{ uri: item.uri }} style={styles.itemImage} />
        
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle}>Image {index + 1}</Text>
            <View style={styles.statusContainer}>
              {getStatusIcon()}
              <Text style={[
                styles.statusText,
                item.status === 'completed' && styles.successText,
                item.status === 'error' && styles.errorText,
                item.status === 'processing' && styles.processingText,
              ]}>
                {getStatusText()}
              </Text>
            </View>
          </View>

          <Text style={styles.itemCaption} numberOfLines={2}>
            {item.caption}
          </Text>

          {item.result && (
            <View style={styles.resultPreview}>
              <Text style={styles.resultName}>{item.result.name}</Text>
              <Text style={styles.resultPrice}>{item.result.price}f</Text>
            </View>
          )}

          {item.error && (
            <Text style={styles.errorMessage}>{item.error}</Text>
          )}

          <View style={styles.itemActions}>
            {item.status === 'error' && (
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => retryProcessing(index)}
              >
                <RefreshCw size={16} color={BURGUNDY} />
                <Text style={styles.retryText}>Réessayer</Text>
              </TouchableOpacity>
            )}

            {item.status === 'completed' && item.result && (
              <TouchableOpacity 
                style={styles.previewButton}
                onPress={() => previewProduct(item)}
              >
                <Eye size={16} color="#666" />
                <Text style={styles.previewText}>Aperçu</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const completedCount = imageItems.filter(item => item.status === 'completed').length;
  const errorCount = imageItems.filter(item => item.status === 'error').length;
  const hasStarted = imageItems.some(item => item.status !== 'pending');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Traitement IA</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>🤖 Création de produits IA</Text>
          <Text style={styles.summaryText}>
            Notre IA analysera chaque image et légende pour créer automatiquement des fiches produits détaillées.
          </Text>
          
          {hasStarted && (
            <View style={styles.progressSummary}>
              <Text style={styles.progressText}>
                ✅ {completedCount} terminés • ❌ {errorCount} échoués • 📝 {imageItems.length} total
              </Text>
            </View>
          )}
        </View>

        {!hasStarted && (
          <TouchableOpacity style={styles.startButton} onPress={startProcessing}>
            <Text style={styles.startButtonText}>Démarrer le traitement IA</Text>
          </TouchableOpacity>
        )}

        <View style={styles.processingList}>
          {imageItems.map((item, index) => renderProcessingItem(item, index))}
        </View>

        {hasStarted && !isProcessing && completedCount > 0 && (
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.saveButton} onPress={saveProducts}>
              <Save size={20} color="white" />
              <Text style={styles.saveButtonText}>
                Sauvegarder {completedCount} produits
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  backButton: {
    padding: 4,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
  },
  summaryText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  progressSummary: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  progressText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#333',
  },
  startButton: {
    backgroundColor: BURGUNDY,
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  startButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'white',
  },
  processingList: {
    paddingHorizontal: 16,
  },
  processingItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  itemContent: {
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
  },
  successText: {
    color: '#22c55e',
  },
  errorText: {
    color: '#dc2626',
  },
  processingText: {
    color: BURGUNDY,
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
  },
  itemCaption: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  resultPreview: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  resultName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#333',
  },
  resultPrice: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: BURGUNDY,
  },
  errorMessage: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  retryText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: BURGUNDY,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  previewText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#666',
  },
  bottomActions: {
    padding: 16,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: BURGUNDY,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'white',
  },
});