import React, { useCallback, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { log } from '@/lib/log';
import { LoginTheme } from '../../constants/theme';
import { AppText } from '@/components/ui/AppText';
import { PhotoPickerBottomSheet } from '@/components/shared/PhotoPickerBottomSheet';

interface PetPhotoPickerProps {
  imageUri?: string | null;
  onImageChange?: (uri: string | null) => void;
}

export function PetPhotoPicker({ imageUri, onImageChange }: PetPhotoPickerProps) {
  const [isModalVisible, setModalVisible] = useState(false);

  const applyPickedUri = useCallback(
    (uri: string) => {
      onImageChange?.(uri);
      log.ok('AddPet', 'Photo selected', { uri: uri.slice(0, 48) + '…' });
    },
    [onImageChange],
  );

  const pickFromLibrary = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      log.fail('AddPet', 'Photo library permission denied');
      Alert.alert(
        'Photos access',
        'Allow photo library access in Settings to choose a pet picture.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      applyPickedUri(result.assets[0].uri);
    }
  }, [applyPickedUri]);

  const pickFromCamera = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      log.fail('AddPet', 'Camera permission denied');
      Alert.alert('Camera access', 'Allow camera access in Settings to take a pet photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      applyPickedUri(result.assets[0].uri);
    }
  }, [applyPickedUri]);

  const handlePress = useCallback(() => {
    if (Platform.OS === 'web') {
      if (imageUri) {
        const replace = window.confirm('Click OK to choose a new photo, or Cancel to remove the current photo.');
        if (replace) {
          void pickFromLibrary();
        } else {
          onImageChange?.(null);
          log.info('AddPet', 'Photo removed');
        }
      } else {
        void pickFromLibrary();
      }
      return;
    }

    setModalVisible(true);
  }, [imageUri, onImageChange, pickFromLibrary]);

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity style={styles.circle} onPress={handlePress} activeOpacity={0.8}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} contentFit="cover" />
        ) : (
          <Ionicons name="camera" size={28} color={LoginTheme.green} />
        )}
        <View style={styles.addBadge}>
          <Ionicons name={imageUri ? 'pencil' : 'add'} size={14} color={LoginTheme.footerText} />
        </View>
      </TouchableOpacity>

      <PhotoPickerBottomSheet
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onTakePhoto={() => void pickFromCamera()}
        onChooseFromLibrary={() => void pickFromLibrary()}
        onRemovePhoto={imageUri ? () => {
          onImageChange?.(null);
          log.info('AddPet', 'Photo removed');
        } : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginBottom: 12,
  },
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#5CB35D',
    backgroundColor: 'rgba(92, 179, 93, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
  },
  addBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#5CB35D',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
