import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Send } from 'lucide-react-native';
import { ImageUploadItem } from '@/types/Product';
import { AIService } from '@/services/AIService';

const BURGUNDY = '#400605';

export default function AddCaptionsScreen() {
  const { images } = useLocalSearchParams<{ images: string }>();
  const [imageItems, setImageItems] = useState<ImageUploadItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
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
  }, [images]);

  const updateCaption = (id: string, caption: string) => {
    setImageItems(prev => prev.map(item => 
      item.id === id ? { ...item, caption } : item
    ));
  };

  const validateCaption = (caption: string) => {
    return AIService.validateCaption(caption);
  };

  const proceedToProcessing = () => {
    // Vérifier si toutes les images ont des légendes
    const emptyCaptions = imageItems.filter(item => !item.caption.trim());
    if (emptyCaptions.length > 0) {
      Alert.alert(
        'Légendes manquantes', 
        `Veuillez ajouter des légendes à toutes les ${emptyCaptions.length} images restantes.`
      );
      return;
    }

    // Valider les légendes
    const invalidCaptions = imageItems.filter(item => {
      const validation = validateCaption(item.caption);
      return !validation.isValid;
    });

    if (invalidCaptions.length > 0) {
      Alert.alert(
        'Validation des légendes',
        'Certaines légendes manquent d\'informations requises (prix, couleur, taille). Voulez-vous continuer quand même ?',
        [
          { text: 'Réviser les légendes', style: 'cancel' },
          { 
            text: 'Continuer quand même', 
            onPress: () => navigateToProcessing() 
          }
        ]
      );
      return;
    }

    navigateToProcessing();
  };

  const navigateToProcessing = () => {
    router.push({
      pathname: '/process-products',
      params: { images: JSON.stringify(imageItems) }
    });
  };

  const renderImageCard = (item: ImageUploadItem, index: number) => {
    const validation = validateCaption(item.caption);
    const hasCaption = item.caption.trim().length > 0;

    return (
      <View key={item.id} style={styles.imageCard}>
        <View style={styles.imageHeader}>
          <Text style={styles.imageNumber}>Image {index + 1}</Text>
          <View style={styles.statusIndicator}>
            {hasCaption ? (
              validation.isValid ? (
                <CheckCircle size={20} color="#22c55e" />
              ) : (
                <AlertCircle size={20} color="#f59e0b" />
              )
            ) : (
              <View style={styles.pendingDot} />
            )}
          </View>
        </View>

        <Image source={{ uri: item.uri }} style={styles.productImage} />

        <View style={styles.captionSection}>
          <Text style={styles.captionLabel}>
            Décrivez ce produit
          </Text>
          <Text style={styles.captionHint}>
            Incluez : nom, prix (ex: 15000f), couleurs, tailles
          </Text>
          
          <TextInput
            style={styles.captionInput}
            value={item.caption}
            onChangeText={(text) => updateCaption(item.id, text)}
            placeholder="ex: Robe rouge taille M L 15000f élégante pour soirée"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {hasCaption && !validation.isValid && (
            <View style={styles.validationWarning}>
              <AlertCircle size={16} color="#f59e0b" />
              <Text style={styles.warningText}>
                Manquant : {validation.missing.join(', ')}
              </Text>
            </View>
          )}

          {hasCaption && validation.isValid && (
            <View style={styles.validationSuccess}>
              <CheckCircle size={16} color="#22c55e" />
              <Text style={styles.successText}>
                La légende semble correcte !
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const completedCaptions = imageItems.filter(item => item.caption.trim().length > 0).length;
  const validCaptions = imageItems.filter(item => {
    const validation = validateCaption(item.caption);
    return validation.isValid;
  }).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Ajouter des légendes</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressBar}>
        <View style={styles.progressTrack}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(completedCaptions / imageItems.length) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {completedCaptions}/{imageItems.length} légendes ajoutées
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>💡 Conseils pour les légendes</Text>
          <Text style={styles.instructionText}>
            • Incluez le nom du produit{'\n'}
            • Mentionnez le prix (ex: 15000f, 25000 CFA){'\n'}
            • Listez les couleurs disponibles{'\n'}
            • Spécifiez les tailles (S, M, L, XL, etc.){'\n'}
            • Ajoutez des détails spéciaux
          </Text>
        </View>

        {imageItems.map((item, index) => renderImageCard(item, index))}

        <View style={styles.bottomSection}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Résumé</Text>
            <Text style={styles.summaryText}>
              {completedCaptions} sur {imageItems.length} légendes complétées{'\n'}
              {validCaptions} légendes ont toutes les informations requises
            </Text>
          </View>

          <TouchableOpacity 
            style={[
              styles.processButton,
              completedCaptions === 0 && styles.disabledButton
            ]} 
            onPress={proceedToProcessing}
            disabled={completedCaptions === 0}
          >
            <Send size={20} color="white" />
            <Text style={styles.processButtonText}>
              Traiter avec l'IA
            </Text>
          </TouchableOpacity>
        </View>
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
  progressBar: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#e5e5e5',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: BURGUNDY,
    borderRadius: 2,
  },
  progressText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  instructionCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: BURGUNDY,
  },
  instructionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  instructionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  imageCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  imageNumber: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333',
  },
  statusIndicator: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
  },
  productImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  captionSection: {
    padding: 16,
  },
  captionLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  captionHint: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  validationWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    gap: 6,
  },
  warningText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#f59e0b',
  },
  validationSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#dcfce7',
    borderRadius: 6,
    gap: 6,
  },
  successText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#22c55e',
  },
  bottomSection: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  summaryText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  processButton: {
    flexDirection: 'row',
    backgroundColor: BURGUNDY,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  processButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'white',
  },
});