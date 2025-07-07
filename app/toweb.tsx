import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
  Modal,
  Image
} from 'react-native';
import { router } from 'expo-router';
import { Globe, Computer, ArrowLeft } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { ImageUploadItem } from '@/types/Product';

const BURGUNDY = '#400605';

export default function TowebScreen() {
  const [selectedImages, setSelectedImages] = useState<ImageUploadItem[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [url, setUrl] = useState('https://sandyspace.com');

  const webViewRef = useRef<WebView>(null)
  const gotoWeb = async () => {
    setUrl('https://sandyspace.com');
    setIsModalVisible(true);
  };

  const gotoDash = async () => {
    setUrl('https://sandyspace.com/dashboard');
    setIsModalVisible(true);
  };

  const handleMessage = () => {

  }

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
          <Text style={styles.instructionTitle}>Acceder directement au web</Text>
        </View>
        {/* Boutons de sélection d'images */}
        <View style={styles.buttonSection}>
          <TouchableOpacity style={styles.primaryButton} onPress={gotoWeb}>
            <Globe size={24} color="white" />
            <Text style={styles.primaryButtonText}>Aller au Siteweb </Text>
          </TouchableOpacity>
          {Platform.OS !== 'web' && (
            <TouchableOpacity style={styles.secondaryButton} onPress={gotoDash}>
              <Computer size={24} color={BURGUNDY} />
              <Text style={styles.secondaryButtonText}>Aller au Tableau de board</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal
              visible={isModalVisible}
              animationType="slide"
              presentationStyle="formSheet"
              onRequestClose={() => setIsModalVisible(false)}
            >
                <WebView
                  ref={webViewRef}
                  source={{ uri: url }}
                  style={styles.webView}
                  onMessage={handleMessage}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  startInLoadingState={true}
                  mixedContentMode="compatibility"
                  allowsInlineMediaPlayback={true}
                  mediaPlaybackRequiresUserAction={false}
                />
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
  webView: {
    flex: 1
  }
});