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
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eye,
  EyeOff,
  Type,
} from 'lucide-react-native';

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

  const editorHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 16px;
                line-height: 1.5;
                padding: 12px;
                background: white;
            }
            
            .toolbar {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                padding: 12px;
                border-bottom: 1px solid #eee;
                background: #f8f9fa;
                position: sticky;
                top: 0;
                z-index: 100;
            }
            
            .toolbar button {
                background: white;
                border: 1px solid #ddd;
                border-radius: 6px;
                padding: 8px;
                min-width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
            }
            
            .toolbar button:hover {
                background: #f0f0f0;
            }
            
            .toolbar button.active {
                background: ${BURGUNDY};
                color: white;
                border-color: ${BURGUNDY};
            }
            
            .toolbar select {
                border: 1px solid #ddd;
                border-radius: 6px;
                padding: 8px;
                background: white;
                font-size: 14px;
            }
            
            .editor-container {
                position: relative;
                min-height: 200px;
            }
            
            .editor {
                min-height: 200px;
                padding: 16px;
                border: none;
                outline: none;
                font-size: 16px;
                line-height: 1.5;
                background: white;
            }
            
            .editor:empty:before {
                content: attr(data-placeholder);
                color: #999;
                font-style: italic;
            }
            
            .editor h1 { font-size: 2em; font-weight: bold; margin: 0.5em 0; }
            .editor h2 { font-size: 1.5em; font-weight: bold; margin: 0.5em 0; }
            .editor h3 { font-size: 1.25em; font-weight: bold; margin: 0.5em 0; }
            .editor h4 { font-size: 1.1em; font-weight: bold; margin: 0.5em 0; }
            .editor p { margin: 0.5em 0; }
            .editor ul, .editor ol { padding-left: 2em; margin: 0.5em 0; }
            .editor li { margin: 0.25em 0; }
            .editor blockquote {
                border-left: 4px solid #ddd;
                padding-left: 1em;
                margin: 1em 0;
                font-style: italic;
                color: #666;
            }
            .editor a { color: #007AFF; text-decoration: underline; }
            .editor img { max-width: 100%; height: auto; margin: 0.5em 0; }
            
            .preview {
                padding: 16px;
                background: #f8f9fa;
                border-radius: 8px;
                margin: 16px;
                min-height: 200px;
            }
            
            .char-count {
                position: absolute;
                bottom: 8px;
                right: 12px;
                font-size: 12px;
                color: #666;
                background: rgba(255, 255, 255, 0.9);
                padding: 4px 8px;
                border-radius: 4px;
            }
            
            .char-count.exceeded {
                color: #dc3545;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="toolbar">
            <button onclick="execCmd('bold')" id="boldBtn" title="Gras">
                <strong>B</strong>
            </button>
            <button onclick="execCmd('italic')" id="italicBtn" title="Italique">
                <em>I</em>
            </button>
            <button onclick="execCmd('underline')" id="underlineBtn" title="Souligné">
                <u>U</u>
            </button>
            
            <div style="width: 1px; height: 20px; background: #ddd; margin: 0 4px;"></div>
            
            <select onchange="execCmd('formatBlock', this.value); this.value='';">
                <option value="">Style</option>
                <option value="h1">Titre 1</option>
                <option value="h2">Titre 2</option>
                <option value="h3">Titre 3</option>
                <option value="p">Paragraphe</option>
            </select>
            
            <div style="width: 1px; height: 20px; background: #ddd; margin: 0 4px;"></div>
            
            <button onclick="execCmd('justifyLeft')" title="Aligner à gauche">◀</button>
            <button onclick="execCmd('justifyCenter')" title="Centrer">▬</button>
            <button onclick="execCmd('justifyRight')" title="Aligner à droite">▶</button>
            
            <div style="width: 1px; height: 20px; background: #ddd; margin: 0 4px;"></div>
            
            <button onclick="execCmd('insertUnorderedList')" title="Liste à puces">•</button>
            <button onclick="execCmd('insertOrderedList')" title="Liste numérotée">1.</button>
            
            <div style="width: 1px; height: 20px; background: #ddd; margin: 0 4px;"></div>
            
            <button onclick="insertLink()" title="Lien">🔗</button>
            <button onclick="execCmd('formatBlock', 'blockquote')" title="Citation">"</button>
            
            <div style="width: 1px; height: 20px; background: #ddd; margin: 0 4px;"></div>
            
            <button onclick="togglePreview()" id="previewBtn" title="Aperçu">👁</button>
        </div>
        
        <div class="editor-container">
            <div 
                id="editor" 
                class="editor" 
                contenteditable="true" 
                data-placeholder="${placeholder}"
                oninput="handleInput()"
                onkeydown="handleKeyDown(event)"
            ></div>
            
            <div id="preview" class="preview" style="display: none;">
                <h3 style="margin-bottom: 16px; color: #666;">Aperçu:</h3>
                <div id="previewContent"></div>
            </div>
            
            <div id="charCount" class="char-count">0/${maxLength}</div>
        </div>

        <script>
            let isPreviewMode = false;
            
            // Initialize editor with content
            document.getElementById('editor').innerHTML = \`${value.replace(/`/g, '\\`')}\`;
            updateCharCount();
            
            function execCmd(command, value = null) {
                document.execCommand(command, false, value);
                document.getElementById('editor').focus();
                handleInput();
            }
            
            function insertLink() {
                const url = prompt('Entrer l\\'URL:');
                if (url) {
                    execCmd('createLink', url);
                }
            }
            
            function togglePreview() {
                isPreviewMode = !isPreviewMode;
                const editor = document.getElementById('editor');
                const preview = document.getElementById('preview');
                const previewBtn = document.getElementById('previewBtn');
                const previewContent = document.getElementById('previewContent');
                
                if (isPreviewMode) {
                    editor.style.display = 'none';
                    preview.style.display = 'block';
                    previewBtn.innerHTML = '✏️';
                    previewBtn.title = 'Éditer';
                    previewContent.innerHTML = editor.innerHTML || '<p style="color: #999;">Aucun contenu à prévisualiser</p>';
                } else {
                    editor.style.display = 'block';
                    preview.style.display = 'none';
                    previewBtn.innerHTML = '👁';
                    previewBtn.title = 'Aperçu';
                    editor.focus();
                }
            }
            
            function handleInput() {
                const content = document.getElementById('editor').innerHTML;
                updateCharCount();
                
                // Send content to React Native
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'contentChange',
                    content: content
                }));
            }
            
            function updateCharCount() {
                const editor = document.getElementById('editor');
                const charCount = document.getElementById('charCount');
                const textContent = editor.textContent || '';
                const count = textContent.length;
                
                charCount.textContent = count + '/${maxLength}';
                charCount.className = count > ${maxLength} ? 'char-count exceeded' : 'char-count';
            }
            
            function handleKeyDown(event) {
                // Handle keyboard shortcuts
                if (event.ctrlKey || event.metaKey) {
                    switch (event.key) {
                        case 'b':
                            event.preventDefault();
                            execCmd('bold');
                            break;
                        case 'i':
                            event.preventDefault();
                            execCmd('italic');
                            break;
                        case 'u':
                            event.preventDefault();
                            execCmd('underline');
                            break;
                    }
                }
            }
            
            // Update button states based on selection
            document.addEventListener('selectionchange', function() {
                updateButtonStates();
            });
            
            document.getElementById('editor').addEventListener('click', function() {
                updateButtonStates();
            });
            
            function updateButtonStates() {
                const boldBtn = document.getElementById('boldBtn');
                const italicBtn = document.getElementById('italicBtn');
                const underlineBtn = document.getElementById('underlineBtn');
                
                boldBtn.className = document.queryCommandState('bold') ? 'active' : '';
                italicBtn.className = document.queryCommandState('italic') ? 'active' : '';
                underlineBtn.className = document.queryCommandState('underline') ? 'active' : '';
            }
        </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'contentChange') {
        setCurrentHtml(data.content);
        onChangeText(data.content);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const handleSave = () => {
    onChangeText(currentHtml);
    setIsModalVisible(false);
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  };

  const previewText = stripHtml(currentHtml);
  const displayText = previewText.length > 100 
    ? previewText.substring(0, 100) + '...' 
    : previewText || placeholder;

  return (
    <View>
      <TouchableOpacity
        style={styles.editorButton}
        onPress={() => setIsModalVisible(true)}
      >
        <View style={styles.editorButtonContent}>
          <Type size={20} color={BURGUNDY} />
          <Text style={styles.editorButtonText}>
            {currentHtml ? 'Modifier la description' : 'Ajouter une description'}
          </Text>
        </View>
        <Text style={styles.editorPreview} numberOfLines={2}>
          {displayText}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Éditeur de description</Text>
            
            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Sauvegarder</Text>
            </TouchableOpacity>
          </View>

          <WebView
            ref={webViewRef}
            source={{ html: editorHtml }}
            style={styles.webView}
            onMessage={handleMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            mixedContentMode="compatibility"
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
          />
        </View>
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