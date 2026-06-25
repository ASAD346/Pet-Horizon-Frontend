import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
// @ts-ignore
import ReactDOM from 'react-dom';

interface SafeModalProps {
  visible: boolean;
  onRequestClose?: () => void;
  children: React.ReactNode;
  transparent?: boolean;
  animationType?: 'none' | 'slide' | 'fade';
}

export function SafeModal({
  visible,
  children,
}: SafeModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!visible || !mounted) return null;

  return ReactDOM.createPortal(
    <View style={[StyleSheet.absoluteFill, styles.webContainer]}>
      {children}
    </View>,
    document.body
  );
}

const styles = StyleSheet.create({
  webContainer: {
    zIndex: 99999,
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
