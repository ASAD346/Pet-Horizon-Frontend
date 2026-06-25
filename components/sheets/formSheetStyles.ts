import { Platform, StyleSheet } from 'react-native';
import { Radius, Spacing, Palette } from '@/constants/theme';

export const FormSheetColors = {
  sheetBg: '#FFFFFF',
  overlay: 'rgba(10, 15, 30, 0.45)', // Premium dark blue-gray backdrop blur/tint
  pageBg: '#FAFCFD', // cleaner off-white bg
  sectionBg: '#FFFFFF',
  sectionBorder: '#F0F2F5', // softer border
  label: '#5C6470', // Charcoal grey label
  text: '#1C1F24', // Premium dark neutral
  placeholder: '#A0A7B5',
  inputBg: '#FAFAFA',
  inputBorder: '#E6E8EB',
  chipBg: '#F3F5F7',
  chipBorder: '#E6E8EB',
  divider: '#F0F2F5',
  handle: '#E6E8EB',
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
    borderTopLeftRadius: Radius.xl, // Premium roundness
    borderTopRightRadius: Radius.xl,
    maxHeight: '88%', // Ensure it doesn't cover top status bar awkwardly
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: FormSheetColors.handle,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: FormSheetColors.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    backgroundColor: FormSheetColors.pageBg,
  },
  hero: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: FormSheetColors.sectionBorder,
  },
  heroIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    gap: 2,
  },
  section: {
    backgroundColor: FormSheetColors.sectionBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: FormSheetColors.sectionBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: FormSheetColors.divider,
  },
  sectionIcon: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
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
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: FormSheetColors.inputBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 14,
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
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: FormSheetColors.inputBorder,
    paddingHorizontal: Spacing.md,
    minHeight: 42,
  },
  suffixInput: {
    flex: 1,
    fontSize: 14,
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
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: FormSheetColors.inputBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    minHeight: 42,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: FormSheetColors.inputBg,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: FormSheetColors.inputBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    minHeight: 44,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  halfCol: {
    flex: 1,
  },
  fieldGap: {
    marginBottom: Spacing.sm,
  },
  notesInput: {
    minHeight: 70,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: FormSheetColors.sheetBg,
    borderTopWidth: 1,
    borderTopColor: FormSheetColors.divider,
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
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 22,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
