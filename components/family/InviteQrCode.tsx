import React from 'react';
import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { HomeTheme } from '@/constants/theme';

interface InviteQrCodeProps {
  value: string;
  size?: number;
}

/** QR encodes the app deep link so scanning opens Pet Horizon when installed. */
export function InviteQrCode({ value, size = 200 }: InviteQrCodeProps) {
  return (
    <View style={styles.wrap}>
      <QRCode
        value={value}
        size={size}
        color={HomeTheme.text}
        backgroundColor={HomeTheme.white}
        logo={require('../../assets/images/dog_qr_icon.png')}
        logoSize={size * 0.24}
        logoMargin={4}
        logoBorderRadius={10}
        logoBackgroundColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
});
