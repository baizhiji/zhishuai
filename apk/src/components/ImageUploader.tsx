/**
 * 图片上传组件
 * 支持从相册选择、拍照、拖拽排序
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// 文件类型
export interface UploadFile {
  id: string;
  uri: string;
  name?: string;
  type?: string;
  size?: number;
  thumbnail?: string;
}

// 检查是否可以使用图片选择器
const canUseImagePicker = () => {
  try {
    require('expo-image-picker');
    return true;
  } catch {
    return false;
  }
};

interface ImageUploaderProps {
  files: UploadFile[];
  onFilesChange: (files: UploadFile[]) => void;
  maxCount?: number;
  maxSize?: number; // MB
  accept?: 'image' | 'video' | 'all';
  disabled?: boolean;
  showPreview?: boolean;
}

export default function ImageUploader({
  files,
  onFilesChange,
  maxCount = 9,
  maxSize = 10,
  accept = 'image',
  disabled = false,
  showPreview = true,
}: ImageUploaderProps) {
  const { theme } = useTheme();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const generateId = () => `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 选择文件
  const pickFile = useCallback(async (source: 'gallery' | 'camera') => {
    if (files.length >= maxCount) {
      Alert.alert('提示', `最多只能上传 ${maxCount} 个文件`);
      return;
    }

    if (!canUseImagePicker()) {
      Alert.alert('提示', '图片选择器不可用');
      return;
    }

    try {
      const ImagePicker = require('expo-image-picker');

      let result;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('提示', '需要相机权限才能拍照');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: accept === 'video' 
            ? ImagePicker.MediaTypeOptions.Videos 
            : ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: accept === 'video' 
            ? ImagePicker.MediaTypeOptions.Videos 
            : ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // 检查文件大小
        if (asset.fileSize && asset.fileSize > maxSize * 1024 * 1024) {
          Alert.alert('提示', `文件大小不能超过 ${maxSize}MB`);
          return;
        }

        const newFile: UploadFile = {
          id: generateId(),
          uri: asset.uri,
          name: asset.fileName || `文件_${Date.now()}`,
          type: asset.mimeType || 'image/jpeg',
          size: asset.fileSize,
        };

        // 如果是视频，获取缩略图
        if (asset.type?.includes('video') && canUseVideoThumbnails()) {
          try {
            const { VideoThumbnails } = require('expo-video-thumbnails');
            const { uri } = await VideoThumbnails.getThumbnailAsync(asset.uri);
            newFile.thumbnail = uri;
          } catch (e) {
            console.log('获取视频缩略图失败:', e);
          }
        }

        onFilesChange([...files, newFile]);
      }
    } catch (error) {
      console.log('选择文件失败:', error);
      Alert.alert('错误', '选择文件失败');
    }
  }, [files, maxCount, maxSize, accept, onFilesChange]);

  // 删除文件
  const removeFile = useCallback((fileId: string) => {
    Alert.alert(
      '确认删除',
      '确定要删除这个文件吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            onFilesChange(files.filter(f => f.id !== fileId));
          },
        },
      ]
    );
  }, [files, onFilesChange]);

  // 显示选项菜单
  const showOptions = () => {
    if (disabled) return;

    Alert.alert(
      '选择文件',
      '请选择图片来源',
      [
        {
          text: '从相册选择',
          onPress: () => pickFile('gallery'),
        },
        {
          text: '拍照',
          onPress: () => pickFile('camera'),
        },
        {
          text: '取消',
          style: 'cancel',
        },
      ]
    );
  };

  // 预览文件
  const previewFile = (index: number) => {
    if (!showPreview) return;
    setPreviewIndex(index);
    setPreviewVisible(true);
  };

  // 渲染文件缩略图
  const renderThumbnail = (file: UploadFile, index: number) => {
    const isVideo = file.type?.includes('video');
    
    return (
      <View key={file.id} style={styles.thumbnailContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => previewFile(index)}
          onLongPress={() => removeFile(file.id)}
        >
          <Image
            source={{ uri: file.thumbnail || file.uri }}
            style={styles.thumbnail}
          />
          {isVideo && (
            <View style={styles.videoOverlay}>
              <Ionicons name="play-circle" size={32} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFile(file.id)}
        >
          <Ionicons name="close-circle" size={24} color={theme.error} />
        </TouchableOpacity>
      </View>
    );
  };

  // 渲染上传按钮
  const renderUploadButton = () => {
    if (files.length >= maxCount || disabled) return null;

    return (
      <TouchableOpacity
        style={[styles.uploadButton, { borderColor: theme.border }]}
        onPress={showOptions}
        disabled={disabled}
      >
        <Ionicons name="add" size={32} color={theme.primary} />
        <Text style={[styles.uploadText, { color: theme.textSecondary }]}>
          {files.length === 0 ? '上传文件' : '添加更多'}
        </Text>
      </TouchableOpacity>
    );
  };

  // 预览模式
  const renderPreviewModal = () => {
    const currentFile = files[previewIndex];
    if (!currentFile) return null;

    const isVideo = currentFile.type?.includes('video');
    const VideoPlayer = isVideo ? require('./VideoPlayer').default : null;

    return (
      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={styles.previewContainer}>
          <TouchableOpacity
            style={styles.previewCloseButton}
            onPress={() => setPreviewVisible(false)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setPreviewIndex(index);
            }}
          >
            {files.map((file, index) => {
              const isCurrentVideo = file.type?.includes('video');
              const VideoPlayerComponent = isCurrentVideo ? require('./VideoPlayer').default : null;
              
              return (
                <View key={file.id} style={styles.previewItem}>
                  {isCurrentVideo && VideoPlayerComponent ? (
                    <VideoPlayerComponent
                      uri={file.uri}
                      style={styles.previewMedia}
                    />
                  ) : (
                    <Image
                      source={{ uri: file.uri }}
                      style={styles.previewMedia}
                      resizeMode="contain"
                    />
                  )}
                </View>
              );
            })}
          </ScrollView>
          
          <View style={styles.previewIndicator}>
            <Text style={styles.previewIndicatorText}>
              {previewIndex + 1} / {files.length}
            </Text>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* 文件列表 */}
      <View style={styles.filesContainer}>
        {files.map((file, index) => renderThumbnail(file, index))}
        {renderUploadButton()}
      </View>
      
      {/* 文件数量提示 */}
      {maxCount > 1 && (
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          已上传 {files.length} / {maxCount} 个文件
        </Text>
      )}
      
      {/* 预览弹窗 */}
      {renderPreviewModal()}
    </View>
  );
}

// 检查是否有视频缩略图功能
const canUseVideoThumbnails = () => {
  try {
    require('expo-video-thumbnails');
    return true;
  } catch {
    return false;
  }
};

const SCREEN_WIDTH = require('Dimensions').get('window').width;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  filesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  thumbnailContainer: {
    margin: 4,
    position: 'relative',
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  uploadButton: {
    width: 100,
    height: 100,
    margin: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  uploadText: {
    marginTop: 4,
    fontSize: 12,
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  previewCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  previewItem: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewMedia: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
  },
  previewIndicator: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  previewIndicatorText: {
    color: '#fff',
    fontSize: 14,
  },
});
