// src/components/common/SegmentedBar.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '../../utils/theme';

interface SegmentedBarProps {
  segments: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  style?: object;
}

const SegmentedBar: React.FC<SegmentedBarProps> = ({
  segments,
  selectedIndex,
  onChange,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {segments.map((segment, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.segment,
            selectedIndex === index && styles.selectedSegment,
            index === 0 && styles.firstSegment,
            index === segments.length - 1 && styles.lastSegment,
          ]}
          onPress={() => onChange(index)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.segmentText,
              selectedIndex === index && styles.selectedSegmentText,
            ]}
            numberOfLines={1}
          >
            {segment}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: spacing.md,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
  },
  selectedSegment: {
    backgroundColor: colors.primary,
  },
  firstSegment: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  lastSegment: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  segmentText: {
    fontSize: typography.fontSizes.small,
    color: colors.text,
    fontWeight: typography.fontWeights.medium as any,
    textAlign: 'center',
  },
  selectedSegmentText: {
    color: colors.background,
  },
});

export default SegmentedBar;