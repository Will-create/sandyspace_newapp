import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Globe } from 'lucide-react-native';

const BURGUNDY = '#400605';

interface FloatingWebButtonProps {
  onPress: () => void;
}

export default function FloatingWebButton({ onPress }: FloatingWebButtonProps) {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress}>
      <Globe size={28} color="white" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 32,
    backgroundColor: BURGUNDY,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
});