import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { Palette, Radius, Spacing } from '../../constants/theme';
import { useAppThemeColor } from '../sheets/useAppThemeColor';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type CalendarCell = {
  day: number;
  date: Date;
  inMonth: boolean;
};

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildCalendar(year: number, month: number): CalendarCell[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let i = firstWeekday - 1; i >= 0; i -= 1) {
    const day = daysInPrevMonth - i;
    cells.push({
      day,
      date: new Date(year, month - 1, day),
      inMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      day,
      date: new Date(year, month, day),
      inMonth: true,
    });
  }

  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      day: nextDay,
      date: new Date(year, month + 1, nextDay),
      inMonth: false,
    });
    nextDay += 1;
  }

  return cells;
}

interface ThemedDatePickerProps {
  visible: boolean;
  value: Date;
  title?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  useNativeModal?: boolean;
}

export function ThemedDatePicker({
  visible,
  value,
  title = 'Select Date',
  minimumDate,
  maximumDate,
  onClose,
  onConfirm,
  useNativeModal = false,
}: ThemedDatePickerProps) {
  const { accentColor } = useAppThemeColor();
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [viewMonth, setViewMonth] = useState(value.getMonth());
  const [selected, setSelected] = useState(value);

  useEffect(() => {
    if (visible) {
      setViewYear(value.getFullYear());
      setViewMonth(value.getMonth());
      setSelected(value);
    }
  }, [visible, value]);

  const min = minimumDate ? startOfDay(minimumDate) : null;
  const max = maximumDate ? startOfDay(maximumDate) : null;
  const cells = useMemo(() => buildCalendar(viewYear, viewMonth), [viewYear, viewMonth]);

  const goMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const isDisabled = (date: Date) => {
    const day = startOfDay(date).getTime();
    if (min && day < min.getTime()) return true;
    if (max && day > max.getTime()) return true;
    return false;
  };

  const canGoPrev = min
    ? viewYear > min.getFullYear() ||
      (viewYear === min.getFullYear() && viewMonth > min.getMonth())
    : true;

  const canGoNext = max
    ? viewYear < max.getFullYear() ||
      (viewYear === max.getFullYear() && viewMonth < max.getMonth())
    : true;

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const minYear = min ? min.getFullYear() : currentYear - 30;
    const maxYear = max ? max.getFullYear() : currentYear;
    const years: number[] = [];
    for (let y = maxYear; y >= minYear; y -= 1) {
      years.push(y);
    }
    return years;
  }, [min, max]);

  const handleDayPress = (date: Date) => {
    if (isDisabled(date)) return;
    setSelected(date);
    if (date.getMonth() !== viewMonth || date.getFullYear() !== viewYear) {
      setViewYear(date.getFullYear());
      setViewMonth(date.getMonth());
    }
  };

  if (!visible) return null;

  const content = (
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.sheetHeader}>
            <Ionicons name="calendar" size={20} color={accentColor} />
            <AppText variant="h3" weight="800" color="#1A2B4E">
              {title}
            </AppText>
          </View>

          <View style={styles.monthRow}>
            <TouchableOpacity
              style={[styles.navBtn, !canGoPrev && styles.navBtnDisabled]}
              onPress={() => canGoPrev && goMonth(-1)}
              disabled={!canGoPrev}
              hitSlop={12}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={canGoPrev ? '#1A2B4E' : Palette.gray[300]}
              />
            </TouchableOpacity>

            <AppText variant="body" weight="700" color="#1A2B4E">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </AppText>

            <TouchableOpacity
              style={[styles.navBtn, !canGoNext && styles.navBtnDisabled]}
              onPress={() => canGoNext && goMonth(1)}
              disabled={!canGoNext}
              hitSlop={12}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={canGoNext ? '#1A2B4E' : Palette.gray[300]}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.monthPickerRow}
          >
            {MONTH_NAMES.map((name, index) => {
              const disabled = Boolean(
                (min &&
                  viewYear === min.getFullYear() &&
                  index < min.getMonth()) ||
                (max &&
                  viewYear === max.getFullYear() &&
                  index > max.getMonth()),
              );
              const active = viewMonth === index;
              return (
                <TouchableOpacity
                  key={name}
                  style={[styles.pickerChip, active && { backgroundColor: accentColor, borderColor: accentColor }, disabled && styles.pickerChipDisabled]}
                  onPress={() => !disabled && setViewMonth(index)}
                  disabled={disabled}
                >
                  <AppText
                    variant="caption"
                    weight={active ? '700' : '600'}
                    color={active ? Palette.white : Palette.gray[700]}
                  >
                    {name.slice(0, 3)}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.yearPickerRow}
          >
            {yearOptions.map((year) => {
              const active = viewYear === year;
              return (
                <TouchableOpacity
                  key={year}
                  style={[styles.pickerChip, active && { backgroundColor: accentColor, borderColor: accentColor }]}
                  onPress={() => setViewYear(year)}
                >
                  <AppText
                    variant="caption"
                    weight={active ? '700' : '600'}
                    color={active ? Palette.white : Palette.gray[700]}
                  >
                    {year}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((label) => (
              <AppText
                key={label}
                variant="caption"
                weight="700"
                color={Palette.gray[400]}
                style={styles.weekLabel}
              >
                {label}
              </AppText>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((cell) => {
              const disabled = isDisabled(cell.date);
              const isSelected = isSameDay(cell.date, selected);
              const isToday = isSameDay(cell.date, new Date());

              return (
                <TouchableOpacity
                  key={`${cell.date.toISOString()}`}
                  style={styles.dayCell}
                  onPress={() => handleDayPress(cell.date)}
                  disabled={disabled}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.dayInner,
                      isSelected && { backgroundColor: accentColor, shadowColor: accentColor },
                      isToday && !isSelected && { borderWidth: 1.5, borderColor: accentColor },
                    ]}
                  >
                    <AppText
                      variant="bodySmall"
                      weight={isSelected ? '700' : '600'}
                      color={
                        disabled
                          ? Palette.gray[300]
                          : isSelected
                            ? Palette.white
                            : cell.inMonth
                              ? '#1A2B4E'
                              : Palette.gray[400]
                      }
                    >
                      {cell.day}
                    </AppText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <AppText variant="bodySmall" weight="700" color="#1A2B4E">
                Cancel
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: accentColor, shadowColor: accentColor }]}
              onPress={() => onConfirm(selected)}
              activeOpacity={0.85}
            >
              <AppText variant="bodySmall" weight="800" color={Palette.white}>
                Confirm
              </AppText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
  );

  if (useNativeModal) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        {content}
      </Modal>
    );
  }

  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 9999, elevation: 24 }]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 43, 78, 0.4)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    zIndex: 9999,
    elevation: 24,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    shadowColor: '#1A2B4E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 24,
    zIndex: 9999,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  monthPickerRow: {
    gap: 6,
    paddingBottom: 6,
  },
  yearPickerRow: {
    gap: 6,
    paddingBottom: Spacing.sm,
  },
  pickerChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FCFCFD',
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    minWidth: 46,
    alignItems: 'center',
  },
  pickerChipDisabled: {
    opacity: 0.35,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FCFCFD',
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
    marginTop: Spacing.xs,
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FCFCFD',
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
});
