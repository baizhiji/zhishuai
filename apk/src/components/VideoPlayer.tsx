/**
 * 视频播放器组件
 * 支持播放、暂停、全屏、进度控制
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
  Modal,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface VideoPlayerProps {
  uri: string;
  poster?: string;
  autoPlay?: boolean;
  showControls?: boolean;
  style?: any;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  onError?: (error: any) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function VideoPlayer({
  uri,
  poster,
  autoPlay = false,
  showControls = true,
  style,
  onProgress,
  onComplete,
  onError,
}: VideoPlayerProps) {
  const { theme, isDark } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControlsTemp, setShowControlsTemp] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const Video = useRef<any>(null);

  // 检查是否可以使用 expo-av
  const canUseVideo = () => {
    try {
      require('expo-av');
      return true;
    } catch {
      return false;
    }
  };

  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
    setShowControlsTemp(true);
    resetControlsTimer();
  }, [isPlaying]);

  const handleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const handleSeek = useCallback((newProgress: number) => {
    setProgress(newProgress);
    if (Video.current?.setPositionAsync) {
      Video.current.setPositionAsync(newProgress * duration);
    }
  }, [duration]);

  const resetControlsTimer = useCallback(() => {
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    if (isPlaying) {
      controlsTimeout.current = setTimeout(() => {
        setShowControlsTemp(false);
      }, 3000);
    }
  }, [isPlaying]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 加载视频组件
  if (!canUseVideo()) {
    return (
      <View style={[styles.container, { backgroundColor: theme.card }, style]}>
        <View style={styles.errorContainer}>
          <Ionicons name="videocam-off" size={48} color={theme.textSecondary} />
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>
            视频播放器不可用
          </Text>
          {uri && (
            <TouchableOpacity
              style={[styles.linkButton, { backgroundColor: theme.primary }]}
              onPress={() => {
                // 可以使用 WebBrowser 打开链接
              }}
            >
              <Text style={styles.linkButtonText}>在浏览器中打开</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  const VideoComponent = require('expo-av').Video;
  const VideoRef = VideoComponent;

  const renderControls = () => {
    if (!showControls) return null;
    
    return (
      <TouchableOpacity
        style={styles.controlsOverlay}
        activeOpacity={1}
        onPress={() => {
          setShowControlsTemp(!showControlsTemp);
          resetControlsTimer();
        }}
      >
        {showControlsTemp && (
          <>
            {/* 中心播放按钮 */}
            <TouchableOpacity
              style={styles.centerButton}
              onPress={handlePlayPause}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={48}
                color="#fff"
              />
            </TouchableOpacity>

            {/* 底部进度条和控制栏 */}
            <View style={styles.bottomControls}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              
              <TouchableOpacity
                style={styles.progressContainer}
                onPress={(e) => {
                  const { locationX } = e.nativeEvent;
                  const progressWidth = SCREEN_WIDTH - 120;
                  const newProgress = Math.max(0, Math.min(1, locationX / progressWidth));
                  handleSeek(newProgress);
                }}
              >
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progress * 100}%`, backgroundColor: theme.primary },
                    ]}
                  />
                </View>
              </TouchableOpacity>
              
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
              
              <TouchableOpacity
                style={styles.fullscreenButton}
                onPress={handleFullscreen}
              >
                <Ionicons
                  name={isFullscreen ? 'contract' : 'expand'}
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </>
        )}
      </TouchableOpacity>
    );
  };

  const renderFullscreen = () => {
    if (!isFullscreen) return null;

    return (
      <Modal
        visible={isFullscreen}
        animationType="fullscreen"
        supportedOrientations={['landscape', 'portrait']}
        onRequestClose={() => setIsFullscreen(false)}
      >
        <StatusBar hidden />
        <View style={[styles.fullscreenContainer, { backgroundColor: '#000' }]}>
          <VideoComponent
            ref={Video}
            source={{ uri }}
            style={styles.fullscreenVideo}
            useNativeControls={false}
            resizeMode="contain"
            shouldPlay
            onPlaybackStatusUpdate={(status: any) => {
              if (status.isLoaded) {
                setIsLoading(false);
                setDuration(status.durationMillis / 1000);
                setCurrentTime(status.positionMillis / 1000);
                setProgress(status.positionMillis / (status.durationMillis || 1));
                
                if (status.didJustFinish) {
                  onComplete?.();
                }
              }
            }}
            onError={(error: any) => {
              setHasError(true);
              onError?.(error);
            }}
          />
          {renderControls()}
          
          {/* 关闭按钮 */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsFullscreen(false)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card }, style]}>
      <VideoComponent
        ref={Video}
        source={{ uri }}
        style={[styles.video, isFullscreen && styles.fullscreenVideo]}
        useNativeControls={false}
        resizeMode="contain"
        shouldPlay={autoPlay}
        posterSource={poster ? { uri: poster } : undefined}
        usePoster={!!poster}
        onPlaybackStatusUpdate={(status: any) => {
          if (status.isLoaded) {
            setIsLoading(false);
            setDuration(status.durationMillis / 1000);
            setCurrentTime(status.positionMillis / 1000);
            setProgress(status.positionMillis / (status.durationMillis || 1));
            setIsPlaying(status.isPlaying);
            
            if (status.didJustFinish) {
              onComplete?.();
            }
          } else if (status.error) {
            setHasError(true);
            onError?.(status.error);
          }
        }}
        onError={(error: any) => {
          setHasError(true);
          onError?.(error);
        }}
      />
      
      {/* 加载指示器 */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      )}
      
      {/* 错误提示 */}
      {hasError && (
        <View style={styles.errorOverlay}>
          <Ionicons name="alert-circle" size={48} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.text }]}>
            视频加载失败
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              setHasError(false);
              setIsLoading(true);
            }}
          >
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* 控制栏 */}
      {!isFullscreen && renderControls()}
      
      {/* 全屏模式 */}
      {renderFullscreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  fullscreenVideo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    minWidth: 40,
    textAlign: 'center',
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 8,
    height: 24,
    justifyContent: 'center',
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1.5,
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  fullscreenButton: {
    padding: 4,
  },
  fullscreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
  },
  linkButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  linkButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
