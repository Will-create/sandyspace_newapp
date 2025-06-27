import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Vibration,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Lock, Delete } from 'lucide-react-native';
import { StorageService } from '@/services/StorageService';

const BURGUNDY = '#400605';

export default function PinLockScreen() {
  const [pin, setPin] = useState('');
  const [storedPin, setStoredPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadStoredPin();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadStoredPin = async () => {
    try {
      const settings = await StorageService.getSettings();
      if (settings.pin && isMounted.current) {
        setStoredPin(settings.pin);
      } else {
        // Aucun PIN défini, rediriger vers l'application principale
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du PIN:', error);
      router.replace('/(tabs)');
    }
  };

  const handleNumberPress = (number: string) => {
    if (isLocked || pin.length >= 4 || !isMounted.current) return;

    const newPin = pin + number;
    setPin(newPin);

    if (newPin.length === 4) {
      setTimeout(() => verifyPin(newPin), 100);
    }
  };

  const handleDelete = () => {
    if (isLocked || !isMounted.current) return;
    setPin(prev => prev.slice(0, -1));
  };

  const verifyPin = (enteredPin: string) => {
    if (!isMounted.current) return;
    
    if (enteredPin === storedPin) {
      // PIN correct, naviguer vers l'application principale
      router.replace('/(tabs)');
    } else {
      // PIN incorrect
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin('');

      if (Platform.OS !== 'web') {
        Vibration.vibrate(500);
      }

      if (newAttempts >= 5) {
        setIsLocked(true);
        Alert.alert(
          'Trop de tentatives',
          'L\'application est temporairement verrouillée. Veuillez réessayer plus tard.',
          [{ text: 'OK' }]
        );
        
        // Verrouiller pendant 30 secondes
        setTimeout(() => {
          if (isMounted.current) {
            setIsLocked(false);
            setAttempts(0);
          }
        }, 30000);
      } else {
        Alert.alert(
          'PIN incorrect',
          `${5 - newAttempts} tentatives restantes`,
          [{ text: 'OK' }]
        );
      }
    }
  };

  const renderPinDots = () => {
    return (
      <View style={styles.pinDotsContainer}>
        {[0, 1, 2, 3].map(index => (
          <View
            key={index}
            style={[
              styles.pinDot,
              index < pin.length && styles.pinDotFilled
            ]}
          />
        ))}
      </View>
    );
  };

  const renderKeypad = () => {
    const numbers = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'delete']
    ];

    return (
      <View style={styles.keypad}>
        {numbers.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((item, itemIndex) => {
              if (item === '') {
                return <View key={itemIndex} style={styles.keypadButton} />;
              }
              
              if (item === 'delete') {
                return (
                  <TouchableOpacity
                    key={itemIndex}
                    style={styles.keypadButton}
                    onPress={handleDelete}
                    disabled={isLocked}
                  >
                    <Delete size={24} color={isLocked ? '#ccc' : '#666'} />
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.keypadButton,
                    styles.numberButton,
                    isLocked && styles.disabledButton
                  ]}
                  onPress={() => handleNumberPress(item)}
                  disabled={isLocked}
                >
                  <Text style={[
                    styles.keypadButtonText,
                    isLocked && styles.disabledText
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.lockIcon}>
            <Lock size={48} color={BURGUNDY} />
          </View>
          <Text style={styles.title}>Entrer le PIN</Text>
          <Text style={styles.subtitle}>
            {isLocked 
              ? 'L\'application est temporairement verrouillée' 
              : 'Entrez votre PIN à 4 chiffres pour continuer'
            }
          </Text>
        </View>

        {renderPinDots()}
        {renderKeypad()}

        {attempts > 0 && !isLocked && (
          <Text style={styles.attemptsText}>
            {5 - attempts} tentatives restantes
          </Text>
        )}

        {isLocked && (
          <Text style={styles.lockText}>
            Réessayez dans 30 secondes
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  lockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
    gap: 16,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e5e5',
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: BURGUNDY,
    borderColor: BURGUNDY,
  },
  keypad: {
    width: '100%',
    maxWidth: 300,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  keypadButton: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButton: {
    backgroundColor: 'white',
    borderRadius: 36,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#f5f5f5',
  },
  keypadButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    color: '#333',
  },
  disabledText: {
    color: '#ccc',
  },
  attemptsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#f59e0b',
    marginTop: 24,
    textAlign: 'center',
  },
  lockText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#dc2626',
    marginTop: 24,
    textAlign: 'center',
  },
});