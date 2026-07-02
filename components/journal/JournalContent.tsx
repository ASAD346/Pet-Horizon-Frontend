import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { useActivePet } from '@/hooks/useActivePet';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchJournalEntries } from '@/services/journal/journalApi';
import { usePetPermissions } from '@/hooks/usePetPermissions';
import {
  buildDateStrip,
  extractPhotoUrls,
  filterEntriesByDate,
  findPhotoUploadTarget,
  formatMonthLabel,
  isSameCalendarDay,
  mapEntryToTimelineEvent,
  parseDateKey,
  shiftWeekStart,
  startOfWeek,
  toDateKey,
} from '@/lib/journal/journalMappers';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { getErrorMessage } from '@/lib/api/errors';
import { createJournalEntry, deleteJournalEntry, updateJournalEntry } from '@/services/journal/journalApi';
import { uploadJournalImage } from '@/services/journal/uploadJournalImage';
import { ActivityTimelineSection } from './ActivityTimelineSection';
import { JournalEntryEditSheet } from './JournalEntryEditSheet';
import { JournalCategoryChips } from './JournalCategoryChips';
import { JournalDateStrip } from './JournalDateStrip';
import { JournalMonthHeader } from './JournalMonthHeader';
import { JOURNAL_CATEGORY_CHIPS, type JournalCategory } from './journalData';
import { TodaysPhotosSection, type JournalPhoto } from './TodaysPhotosSection';
import { JournalTheme, Spacing } from '../../constants/theme';
import { SkeletonJournalScreen } from '@/components/ui/skeletons';

interface JournalContentProps {
  active?: boolean;
}

export function JournalContent({ active = true }: JournalContentProps) {
  const { token, user } = useAuth();
  const { pet, loading: petLoading } = useActivePet(token);
  const { canViewJournal, canEditJournal, accessBannerMessage } = usePetPermissions(
    token,
    pet,
    user?._id,
  );
  const queryClient = useQueryClient();
  const { data: journalData, isFetching: loading, error, refetch: reload } = useQuery({
    queryKey: ['journalEntries', pet?._id],
    queryFn: async () => {
      if (!token || !pet?._id) return { items: [], total: 0 };
      return fetchJournalEntries(token, pet._id, 1, 100);
    },
    enabled: active && Boolean(token) && Boolean(pet?._id),
    staleTime: 0,
  });
  
  const entries = journalData?.items ?? [];
  const { showErrorToast } = useToast();

  useEffect(() => {
    if (error) {
      showErrorToast(getErrorMessage(error));
    }
  }, [error, showErrorToast]);

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedDateId, setSelectedDateId] = useState(() => toDateKey(new Date()));
  const [category, setCategory] = useState<JournalCategory>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editEntryId, setEditEntryId] = useState<string | null>(null);
  const [activePhoto, setActivePhoto] = useState<JournalPhoto | null>(null);

  const dateStrip = useMemo(() => buildDateStrip(weekStart), [weekStart]);
  const selectedDate = useMemo(() => parseDateKey(selectedDateId), [selectedDateId]);
  const monthLabel = useMemo(() => formatMonthLabel(selectedDate), [selectedDate]);

  const dayEntries = useMemo(
    () => filterEntriesByDate(entries, selectedDateId),
    [entries, selectedDateId],
  );

  const editEntry = useMemo(
    () => (editEntryId ? dayEntries.find((entry) => entry._id === editEntryId) ?? null : null),
    [editEntryId, dayEntries],
  );

  const timelineEvents = useMemo(
    () => dayEntries.map(mapEntryToTimelineEvent),
    [dayEntries],
  );

  const photos = useMemo(() => {
    return dayEntries
      .filter((entry) => entry.imagePath)
      .map((entry) => ({
        uri: resolveMediaUrl(entry.imagePath!)!,
        entryId: entry._id,
        entry,
      }))
      .filter((p) => p.uri);
  }, [dayEntries]);

  const handleDeletePhoto = useCallback((photo: JournalPhoto) => {
    if (!token) return;
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo from the journal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const entry = photo.entry;
              // If it's a general entry created specifically for the photo, delete the entry itself.
              if (
                entry.activityType === 'General' &&
                (entry.note === 'Journal photo' || !entry.note)
              ) {
                await deleteJournalEntry(token, entry._id);
              } else {
                // Otherwise, clear the imagePath but keep the entry.
                await updateJournalEntry(token, entry._id, { imagePath: null });
              }
              setActivePhoto(null);
              await queryClient.invalidateQueries({ queryKey: ['journalEntries', pet?._id] });
            } catch (err) {
              showErrorToast(getErrorMessage(err));
            }
          },
        },
      ]
    );
  }, [token, queryClient, pet?._id, showErrorToast]);

  const isSelectedToday = isSameCalendarDay(selectedDate, new Date());
  const canAddPhoto = isSelectedToday && canEditJournal;

  useEffect(() => {
    if (!dateStrip.some((item) => item.id === selectedDateId)) {
      setSelectedDateId(dateStrip[0]?.id ?? toDateKey(new Date()));
    }
  }, [dateStrip, selectedDateId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const handlePreviousWeek = useCallback(() => {
    setWeekStart((current) => shiftWeekStart(current, -1));
  }, []);

  const handleNextWeek = useCallback(() => {
    setWeekStart((current) => shiftWeekStart(current, 1));
  }, []);

  const handleAddPhoto = useCallback(async () => {
    if (!token || !pet?._id) {
      Alert.alert('Journal', 'Select a pet before adding a photo.');
      return;
    }
    if (!isSelectedToday) {
      Alert.alert('Journal', 'Photos can only be added for today.');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photos access', 'Allow photo library access to add journal photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]?.uri) return;

    setUploadingPhoto(true);
    try {
      let target = findPhotoUploadTarget(dayEntries);
      if (!target) {
        target = await createJournalEntry(token, {
          petId: pet._id,
          activityType: 'General',
          note: 'Journal photo',
        });
      }
      await uploadJournalImage(token, target._id, result.assets[0].uri);
      await queryClient.invalidateQueries({ queryKey: ['journalEntries', pet?._id] });
    } catch (err) {
      showErrorToast(getErrorMessage(err));
    } finally {
      setUploadingPhoto(false);
    }
  }, [token, pet?._id, isSelectedToday, dayEntries, reload]);

  if (!petLoading && !pet) {
    return (
      <View style={styles.messageWrap}>
        <AuthInfoBanner message="Add a pet from the Home tab to start viewing their activity journal." />
      </View>
    );
  }

  if (!petLoading && pet && !canViewJournal) {
    return (
      <View style={styles.messageWrap}>
        <AuthInfoBanner message="You don't have journal access for this pet. Ask the owner to update your permissions." />
      </View>
    );
  }

  const isPremium = user?.premiumStatus === 'premium';
  const themeColor = isPremium ? '#184F2E' : '#5CB35D';

  if (loading && entries.length === 0) {
    return <SkeletonJournalScreen />;
  }

  return (
    <>
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={themeColor} />
      }
    >
      {accessBannerMessage ? (
        <View style={styles.messageWrap}>
          <AuthInfoBanner message={accessBannerMessage} />
        </View>
      ) : null}

      <JournalMonthHeader
        monthLabel={monthLabel}
        onPrevious={handlePreviousWeek}
        onNext={handleNextWeek}
      />
      <JournalDateStrip
        dates={dateStrip}
        selectedId={selectedDateId}
        onSelect={setSelectedDateId}
        themeColor={themeColor}
      />
      <JournalCategoryChips
        chips={JOURNAL_CATEGORY_CHIPS}
        selected={category}
        onSelect={setCategory}
        themeColor={themeColor}
      />
      <ActivityTimelineSection
        events={timelineEvents}
        categoryFilter={category}
        onEventPress={canEditJournal ? setEditEntryId : undefined}
      />
      <TodaysPhotosSection
        title={isSelectedToday ? "Today's Photos" : 'Photos'}
        photos={photos}
        canAddPhoto={canAddPhoto}
        uploading={uploadingPhoto}
        onAddPhoto={handleAddPhoto}
        onPhotoPress={setActivePhoto}
        onDeletePhoto={handleDeletePhoto}
      />
    </ScrollView>
    <JournalEntryEditSheet
      visible={Boolean(editEntry)}
      entry={editEntry}
      token={token}
      onClose={() => setEditEntryId(null)}
      onSaved={() => queryClient.invalidateQueries({ queryKey: ['journalEntries', pet?._id] })}
    />
    <Modal
      visible={Boolean(activePhoto)}
      transparent
      animationType="fade"
      onRequestClose={() => setActivePhoto(null)}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.modalCloseArea} activeOpacity={1} onPress={() => setActivePhoto(null)} />
        {activePhoto && (
          <View style={styles.modalContent}>
            <Image source={{ uri: activePhoto.uri }} style={styles.modalImage} contentFit="contain" />
            <View style={styles.modalOverlay}>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setActivePhoto(null)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              {canEditJournal && (
                <TouchableOpacity style={styles.modalDeleteButton} onPress={() => handleDeletePhoto(activePhoto)}>
                  <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing.md,
  },
  messageWrap: {
    marginBottom: Spacing.md,
  },
  loaderWrap: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '90%',
    height: '75%',
  },
  modalOverlay: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDeleteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
