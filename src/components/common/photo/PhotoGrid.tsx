import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, SafeAreaView, Text } from 'react-native';
import { colors, spacing } from '../../../utils/theme';
import PhotoDisplay from './PhotoDisplay';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

interface Photo {
  uri: string;
  label?: string;
  name: string;
}

interface PhotoGridProps {
  photos: Photo[];
  columns?: number;
  photoSize?: 'small' | 'medium' | 'large';
  onDeletePhoto?: (photoName: string) => void;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  columns = 3,
  photoSize = 'medium',
  onDeletePhoto,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const handlePhotoPress = (photo: Photo) => {
    setSelectedPhoto(photo);
  };

  const closeModal = () => {
    setSelectedPhoto(null);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.grid, { flexDirection: columns === 1 ? 'column' : 'row' }]}>
        {photos.map((photo, index) => (
          <View key={index} style={[styles.photoItem, { flex: columns === 1 ? undefined : 1 }]}>
            <PhotoDisplay
              imageUri={photo.uri}
              label={photo.label}
              size={photoSize}
              onPress={() => handlePhotoPress(photo)}
            />
            {onDeletePhoto && (
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => onDeletePhoto(photo.name)}
              >
                <MaterialIcons name="delete" size={24} color="#ff3b30" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <Modal
        visible={!!selectedPhoto}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <StatusBar style="light" />
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <MaterialIcons name="close" size={24} color={colors.background} />
            </TouchableOpacity>
            {selectedPhoto?.label && (
              <Text style={styles.modalTitle}>{selectedPhoto.label}</Text>
            )}
          </View>
          
          <View style={styles.modalContent}>
            {selectedPhoto && (
              <PhotoDisplay
                imageUri={selectedPhoto.uri}
                size="large"
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  grid: {
    flexWrap: 'wrap',
  },
  photoItem: {
    padding: spacing.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  closeButton: {
    marginRight: spacing.md,
  },
  modalTitle: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});

export default PhotoGrid;