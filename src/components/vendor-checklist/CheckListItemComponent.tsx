// src/components/vendor-checklist/ChecklistItemComponent.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ChecklistItem } from '../../api/vendorCheckService';
import { colors, typography, spacing } from '../../utils/theme';
import Checkbox from '../common/Checkbox';

interface ChecklistItemComponentProps {
  item: ChecklistItem;
  index: number;
  onToggle: (checked: boolean) => void;
  onAddComment: () => void;
}

const ChecklistItemComponent: React.FC<ChecklistItemComponentProps> = ({
  item,
  index,
  onToggle,
  onAddComment
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.descriptionContainer}>
        <Text style={styles.description}>{item.description}</Text>
        {item.comment && (
          <Text style={styles.comment}>{item.comment}</Text>
        )}
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.commentButton} 
          onPress={onAddComment}
        >
          <MaterialIcons name="add-comment" size={24} color={colors.primary} />
        </TouchableOpacity>
        
        <Checkbox
          checked={item.checked}
          onValueChange={onToggle}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  descriptionContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  description: {
    fontSize: typography.fontSizes.medium,
    color: colors.text,
  },
  comment: {
    fontSize: typography.fontSizes.small,
    color: colors.textLight,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
});

export default ChecklistItemComponent;