import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Camera, Image as ImageIcon, X, ArrowLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageUploadItem } from '@/types/Product';

const BURGUNDY = '#400605';

export default function CreateProductsScreen() {
  const [selectedImages, setSelectedImages] = useState<ImageUploadItem[]>([]);

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10, // Limiter à 10 images
      });

      if (!result.canceled && result.assets) {
        const newImages: ImageUploadItem[] = result.assets.map((asset, index) => ({
          id: Date.now().toString() + index,
          uri: asset.uri,
          caption: '',
          status: 'pending',
        }));
        
        setSelectedImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection des images:', error);
      Alert.alert('Erreur', 'Échec de la sélection des images. Veuillez réessayer.');
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

      if (!result.canceled && result.assets?.[0]) {
        const newImage: ImageUploadItem = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          caption: '',
          status: 'pending',
        };
        
        setSelectedImages(prev => [...prev, newImage]);
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Échec de la prise de photo. Veuillez réessayer.');
    }
  };

  const removeImage = (id: string) => {
    setSelectedImages(prev => prev.filter(img => img.id !== id));
  };

  const proceedToCaptions = () => {
    if (selectedImages.length === 0) {
      Alert.alert('Aucune image', 'Veuillez sélectionner au moins une image pour continuer.');
      return;
    }

    // Naviguer vers l'écran de légendes avec les images sélectionnées
    router.push({
      pathname: '/add-captions',
      params: { images: JSON.stringify(selectedImages) }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Ajouter des produits</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>📸 Création de produits style WhatsApp</Text>
          <Text style={styles.instructionText}>
            1. Sélectionnez plusieurs images de produits depuis votre galerie{'\n'}
            2. Ajoutez des légendes décrivant chaque produit{'\n'}
            3. Notre IA créera automatiquement les fiches produits{'\n'}
            4. Révisez et modifiez avant de sauvegarder
          </Text>
        </View>

        {/* Boutons de sélection d'images */}
        <View style={styles.buttonSection}>
          <TouchableOpacity style={styles.primaryButton} onPress={pickImages}>
            <ImageIcon size={24} color="white" />
            <Text style={styles.primaryButtonText}>Sélectionner depuis la galerie</Text>
          </TouchableOpacity>
          
          {Platform.OS !== 'web' && (
            <TouchableOpacity style={styles.secondaryButton} onPress={takePhoto}>
              <Camera size={24} color={BURGUNDY} />
              <Text style={styles.secondaryButtonText}>Prendre une photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Grille des images sélectionnées */}
        {selectedImages.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={styles.sectionTitle}>
              Images sélectionnées ({selectedImages.length})
            </Text>
            
            <View style={styles.imageGrid}>
              {selectedImages.map((item) => (
                <View key={item.id} style={styles.imageItem}>
                  <Image source={{ uri: item.uri }} style={styles.selectedImage} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeImage(item.id)}
                  >
                    <X size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.continueButton} onPress={proceedToCaptions}>
              <Text style={styles.continueButtonText}>
                Continuer pour ajouter des légendes
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* État vide */}
        {selectedImages.length === 0 && (
          <View style={styles.emptyState}>
            <ImageIcon size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Aucune image sélectionnée</Text>
            <Text style={styles.emptySubtitle}>
              Sélectionnez des images de vos produits pour commencer avec la création de produits alimentée par l'IA
            </Text>
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
  instructionCard: {
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
  instructionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#333',
    marginBottom: 12,
  },
  instructionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttonSection: {
    paddingHorizontal: 16,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: BURGUNDY,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'white',
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: BURGUNDY,
  },
  secondaryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: BURGUNDY,
  },
  selectedSection: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  imageItem: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: BURGUNDY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'white',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});