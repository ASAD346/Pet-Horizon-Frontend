import React from 'react';
import { AppText } from '../ui/AppText';

export const SheetColors = {
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

export function SectionLabel({ text }: { text: string }) {
  return (
    <AppText variant="caption" weight="700" color={SheetColors.label} style={{ letterSpacing: 0.6, marginBottom: 8, marginTop: 4 }}>
      {text}
    </AppText>
  );
}
