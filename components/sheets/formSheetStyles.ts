import { Platform, StyleSheet } from 'react-native';
import { Radius, Spacing, Palette } from '@/constants/theme';

export const FormSheetColors = {
  sheetBg: '#FFFFFF',
  overlay: 'rgba(10, 15, 30, 0.55)', // Deeper frosted-glass tint
  pageBg: '#F7F8FA', // Slightly warmer off-white
  sectionBg: '#FFFFFF',
  sectionBorder: '#ECEEF2', // Softer, cooler border
  label: '#5C6470', // Charcoal grey label
  text: '#1C1F24', // Premium dark neutral
  placeholder: '#A0A7B5',
  inputBg: '#F8F9FB', // Slightly cooler input background
  inputBorder: '#E2E5EA', // Softer border
  inputFocusBorder: '#5CB35D', // Green focus ring
  chipBg: '#F3F5F7',
  chipBorder: '#E6E8EB',
  divider: '#ECEEF2',
  handle: '#D8DBE0', // Slightly more visible handle
  footerBg: '#FFFFFF',
  footerBorder: '#F0F2F5',
} as const;

export const formSheetStyles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: FormSheetColors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: FormSheetColors.sheetBg,
    borderTopLeftRadius: 28, // Premium roundness
    borderTopRightRadius: 28,
    maxHeight: '92%',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -12 },
        shadowOpacity: 0.10,
        shadowRadius: 20,
      },
      android: {
        elevation: 28,
      },
    }),
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    marginTop: 10,
    marginBottom: 6,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: FormSheetColors.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: Spacing.lg,
    backgroundColor: FormSheetColors.pageBg,
  },
  hero: {
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: FormSheetColors.sectionBorder,
  },
  heroIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    gap: 2,
  },
  section: {
    marginBottom: 20,
    backgroundColor: FormSheetColors.sectionBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: FormSheetColors.sectionBorder,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: FormSheetColors.chipBg,
    borderWidth: 1,
    borderColor: FormSheetColors.chipBorder,
  },
  chipSelected: {
    borderWidth: 1,
  },
  textInput: {
    backgroundColor: FormSheetColors.inputBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: FormSheetColors.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: 8,
    height: 44,
    fontSize: 15,
    color: FormSheetColors.text,
    ...Platform.select({
      web: {
        outlineStyle: 'none' as any,
      },
    }),
  },
  suffixInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FormSheetColors.inputBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: FormSheetColors.inputBorder,
    paddingHorizontal: 14,
    height: 44,
  },
  suffixInput: {
    flex: 1,
    fontSize: 15,
    color: FormSheetColors.text,
    paddingVertical: 8,
    paddingHorizontal: 0,
    margin: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none' as any,
        borderWidth: 0,
        backgroundColor: 'transparent',
      },
    }),
  },
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: FormSheetColors.inputBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: FormSheetColors.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: 8,
    height: 44,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: FormSheetColors.inputBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: FormSheetColors.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: 4,
    height: 48,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  halfCol: {
    flex: 1,
  },
  fieldGap: {
    marginBottom: 8,
  },
  notesInput: {
    height: 64,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    backgroundColor: FormSheetColors.footerBg,
    borderTopWidth: 1,
    borderTopColor: FormSheetColors.footerBorder,
  },
  saveBtn: {
    width: '100%',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  historyRow: {
    backgroundColor: FormSheetColors.pageBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: FormSheetColors.sectionBorder,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 4,
  },
  gradientHeader: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  headerIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 19,
    lineHeight: 24,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
