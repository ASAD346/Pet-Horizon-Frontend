import React from 'react';
import { Modal } from 'react-native';

interface SafeModalProps {
  visible: boolean;
  onRequestClose?: () => void;
  children: React.ReactNode;
  transparent?: boolean;
  animationType?: 'none' | 'slide' | 'fade';
}

export function SafeModal({
  visible,
  onRequestClose,
  children,
  transparent = true,
  animationType = 'none',
}: SafeModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={transparent}
      animationType={animationType}
      onRequestClose={onRequestClose}
    >
      {children}
    </Modal>
  );
}
