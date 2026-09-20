import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { Palette, Spacing } from '../../constants/theme';

interface ThemedDatePickerProps {
  visible: boolean;
  value: Date;
  title?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  onClose: () => void;
  onConfirm: (date: Date) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function startOfDay(d: Date): Date {
  const res = new Date(d);
  res.setHours(0, 0, 0, 0);
  return res;
}

export function ThemedDatePicker({
  visible,
  value,
  title = 'Select Date',
  minimumDate,
  maximumDate,
  onClose,
  onConfirm,
}: ThemedDatePickerProps) {
  const initialDate = value instanceof Date && !isNaN(value.getTime()) ? value : new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [displayMonth, setDisplayMonth] = useState<number>(initialDate.getMonth());
  const [displayYear, setDisplayYear] = useState<number>(initialDate.getFullYear());
  const [showYearMonthPicker, setShowYearMonthPicker] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      const valid = value instanceof Date && !isNaN(value.getTime()) ? value : new Date();
      setSelectedDate(valid);
      setDisplayMonth(valid.getMonth());
      setDisplayYear(valid.getFullYear());
      setShowYearMonthPicker(false);
    }
  }, [visible, value]);

  const today = useMemo(() => startOfDay(new Date()), []);
  const minDay = useMemo(() => (minimumDate ? startOfDay(minimumDate) : null), [minimumDate]);
  const maxDay = useMemo(() => (maximumDate ? startOfDay(maximumDate) : null), [maximumDate]);

  // Year range calculation
  const startYear = minDay ? minDay.getFullYear() : Math.min(displayYear - 30, 1990);
  const endYear = maxDay ? maxDay.getFullYear() : Math.max(displayYear + 15, new Date().getFullYear() + 10);
  const yearsList = useMemo(() => {
    const list: number[] = [];
    for (let y = endYear; y >= startYear; y--) {
      list.push(y);
    }
    return list;
  }, [startYear, endYear]);

  // Month navigation
  const handlePrevMonth = () => {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear((prev) => prev - 1);
    } else {
      setDisplayMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear((prev) => prev + 1);
    } else {
      setDisplayMonth((prev) => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setSelectedDate(now);
    setDisplayMonth(now.getMonth());
    setDisplayYear(now.getFullYear());
    setShowYearMonthPicker(false);
  };

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(displayYear, displayMonth, 1).getDay();
    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(displayYear, displayMonth, 0).getDate();

    const days: Array<{
      date: Date;
      dayNumber: number;
      isCurrentMonth: boolean;
      isDisabled: boolean;
      isSelected: boolean;
      isToday: boolean;
    }> = [];

    // Prev month padding
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const date = new Date(displayYear, displayMonth - 1, dayNum);
      const isPastMin = minDay ? startOfDay(date) < minDay : false;
      const isFutureMax = maxDay ? startOfDay(date) > maxDay : false;

      days.push({
        date,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isDisabled: isPastMin || isFutureMax,
        isSelected: isSameDay(date, selectedDate),
        isToday: isSameDay(date, today),
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(displayYear, displayMonth, d);
      const isPastMin = minDay ? startOfDay(date) < minDay : false;
      const isFutureMax = maxDay ? startOfDay(date) > maxDay : false;

      days.push({
        date,
        dayNumber: d,
        isCurrentMonth: true,
        isDisabled: isPastMin || isFutureMax,
        isSelected: isSameDay(date, selectedDate),
        isToday: isSameDay(date, today),
      });
    }

    // Next month padding to fill a full week row (up to multiple of 7)
    const totalCells = Math.ceil(days.length / 7) * 7;
    const nextPadding = totalCells - days.length;
    for (let n = 1; n <= nextPadding; n++) {
      const date = new Date(displayYear, displayMonth + 1, n);
      const isPastMin = minDay ? startOfDay(date) < minDay : false;
      const isFutureMax = maxDay ? startOfDay(date) > maxDay : false;

      days.push({
        date,
        dayNumber: n,
        isCurrentMonth: false,
        isDisabled: isPastMin || isFutureMax,
        isSelected: isSameDay(date, selectedDate),
        isToday: isSameDay(date, today),
      });
    }

    return days;
  }, [displayYear, displayMonth, selectedDate, today, minDay, maxDay]);

  const formattedSelectedHeader = useMemo(() => {
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedDate]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Top Drag Pill */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <AppText variant="caption" weight="600" color="#64748B" style={styles.headerSubtitle}>
                {title.toUpperCase()}
              </AppText>
              <AppText variant="h3" weight="800" color="#0F172A">
                {formattedSelectedHeader}
              </AppText>
            </View>

            <TouchableOpacity
              style={styles.todayButton}
              onPress={handleJumpToToday}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={13} color="#3A8F3B" style={{ marginRight: 4 }} />
              <AppText variant="caption" weight="700" color="#3A8F3B">
                Today
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Month / Year Bar */}
          <View style={styles.navigationBar}>
            <TouchableOpacity
              style={styles.monthYearSelector}
              onPress={() => setShowYearMonthPicker((prev) => !prev)}
              activeOpacity={0.7}
            >
              <AppText variant="body" weight="800" color="#1E293B">
                {MONTH_NAMES[displayMonth]} {displayYear}
              </AppText>
              <Ionicons
                name={showYearMonthPicker ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#3A8F3B"
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>

            <View style={styles.arrowButtonsGroup}>
              <TouchableOpacity
                style={styles.arrowButton}
                onPress={handlePrevMonth}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={20} color="#334155" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.arrowButton}
                onPress={handleNextMonth}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward" size={20} color="#334155" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Body: Either Calendar Grid or Year/Month Quick Jump */}
          {showYearMonthPicker ? (
            <View style={styles.yearMonthPickerContainer}>
              <View style={styles.yearMonthColumn}>
                <AppText variant="caption" weight="700" color="#64748B" style={styles.columnLabel}>
                  MONTH
                </AppText>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollList}
                >
                  <View style={styles.monthGrid}>
                    {SHORT_MONTHS.map((m, idx) => {
                      const isSelected = displayMonth === idx;
                      return (
                        <TouchableOpacity
                          key={m}
                          style={[
                            styles.monthChip,
                            isSelected && styles.monthChipSelected,
                          ]}
                          onPress={() => {
                            setDisplayMonth(idx);
                            setShowYearMonthPicker(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <AppText
                            variant="bodySmall"
                            weight={isSelected ? '800' : '600'}
                            color={isSelected ? '#FFFFFF' : '#334155'}
                          >
                            {m}
                          </AppText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.yearMonthDivider} />

              <View style={[styles.yearMonthColumn, { flex: 1.1 }]}>
                <AppText variant="caption" weight="700" color="#64748B" style={styles.columnLabel}>
                  YEAR
                </AppText>
                <ScrollView
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={styles.yearScrollList}
                >
                  {yearsList.map((y) => {
                    const isSelected = displayYear === y;
                    return (
                      <TouchableOpacity
                        key={y}
                        style={[
                          styles.yearItem,
                          isSelected && styles.yearItemSelected,
                        ]}
                        onPress={() => {
                          setDisplayYear(y);
                          setShowYearMonthPicker(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <AppText
                          variant="body"
                          weight={isSelected ? '800' : '600'}
                          color={isSelected ? '#3A8F3B' : '#334155'}
                        >
                          {y}
                        </AppText>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={16} color="#3A8F3B" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          ) : (
            <View style={styles.calendarContainer}>
              {/* Weekday Row */}
              <View style={styles.weekdaysRow}>
                {WEEKDAYS.map((w, index) => (
                  <View key={index} style={styles.weekdayCell}>
                    <AppText
                      variant="caption"
                      weight="700"
                      color={index === 0 || index === 6 ? '#94A3B8' : '#64748B'}
                      style={styles.weekdayText}
                    >
                      {w}
                    </AppText>
                  </View>
                ))}
              </View>

              {/* Day Grid */}
              <View style={styles.daysGrid}>
                {calendarDays.map((item, index) => {
                  const { date, dayNumber, isCurrentMonth, isDisabled, isSelected, isToday } = item;

                  return (
                    <View key={index} style={styles.dayCellWrapper}>
                      <TouchableOpacity
                        disabled={isDisabled}
                        onPress={() => {
                          setSelectedDate(date);
                          if (!isCurrentMonth) {
                            setDisplayMonth(date.getMonth());
                            setDisplayYear(date.getFullYear());
                          }
                        }}
                        activeOpacity={0.7}
                        style={[
                          styles.dayCell,
                          isSelected && styles.dayCellSelected,
                          !isSelected && isToday && styles.dayCellToday,
                        ]}
                      >
                        <AppText
                          variant="body"
                          weight={isSelected || isToday ? '800' : isCurrentMonth ? '600' : '400'}
                          color={
                            isSelected
                              ? '#FFFFFF'
                              : isDisabled
                              ? '#CBD5E1'
                              : !isCurrentMonth
                              ? '#94A3B8'
                              : isToday
                              ? '#2E7D32'
                              : '#1E293B'
                          }
                        >
                          {dayNumber}
                        </AppText>
                        {!isSelected && isToday && <View style={styles.todayDot} />}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <AppText variant="body" weight="700" color="#64748B">
                Cancel
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => {
                onConfirm(selectedDate);
                onClose();
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <AppText variant="body" weight="800" color="#FFFFFF">
                Confirm Date
              </AppText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerSubtitle: {
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 10,
  },
  monthYearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  arrowButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    marginTop: 4,
    marginBottom: 10,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  dayCellWrapper: {
    width: `${100 / 7}%`,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellSelected: {
    backgroundColor: '#3A8F3B',
    shadowColor: '#3A8F3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  dayCellToday: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1.5,
    borderColor: '#81C784',
  },
  todayDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2E7D32',
  },
  yearMonthPickerContainer: {
    height: 270,
    flexDirection: 'row',
    marginVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  yearMonthColumn: {
    flex: 1,
  },
  columnLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  scrollList: {
    paddingBottom: 8,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  monthChip: {
    width: '46%',
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 4,
  },
  monthChipSelected: {
    backgroundColor: '#3A8F3B',
    borderColor: '#3A8F3B',
  },
  yearMonthDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  yearScrollList: {
    paddingHorizontal: 4,
  },
  yearItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  yearItemSelected: {
    backgroundColor: '#E8F5E9',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#3A8F3B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3A8F3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
});

