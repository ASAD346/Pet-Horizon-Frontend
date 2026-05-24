import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { SheetHeroIllustration, SectionLabel } from '../sheets';
import { HomeTheme, Radius, Spacing } from '../../constants/theme';

const WALK_SLOTS = ['Morning', 'Afternoon', 'Evening', 'Night'] as const;
type WalkSlot = (typeof WALK_SLOTS)[number];

const Colors = {
  sheetBg: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.45)',
  label: '#9E9E9E',
  chipBg: '#F3F3F3',
  chipText: '#5A5A5A',
  inputBg: '#EFEFEF',
  inputText: '#3A3A3A',
  placeholder: '#9E9E9E',
  border: '#E8E8E8',
  title: '#1A1A1A',
};

interface LogWalkSheetProps {
  visible: boolean;
  onClose: () => void;
}

function InputWithSuffix({
  value,
  onChangeText,
  suffix,
  keyboardType = 'default',
}: {
  value: string;
  onChangeText: (t: string) => void;
  suffix: string;
  keyboardType?: 'default' | 'decimal-pad';
}) {
  return (
    <View style={styles.suffixInputWrap}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={styles.suffixInput}
      />
      <AppText variant="bodySmall" weight="600" color={Colors.label} style={styles.suffixText}>
        {suffix}
      </AppText>
    </View>
  );
}

export function LogWalkSheet({ visible, onClose }: LogWalkSheetProps) {
  const insets = useSafeAreaInsets();

  const [walkSlot, setWalkSlot] = useState<WalkSlot>('Evening');
  const [duration, setDuration] = useState('45');
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [distance, setDistance] = useState('1.5');
  const [routeNotes, setRouteNotes] = useState('');

  const handleSave = () => {
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.handle} />

            <View style={styles.header}>
              <AppText variant="h3" weight="800" color={Colors.title} style={styles.headerTitle}>
                Daily Walks
              </AppText>
              <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={Colors.chipText} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              <SheetHeroIllustration borderColor="#C8E6C9" backgroundColor="#F5F9F4" heartColor="#5CB35D" />

              <SectionLabel text="WHICH WALK?" />
              <View style={styles.chipRow}>
                {WALK_SLOTS.map((slot) => {
                  const selected = walkSlot === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => setWalkSlot(slot)}
                      activeOpacity={0.85}
                    >
                      <AppText
                        variant="bodySmall"
                        weight="600"
                        color={selected ? HomeTheme.white : Colors.chipText}
                      >
                        {slot}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.twoColRow}>
                <View style={styles.halfCol}>
                  <SectionLabel text="DURATION" />
                  <InputWithSuffix
                    value={duration}
                    onChangeText={setDuration}
                    suffix="min"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.halfCol}>
                  <SectionLabel text="NOTIFICATIONS" />
                  <TouchableOpacity
                    style={[styles.notifyBtn, notificationsOn && styles.notifyBtnOn]}
                    onPress={() => setNotificationsOn((v) => !v)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={notificationsOn ? 'notifications' : 'notifications-off-outline'}
                      size={20}
                      color={notificationsOn ? HomeTheme.white : Colors.chipText}
                    />
                    <AppText
                      variant="bodySmall"
                      weight="700"
                      color={notificationsOn ? HomeTheme.white : Colors.chipText}
                    >
                      {notificationsOn ? 'On' : 'Off'}
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>

              <SectionLabel text="DISTANCE" />
              <InputWithSuffix
                value={distance}
                onChangeText={setDistance}
                suffix="km"
                keyboardType="decimal-pad"
              />

              <SectionLabel text="ROUTE NOTES" />
              <TextInput
                value={routeNotes}
                onChangeText={setRouteNotes}
                placeholder="Park route, leash preference..."
                placeholderTextColor={Colors.placeholder}
                style={[styles.textInput, styles.notesInput]}
                multiline
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={styles.footer}>
              <AppButton
                title="Save Walk Schedule"
                onPress={handleSave}
                variant="success"
                size="md"
                style={styles.saveBtn}
                textStyle={styles.saveBtnText}
              />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.sheetBg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '92%',
    paddingTop: Spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D0D0',
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    lineHeight: 28,
    paddingRight: Spacing.sm,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.chipBg,
  },
  chipSelected: {
    backgroundColor: HomeTheme.green,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  halfCol: {
    flex: 1,
  },
  suffixInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    minHeight: 48,
  },
  suffixInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.inputText,
    fontWeight: '600',
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
  },
  suffixText: {
    marginLeft: Spacing.xs,
  },
  notifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    paddingVertical: 14,
    marginBottom: Spacing.md,
    minHeight: 48,
  },
  notifyBtnOn: {
    backgroundColor: HomeTheme.green,
  },
  textInput: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 14,
    color: Colors.inputText,
    fontWeight: '500',
    marginBottom: Spacing.md,
  },
  notesInput: {
    minHeight: 88,
    paddingTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.sheetBg,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  saveBtn: {
    width: '100%',
    borderRadius: Radius.full,
    backgroundColor: HomeTheme.green,
    minHeight: 52,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
