import React from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { HomeTheme, Radius, Spacing } from '@/constants/theme';
import { getTaskDisplayName } from '@/src/utils/taskMappings';
import type { RecentActivityItem } from './RecentActivitySection';

interface ActivityDetailSheetProps {
  visible: boolean;
  item: RecentActivityItem | null;
  onClose: () => void;
  isPremium?: boolean;
}

const CATEGORY_METADATA: Record<
  string,
  {
    label: string;
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    color: string;
    bg: string;
    border: string;
  }
> = {
  food: {
    label: 'Feeding Log',
    icon: 'silverware-fork-knife',
    color: '#D97706',
    bg: '#FEF3C7',
    border: '#FDE68A',
  },
  feeding: {
    label: 'Feeding Log',
    icon: 'silverware-fork-knife',
    color: '#D97706',
    bg: '#FEF3C7',
    border: '#FDE68A',
  },
  walk: {
    label: 'Walk Log',
    icon: 'paw',
    color: '#2563EB',
    bg: '#DBEAFE',
    border: '#BFDBFE',
  },
  medicine: {
    label: 'Medicine Log',
    icon: 'pill',
    color: '#9333EA',
    bg: '#F3E8FF',
    border: '#E9D5FF',
  },
  grooming: {
    label: 'Grooming Log',
    icon: 'content-cut',
    color: '#0D9488',
    bg: '#CCFBF1',
    border: '#99F6E4',
  },
  vaccination: {
    label: 'Vaccination Log',
    icon: 'needle',
    color: '#DB2777',
    bg: '#FCE7F3',
    border: '#FBCFE8',
  },
  general: {
    label: 'Journal Note',
    icon: 'notebook-outline',
    color: '#4B5563',
    bg: '#F3F4F6',
    border: '#E5E7EB',
  },
};

function formatRawTitle(text: string) {
  if (!text) return 'Activity Log';
  const cleaned = text.replace(/\s*\(\d+\s*min\)/gi, '').trim();
  if (cleaned.startsWith('added journal:')) {
    const detail = cleaned.replace(/^added journal:\s*/i, '');
    return `Journal: ${getTaskDisplayName(detail)}`;
  }
  if (cleaned.includes(':')) {
    const parts = cleaned.split(':');
    const prefix = parts[0].trim();
    const suffix = parts.slice(1).join(':').trim();
    return `${prefix}: ${getTaskDisplayName(suffix)}`;
  }
  return getTaskDisplayName(cleaned);
}

function formatDate(isoStr?: string): string {
  if (!isoStr) return 'Today';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return 'Today';
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Today';
  }
}

export function ActivityDetailSheet({
  visible,
  item,
  onClose,
  isPremium = false,
}: ActivityDetailSheetProps) {
  const insets = useSafeAreaInsets();

  if (!item) return null;

  const categoryKey = (item.category || 'general').toLowerCase();
  const meta = CATEGORY_METADATA[categoryKey] || CATEGORY_METADATA.general;
  const isSkipped = item.isSkipped;

  const displayTitle = formatRawTitle(item.actionText);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom + 12, 20),
            },
          ]}
        >
          {/* Top Drag Handle */}
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          {/* Header Row */}
          <View style={styles.header}>
            <View
              style={[
                styles.headerIconBadge,
                {
                  backgroundColor: item.bg || meta.bg,
                  borderColor: meta.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={item.icon || meta.icon}
                size={22}
                color={item.color || meta.color}
              />
            </View>

            <View style={styles.headerTextWrap}>
              <View style={styles.titleRow}>
                <AppText
                  style={styles.headerTitle}
                  weight="800"
                  color={HomeTheme.text}
                  numberOfLines={2}
                >
                  {displayTitle}
                </AppText>
              </View>

              <View style={styles.metaRow}>
                <AppText
                  style={styles.headerCategory}
                  weight="600"
                  color={item.color || meta.color}
                >
                  {meta.label}
                </AppText>
                <AppText style={styles.metaDot} color="#94A3B8">
                  •
                </AppText>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: isSkipped ? '#F3F4F6' : '#DCFCE7',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: isSkipped ? '#9CA3AF' : '#16A34A' },
                    ]}
                  />
                  <AppText
                    style={styles.statusText}
                    weight="700"
                    color={isSkipped ? '#4B5563' : '#15803D'}
                  >
                    {isSkipped ? 'Skipped' : 'Logged'}
                  </AppText>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.grid}>
              {/* Logged By */}
              <View style={styles.gridItem}>
                <View
                  style={[
                    styles.miniAvatar,
                    { backgroundColor: item.actorColor || '#5B9BD5' },
                  ]}
                >
                  {item.actorImage ? (
                    <Image
                      source={{ uri: item.actorImage }}
                      style={styles.miniAvatarImage}
                    />
                  ) : (
                    <Text style={styles.miniAvatarText}>
                      {item.actorInitial || 'U'}
                    </Text>
                  )}
                </View>
                <View style={styles.gridTextWrap}>
                  <AppText
                    style={styles.fieldLabel}
                    weight="700"
                    color={HomeTheme.textMuted}
                  >
                    Logged By
                  </AppText>
                  <AppText
                    style={styles.fieldValue}
                    weight="700"
                    color={HomeTheme.text}
                    numberOfLines={1}
                  >
                    {item.actorName}
                  </AppText>
                </View>
              </View>

              {/* Time */}
              <View style={styles.gridItem}>
                <View
                  style={[
                    styles.gridIconWrap,
                    { backgroundColor: 'rgba(37, 99, 235, 0.08)' },
                  ]}
                >
                  <Ionicons name="time-outline" size={15} color="#2563EB" />
                </View>
                <View style={styles.gridTextWrap}>
                  <AppText
                    style={styles.fieldLabel}
                    weight="700"
                    color={HomeTheme.textMuted}
                  >
                    Time
                  </AppText>
                  <AppText
                    style={styles.fieldValue}
                    weight="700"
                    color={HomeTheme.text}
                    numberOfLines={1}
                  >
                    {item.exactTime || item.time || 'Completed'}
                  </AppText>
                </View>
              </View>

              {/* Date */}
              <View style={styles.gridItem}>
                <View
                  style={[
                    styles.gridIconWrap,
                    { backgroundColor: 'rgba(13, 148, 136, 0.08)' },
                  ]}
                >
                  <Ionicons name="calendar-outline" size={15} color="#0D9488" />
                </View>
                <View style={styles.gridTextWrap}>
                  <AppText
                    style={styles.fieldLabel}
                    weight="700"
                    color={HomeTheme.textMuted}
                  >
                    Date
                  </AppText>
                  <AppText
                    style={styles.fieldValue}
                    weight="700"
                    color={HomeTheme.text}
                    numberOfLines={1}
                  >
                    {formatDate(item.createdAt)}
                  </AppText>
                </View>
              </View>

              {/* Duration or Relative Time */}
              {item.durationLabel || item.duration ? (
                <View style={styles.gridItem}>
                  <View
                    style={[
                      styles.gridIconWrap,
                      { backgroundColor: 'rgba(217, 119, 6, 0.08)' },
                    ]}
                  >
                    <Ionicons name="stopwatch-outline" size={15} color="#D97706" />
                  </View>
                  <View style={styles.gridTextWrap}>
                    <AppText
                      style={styles.fieldLabel}
                      weight="700"
                      color={HomeTheme.textMuted}
                    >
                      Duration
                    </AppText>
                    <AppText
                      style={styles.fieldValue}
                      weight="700"
                      color={HomeTheme.text}
                      numberOfLines={1}
                    >
                      {item.durationLabel || `${item.duration} min`}
                    </AppText>
                  </View>
                </View>
              ) : item.time ? (
                <View style={styles.gridItem}>
                  <View
                    style={[
                      styles.gridIconWrap,
                      { backgroundColor: 'rgba(100, 116, 139, 0.08)' },
                    ]}
                  >
                    <Ionicons name="hourglass-outline" size={15} color="#64748B" />
                  </View>
                  <View style={styles.gridTextWrap}>
                    <AppText
                      style={styles.fieldLabel}
                      weight="700"
                      color={HomeTheme.textMuted}
                    >
                      Status
                    </AppText>
                    <AppText
                      style={styles.fieldValue}
                      weight="700"
                      color={HomeTheme.text}
                      numberOfLines={1}
                    >
                      {item.time}
                    </AppText>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Note description block if extra detail exists */}
            {item.actionText ? (
              <View style={styles.notesBox}>
                <View style={styles.notesHeader}>
                  <Ionicons name="document-text-outline" size={14} color="#64748B" />
                  <AppText style={styles.notesLabel} weight="700" color="#64748B">
                    Activity Note
                  </AppText>
                </View>
                <AppText style={styles.notesText} weight="500" color="#334155">
                  {item.actionText}
                </AppText>
              </View>
            ) : null}
          </ScrollView>

          {/* Footer Action Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.dismissBtn,
                {
                  backgroundColor: isPremium ? '#D4A017' : '#3A8F3B',
                  borderColor: isPremium ? '#D4A017' : '#3A8F3B',
                },
              ]}
              onPress={onClose}
              activeOpacity={0.88}
            >
              <AppText variant="bodySmall" weight="800" color="#FFFFFF">
                Dismiss
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
    gap: 12,
  },
  headerIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16.5,
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerCategory: {
    fontSize: 12,
    lineHeight: 16,
  },
  metaDot: {
    fontSize: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    letterSpacing: 0.1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 14,
  },
  scrollArea: {
    maxHeight: 280,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  miniAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  miniAvatarImage: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  miniAvatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  gridIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTextWrap: {
    flex: 1,
    gap: 1,
  },
  fieldLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: 13,
    letterSpacing: -0.2,
  },
  notesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 6,
    marginTop: 8,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notesLabel: {
    fontSize: 11.5,
  },
  notesText: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 6,
  },
  dismissBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
    }),
  },
});
