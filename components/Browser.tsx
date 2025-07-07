import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';

const { width: screenWidth } = Dimensions.get('window');
const BURGUNDY = '#400605';

interface RichTextEditorProps {
  value: string;
  onChangeText: (html: string) => void;
  placeholder?: string;
  maxLength?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChangeText,
  placeholder = 'Entrer la description du produit...',
  maxLength = 5000
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [currentHtml, setCurrentHtml] = useState(value);
  const webViewRef = useRef<WebView>(null);


  const handleMessage = () => {

  };


  return ( 
    <View>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsModalVisible(false)}
      >
          <WebView
            ref={webViewRef}
            source={{ html: '' }}
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
    </View>
  );
};

const styles = StyleSheet.create({
  editorButton: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    backgroundColor: 'white',
    minHeight: 60,
  },
  editorButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  editorButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: BURGUNDY,
    fontWeight: '500',
  },
  editorPreview: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
    paddingHorizontal: 12,
    paddingBottom: 12,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    backgroundColor: '#f8f9fa',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#333',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  saveButton: {
    backgroundColor: BURGUNDY,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  webView: {
    flex: 1,
  },
});

export default RichTextEditor;