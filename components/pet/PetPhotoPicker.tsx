import React, { useCallback, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { log } from '@/lib/log';
import { LoginTheme } from '../../constants/theme';
import { AppText } from '@/components/ui/AppText';
import { PhotoPickerBottomSheet } from '@/components/shared/PhotoPickerBottomSheet';

interface PetPhotoPickerProps {
  imageUri?: string | null;
  onImageChange?: (uri: string | null) => void;
  readOnly?: boolean;
}

export function PetPhotoPicker({ imageUri, onImageChange, readOnly }: PetPhotoPickerProps) {
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

  // ── Read-only: plain avatar circle, no upload badge ──────────
  if (readOnly) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.avatarContainer}>
          <View style={styles.circle}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.preview} contentFit="cover" />
            ) : (
              <View style={styles.placeholderContainer}>
                <MaterialCommunityIcons name="paw" size={38} color="#81C784" />
              </View>
            )}
          </View>
          {/* No + badge in read-only mode */}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.avatarContainer}>
        <TouchableOpacity style={styles.circle} onPress={handlePress} activeOpacity={0.8}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.preview} contentFit="cover" />
          ) : (
            <View style={styles.placeholderContainer}>
              <MaterialCommunityIcons name="paw" size={38} color="#81C784" />
              <Ionicons name="camera" size={16} color="#2E7D32" style={styles.placeholderCamera} />
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.addBadge} onPress={handlePress} activeOpacity={0.9}>
          <Ionicons name={imageUri ? 'pencil' : 'add'} size={12} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

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
  avatarContainer: {
    position: 'relative',
    width: 96,
    height: 96,
  },
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  addBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#5CB35D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#E8F5E9',
  },
  placeholderCamera: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
  },
});
