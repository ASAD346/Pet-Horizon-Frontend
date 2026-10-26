import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';
import type { HealthTimelineEvent } from '@/services/pets/healthCardApi';

export type HealthCategory = 'all' | 'vaccination' | 'medicine' | 'grooming' | 'vet_visit';

interface HealthTimelineSectionProps {
  timeline: HealthTimelineEvent[];
  selectedCategory: HealthCategory;
  onSelectCategory: (category: HealthCategory) => void;
  categoryCounts?: Record<string, number>;
  petName?: string;
}

const CATEGORY_CHIPS: { id: HealthCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'All Records', icon: 'format-list-bulleted' },
  { id: 'vaccination', label: 'Vaccines', icon: 'needle' },
  { id: 'medicine', label: 'Medicines', icon: 'pill' },
  { id: 'grooming', label: 'Grooming', icon: 'content-cut' },
  { id: 'vet_visit', label: 'Vet Visits', icon: 'doctor' },
];

function getCategoryConfig(category: string) {
  switch (category) {
    case 'vaccination':
      return {
        icon: 'needle',
        color: '#673AB7',
        bg: '#EDE7F6',
        label: 'Vaccine',
      };
    case 'medicine':
      return {
        icon: 'pill',
        color: '#1976D2',
        bg: '#E3F2FD',
        label: 'Medicine',
      };
    case 'grooming':
      return {
        icon: 'content-cut',
        color: '#C2185B',
        bg: '#FCE4EC',
        label: 'Grooming',
      };
    case 'vet_visit':
      return {
        icon: 'doctor',
        color: '#00796B',
        bg: '#E0F2F1',
        label: 'Vet Visit',
      };
    default:
      return {
        icon: 'medical-bag',
        color: '#455A64',
        bg: '#ECEFF1',
        label: 'Care Record',
      };
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'completed':
      return { bg: '#E8F5E9', text: '#2E7D32', label: 'Completed' };
    case 'overdue':
      return { bg: '#FFEBEE', text: '#C62828', label: 'Overdue' };
    case 'active':
      return { bg: '#E3F2FD', text: '#1565C0', label: 'Active Course' };
    default:
      return { bg: '#FFF8E1', text: '#F57F17', label: 'Scheduled' };
  }
}

export function HealthTimelineSection({
  timeline,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  petName = 'your pet',
}: HealthTimelineSectionProps) {
  const filteredEvents = React.useMemo(() => {
    if (selectedCategory === 'all') return timeline;
    return timeline.filter((e) => e.category === selectedCategory);
  }, [timeline, selectedCategory]);

  return (
    <View style={styles.container}>
      {/* Section Title */}
      <View style={styles.headerRow}>
        <AppText variant="h3" weight="800" color="#0E3821">
          Medical & Care History
        </AppText>
        <AppText variant="caption" color="#64748B">
          {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
        </AppText>
      </View>

      {/* Filter Chips Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
      >
        {CATEGORY_CHIPS.map((chip) => {
          const isSelected = selectedCategory === chip.id;
          const count = categoryCounts ? categoryCounts[chip.id] : undefined;

          return (
            <TouchableOpacity
              key={chip.id}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => onSelectCategory(chip.id)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={chip.icon as any}
                size={14}
                color={isSelected ? '#FFFFFF' : '#475569'}
              />
              <AppText
                variant="caption"
                weight={isSelected ? '800' : '600'}
                color={isSelected ? '#FFFFFF' : '#475569'}
                style={styles.chipText}
              >
                {chip.label}
                {count !== undefined && count > 0 ? ` (${count})` : ''}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Timeline Event Feed */}
      {filteredEvents.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={32} color="#5CB35D" />
          </View>
          <AppText variant="bodySmall" weight="700" color="#0E3821" style={styles.emptyTitle}>
            No Records in this Category
          </AppText>
          <AppText variant="caption" color="#64748B" style={styles.emptySubtitle}>
            Administered vaccines, medications, and care logs for {petName} will appear here chronologically.
          </AppText>
        </View>
      ) : (
        <View style={styles.timelineList}>
          {filteredEvents.map((item, index) => {
            const cfg = getCategoryConfig(item.category);
            const sStyle = getStatusStyle(item.status);
            const dateObj = new Date(item.date);
            const dateStr = !isNaN(dateObj.getTime())
              ? dateObj.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recent';

            return (
              <View key={item.id || index} style={styles.timelineItem}>
                {/* Left Connector Line & Icon Node */}
                <View style={styles.leftColumn}>
                  <View style={[styles.iconCircle, { backgroundColor: cfg.bg }]}>
                    <MaterialCommunityIcons name={cfg.icon as any} size={16} color={cfg.color} />
                  </View>
                  {index < filteredEvents.length - 1 && <View style={styles.verticalLine} />}
                </View>

                {/* Right Event Card */}
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={styles.titleArea}>
                      <AppText variant="bodySmall" weight="800" color="#0E3821" numberOfLines={1}>
                        {item.title}
                      </AppText>
                      <AppText variant="caption" color="#64748B" style={styles.dateLabel}>
                        {dateStr}
                      </AppText>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: sStyle.bg }]}>
                      <AppText variant="caption" weight="700" color={sStyle.text}>
                        {sStyle.label}
                      </AppText>
                    </View>
                  </View>

                  {/* Dose / Administration info */}
                  {item.dose && (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="information-outline" size={12} color="#1565C0" />
                      <AppText variant="caption" weight="700" color="#1565C0" style={styles.detailText}>
                        Dose: {item.dose}
                      </AppText>
                    </View>
                  )}

                  {/* Notes / Description */}
                  {item.notes ? (
                    <AppText variant="caption" color="#475569" style={styles.notesText} numberOfLines={2}>
                      {item.notes}
                    </AppText>
                  ) : item.description ? (
                    <AppText variant="caption" color="#475569" style={styles.notesText} numberOfLines={2}>
                      {item.description}
                    </AppText>
                  ) : null}

                  {/* Administered by */}
                  {item.administeredBy && (
                    <AppText variant="caption" color="#94A3B8" style={styles.adminText}>
                      Recorded by: {item.administeredBy}
                    </AppText>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  chipsScroll: {
    gap: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  chipActive: {
    backgroundColor: '#0E3821',
    borderColor: '#0E3821',
  },
  chipText: {
    fontSize: 12,
  },
  timelineList: {
    marginTop: Spacing.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  leftColumn: {
    alignItems: 'center',
    width: 32,
    marginRight: Spacing.sm,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
  },
  cardContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E8ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  titleArea: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  dateLabel: {
    fontSize: 11,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  detailText: {
    fontSize: 11,
  },
  notesText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
  },
  adminText: {
    fontSize: 10,
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8ECEF',
    marginTop: Spacing.sm,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
  },
});
