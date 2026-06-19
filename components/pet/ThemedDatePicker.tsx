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
import { LoginTheme, Radius, Spacing } from '../../constants/theme';

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
  /** When omitted, future dates are allowed. */
  maximumDate?: Date;
  onClose: () => void;
  onConfirm: (date: Date) => void;
}

export function ThemedDatePicker({
  visible,
  value,
  title = 'Select date',
  minimumDate,
  maximumDate,
  onClose,
  onConfirm,
}: ThemedDatePickerProps) {
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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.sheetHeader}>
            <Ionicons name="calendar" size={22} color={LoginTheme.green} />
            <AppText variant="h3" weight="700" color={LoginTheme.charcoal}>
              {title}
            </AppText>
          </View>

          <View style={styles.monthRow}>
            <TouchableOpacity
              style={[styles.navBtn, !canGoPrev && styles.navBtnDisabled]}
              onPress={() => canGoPrev && goMonth(-1)}
              disabled={!canGoPrev}
              hitSlop={12}
              accessibilityLabel="Previous month"
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color={canGoPrev ? LoginTheme.charcoal : LoginTheme.inputBg}
              />
            </TouchableOpacity>

            <AppText variant="body" weight="700" color={LoginTheme.charcoal}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </AppText>

            <TouchableOpacity
              style={[styles.navBtn, !canGoNext && styles.navBtnDisabled]}
              onPress={() => canGoNext && goMonth(1)}
              disabled={!canGoNext}
              hitSlop={12}
              accessibilityLabel="Next month"
            >
              <Ionicons
                name="chevron-forward"
                size={22}
                color={canGoNext ? LoginTheme.charcoal : LoginTheme.inputBg}
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
                  style={[styles.pickerChip, active && styles.pickerChipActive, disabled && styles.pickerChipDisabled]}
                  onPress={() => !disabled && setViewMonth(index)}
                  disabled={disabled}
                >
                  <AppText
                    variant="caption"
                    weight={active ? '700' : '500'}
                    color={active ? LoginTheme.footerText : LoginTheme.charcoal}
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
                  style={[styles.pickerChip, active && styles.pickerChipActive]}
                  onPress={() => setViewYear(year)}
                >
                  <AppText
                    variant="caption"
                    weight={active ? '700' : '500'}
                    color={active ? LoginTheme.footerText : LoginTheme.charcoal}
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
                weight="600"
                color={LoginTheme.tagline}
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
                      isSelected && styles.dayInnerSelected,
                      isToday && !isSelected && styles.dayInnerToday,
                    ]}
                  >
                    <AppText
                      variant="bodySmall"
                      weight={isSelected ? '700' : '500'}
                      color={
                        disabled
                          ? LoginTheme.petLabel
                          : isSelected
                            ? LoginTheme.footerText
                            : cell.inMonth
                              ? LoginTheme.charcoal
                              : LoginTheme.tagline
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
              <AppText variant="body" weight="600" color={LoginTheme.charcoal}>
                Cancel
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => onConfirm(selected)}
              activeOpacity={0.85}
            >
              <AppText variant="body" weight="700" color={LoginTheme.footerText}>
                Confirm
              </AppText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const sheetShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  android: { elevation: 12 },
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  sheet: {
    backgroundColor: LoginTheme.screenBg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E8EDE8',
    ...sheetShadow,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  monthPickerRow: {
    gap: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  yearPickerRow: {
    gap: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  pickerChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: LoginTheme.inputBg,
    minWidth: 44,
    alignItems: 'center',
  },
  pickerChipActive: {
    backgroundColor: LoginTheme.green,
  },
  pickerChipDisabled: {
    opacity: 0.35,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: LoginTheme.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.lg,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInnerSelected: {
    backgroundColor: LoginTheme.green,
  },
  dayInnerToday: {
    borderWidth: 1.5,
    borderColor: LoginTheme.green,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: LoginTheme.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: LoginTheme.green,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: LoginTheme.buttonShadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
});
