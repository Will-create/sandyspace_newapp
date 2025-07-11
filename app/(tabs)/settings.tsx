import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import {
  Lock,
  Key,
  User,
  Brain,
  Shield,
  Store,
  Smartphone,
  Mail,
  MapPin,
} from 'lucide-react-native';
import { StorageService } from '@/services/StorageService';

const BURGUNDY = '#400605';

interface Settings {
  pinLockEnabled: boolean;
  pin?: string;
  autoLockMinutes: number;
  openaiApiKey?: string;
  deepinfraApiKey?: string;
  aiProvider: 'openai' | 'deepinfra';
  aiEnabled: boolean;
  businessName?: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings>({
    pinLockEnabled: true,
    autoLockMinutes: 5,
    pin: '0033',
    aiProvider: 'openai',
    aiEnabled: true,
  });
  
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);
  const [businessModalVisible, setBusinessModalVisible] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');
  const [businessForm, setBusinessForm] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
  });
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadSettings();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadSettings = async () => {
    try {
      const storedSettings = await StorageService.getSettings();
      if (isMounted.current) {
        setSettings({ ...settings, ...storedSettings });
        setBusinessForm({
          businessName: storedSettings.businessName || '',
          ownerName: storedSettings.ownerName || '',
          phone: storedSettings.phone || '',
          email: storedSettings.email || '',
          address: storedSettings.address || '',
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      if (isMounted.current) {
        setSettings(updatedSettings);
      }
      await StorageService.updateSettings(updatedSettings);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
      Alert.alert('Erreur', 'Échec de la sauvegarde des paramètres. Veuillez réessayer.');
    }
  };

  const handlePinSetup = () => {
    if (settings.pinLockEnabled) {
      // Désactiver le PIN
      updateSettings({ pinLockEnabled: false, pin: undefined });
    } else {
      // Configurer le PIN
      setPinModalVisible(true);
    }
  };

  const savePinSettings = () => {
    if (newPin.length !== 4) {
      Alert.alert('PIN invalide', 'Le PIN doit contenir 4 chiffres.');
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert('PIN non concordant', 'Le PIN et la confirmation ne correspondent pas.');
      return;
    }

    updateSettings({ pinLockEnabled: true, pin: newPin });
    setPinModalVisible(false);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    Alert.alert('PIN configuré', 'Votre PIN a été configuré avec succès.');
  };

  const openApiKeyModal = (provider: 'openai' | 'deepinfra') => {
    const currentKey = provider === 'openai' ? settings.openaiApiKey : settings.deepinfraApiKey;
    setTempApiKey(currentKey || '');
    setApiKeyModalVisible(true);
  };

  const saveApiKey = () => {
    const updates: Partial<Settings> = {};
    if (settings.aiProvider === 'openai') {
      updates.openaiApiKey = tempApiKey;
    } else {
      updates.deepinfraApiKey = tempApiKey;
    }
    
    updateSettings(updates);
    setApiKeyModalVisible(false);
    setTempApiKey('');
    Alert.alert('Clé API sauvegardée', 'Votre clé API a été sauvegardée avec succès.');
  };

  const saveBusinessInfo = () => {
    updateSettings({
      businessName: businessForm.businessName,
      ownerName: businessForm.ownerName,
      phone: businessForm.phone,
      email: businessForm.email,
      address: businessForm.address,
    });
    setBusinessModalVisible(false);
    Alert.alert('Informations sauvegardées', 'Vos informations d\'entreprise ont été mises à jour.');
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightElement 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>{icon}</View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Paramètres</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Section Sécurité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sécurité</Text>
          
          <SettingItem
            icon={<Lock size={20} color={BURGUNDY} />}
            title="Verrouillage PIN"
            subtitle={settings.pinLockEnabled ? 'Activé' : 'Désactivé'}
            onPress={handlePinSetup}
            rightElement={
              <Switch
                value={settings.pinLockEnabled}
                onValueChange={handlePinSetup}
                trackColor={{ false: '#e5e5e5', true: BURGUNDY + '40' }}
                thumbColor={settings.pinLockEnabled ? BURGUNDY : '#f4f3f4'}
              />
            }
          />

          {settings.pinLockEnabled && (
            <SettingItem
              icon={<Shield size={20} color={BURGUNDY} />}
              title="Verrouillage automatique"
              subtitle={`Verrouiller après ${settings.autoLockMinutes} minutes`}
              rightElement={
                <View style={styles.autoLockControls}>
                  <TouchableOpacity
                    onPress={() => updateSettings({ autoLockMinutes: Math.max(1, settings.autoLockMinutes - 1) })}
                  >
                    <Text style={styles.controlButton}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.autoLockValue}>{settings.autoLockMinutes}m</Text>
                  <TouchableOpacity
                    onPress={() => updateSettings({ autoLockMinutes: settings.autoLockMinutes + 1 })}
                  >
                    <Text style={styles.controlButton}>+</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          )}
        </View>

        {/* Configuration IA
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration IA</Text>
          
          <SettingItem
            icon={<Brain size={20} color={BURGUNDY} />}
            title="Création de produits IA"
            subtitle={settings.aiEnabled ? 'Activée' : 'Désactivée'}
            rightElement={
              <Switch
                value={settings.aiEnabled}
                onValueChange={(value) => updateSettings({ aiEnabled: value })}
                trackColor={{ false: '#e5e5e5', true: BURGUNDY + '40' }}
                thumbColor={settings.aiEnabled ? BURGUNDY : '#f4f3f4'}
              />
            }
          />

          <SettingItem
            icon={<Key size={20} color={BURGUNDY} />}
            title="Clé API OpenAI"
            subtitle={settings.openaiApiKey ? 'Configurée' : 'Non définie'}
            onPress={() => openApiKeyModal('openai')}
          />

          <SettingItem
            icon={<Key size={20} color={BURGUNDY} />}
            title="Clé API DeepInfra"
            subtitle={settings.deepinfraApiKey ? 'Configurée' : 'Non définie'}
            onPress={() => openApiKeyModal('deepinfra')}
          />
        </View> */}

        {/* Informations de l'entreprise */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations de l'entreprise</Text>
          
          <SettingItem
            icon={<Store size={20} color={BURGUNDY} />}
            title="Profil de l'entreprise"
            subtitle={settings.businessName || 'Non configuré'}
            onPress={() => setBusinessModalVisible(true)}
          />
        </View>
      </ScrollView>

      {/* Modal Configuration PIN */}
      <Modal
        visible={pinModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Configurer le verrouillage PIN</Text>
            
            <TextInput
              style={styles.pinInput}
              value={newPin}
              onChangeText={setNewPin}
              placeholder="Entrer un PIN à 4 chiffres"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />

            <TextInput
              style={styles.pinInput}
              value={confirmPin}
              onChangeText={setConfirmPin}
              placeholder="Confirmer le PIN"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={savePinSettings}
              >
                <Text style={styles.modalButtonText}>Sauvegarder le PIN</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setPinModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Clé API */}
      <Modal
        visible={apiKeyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setApiKeyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Configuration de la clé API</Text>
            
            <TextInput
              style={styles.apiKeyInput}
              value={tempApiKey}
              onChangeText={setTempApiKey}
              placeholder="Entrer votre clé API"
              secureTextEntry
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveApiKey}
              >
                <Text style={styles.modalButtonText}>Sauvegarder</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setApiKeyModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Informations de l'entreprise */}
      <Modal
        visible={businessModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBusinessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Informations de l'entreprise</Text>
            
            <View style={styles.formGroup}>
              <View style={styles.inputRow}>
                <Store size={16} color="#666" />
                <TextInput
                  style={styles.businessInput}
                  value={businessForm.businessName}
                  onChangeText={(text) => setBusinessForm({...businessForm, businessName: text})}
                  placeholder="Nom de l'entreprise"
                />
              </View>
              
              <View style={styles.inputRow}>
                <User size={16} color="#666" />
                <TextInput
                  style={styles.businessInput}
                  value={businessForm.ownerName}
                  onChangeText={(text) => setBusinessForm({...businessForm, ownerName: text})}
                  placeholder="Nom du propriétaire"
                />
              </View>
              
              <View style={styles.inputRow}>
                <Smartphone size={16} color="#666" />
                <TextInput
                  style={styles.businessInput}
                  value={businessForm.phone}
                  onChangeText={(text) => setBusinessForm({...businessForm, phone: text})}
                  placeholder="Numéro de téléphone"
                  keyboardType="phone-pad"
                />
              </View>
              
              <View style={styles.inputRow}>
                <Mail size={16} color="#666" />
                <TextInput
                  style={styles.businessInput}
                  value={businessForm.email}
                  onChangeText={(text) => setBusinessForm({...businessForm, email: text})}
                  placeholder="Adresse e-mail"
                  keyboardType="email-address"
                />
              </View>
              
              <View style={styles.inputRow}>
                <MapPin size={16} color="#666" />
                <TextInput
                  style={styles.businessInput}
                  value={businessForm.address}
                  onChangeText={(text) => setBusinessForm({...businessForm, address: text})}
                  placeholder="Adresse de l'entreprise"
                  multiline
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveBusinessInfo}
              >
                <Text style={styles.modalButtonText}>Sauvegarder</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setBusinessModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: '#333',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333',
  },
  settingSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  autoLockControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: BURGUNDY,
    paddingHorizontal: 8,
  },
  autoLockValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#333',
    marginHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  pinInput: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
  },
  apiKeyInput: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 20,
    fontFamily: 'Inter-Regular',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  businessInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
  },
  modalButtons: {
    gap: 8,
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: BURGUNDY,
  },
  modalButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'white',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#666',
  },
});