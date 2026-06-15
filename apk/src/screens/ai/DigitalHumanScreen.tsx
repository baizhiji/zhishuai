<<<<<<< HEAD

import AIFeatureTemplate from './AIFeatureTemplate';

export default function DigitalHumanScreen({ navigation }: { navigation: any }) {
  return (
    <AIFeatureTemplate
      navigation={navigation}
      title="数字人"
      icon="person-outline"
      color="#D97706"
      description="AI虚拟主播带货"
      placeholder="请输入主播形象要求、脚本内容、背景场景等..."
    />
  );
}
=======
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

interface DigitalHuman {
  id: string;
  name: string;
  avatar: string;
  gender: 'male' | 'female';
  style: string;
}

interface VoiceOption {
  id: string;
  name: string;
  gender: string;
  preview: string;
}

export default function DigitalHumanScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const [selectedHuman, setSelectedHuman] = useState<DigitalHuman | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(null);
  const [script, setScript] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showHumanPicker, setShowHumanPicker] = useState(false);
  const [showVoicePicker, setShowVoicePicker] = useState(false);

  const digitalHumans: DigitalHuman[] = [
    { id: '1', name: '小智助手', avatar: '', gender: 'female', style: 'friendly' },
    { id: '2', name: '智囊专家', avatar: '', gender: 'male', style: 'professional' },
    { id: '3', name: '青春主播', avatar: '', gender: 'female', style: 'casual' },
    { id: '4', name: '商务精英', avatar: '', gender: 'male', style: 'serious' },
  ];

  const voices: VoiceOption[] = [
    { id: '1', name: '女声-温暖型', gender: 'female', preview: '音色柔和，适合情感类内容' },
    { id: '2', name: '女声-专业型', gender: 'female', preview: '清晰稳重，适合知识科普' },
    { id: '3', name: '男声-温暖型', gender: 'male', preview: '磁性温和，适合励志内容' },
    { id: '4', name: '男声-专业型', gender: 'male', preview: '沉稳有力，适合商务内容' },
  ];

  const videoTypes = [
    { id: '1', name: '数字人口播', icon: 'person', desc: 'AI数字人自动播报' },
    { id: '2', name: 'Talking Photo', icon: 'image', desc: '让照片开口说话' },
    { id: '3', name: '唇形同步', icon: 'mic', desc: '根据音频同步唇形' },
  ];
  const [selectedType, setSelectedType] = useState(videoTypes[0]);

  useEffect(() => {
    if (digitalHumans.length > 0 && !selectedHuman) {
      setSelectedHuman(digitalHumans[0]);
    }
    if (voices.length > 0 && !selectedVoice) {
      setSelectedVoice(voices[0]);
    }
  }, []);

  const handleGenerate = async () => {
    if (!selectedHuman) {
      Alert.alert('提示', '请选择数字人形象');
      return;
    }
    if (!script.trim()) {
      Alert.alert('提示', '请输入视频脚本内容');
      return;
    }

    setGenerating(true);
    // 模拟生成过程
    setTimeout(() => {
      setGenerating(false);
      Alert.alert(
        '视频生成中',
        '您的数字人视频正在生成中，预计需要3-5分钟。您可以在视频中心查看进度。',
        [
          { text: '知道了', style: 'cancel' },
          { text: '去视频中心', onPress: () => navigation.navigate('MediaFactory') },
        ]
      );
    }, 2000);
  };

  const renderHumanItem = ({ item }: { item: DigitalHuman }) => (
    <TouchableOpacity
      style={[
        styles.pickerItem,
        selectedHuman?.id === item.id && { borderColor: '#D97706', borderWidth: 2 },
      ]}
      onPress={() => {
        setSelectedHuman(item);
        setShowHumanPicker(false);
      }}
    >
      <View style={[styles.avatarCircle, { background: item.gender === 'female' ? '#ff6b9d' : '#1890ff' }]}>
        <Ionicons name="person" size={24} color="#fff" />
      </View>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemStyle}>{item.style === 'friendly' ? '亲切友好' : '专业正式'}</Text>
    </TouchableOpacity>
  );

  const renderVoiceItem = ({ item }: { item: VoiceOption }) => (
    <TouchableOpacity
      style={[
        styles.pickerItem,
        selectedVoice?.id === item.id && { borderColor: '#722ed1', borderWidth: 2 },
      ]}
      onPress={() => {
        setSelectedVoice(item);
        setShowVoicePicker(false);
      }}
    >
      <View style={[styles.avatarCircle, { background: '#722ed1' }]}>
        <Ionicons name="mic" size={24} color="#fff" />
      </View>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemStyle}>{item.preview}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#1a1a2e' : '#f5f5f5' }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 页面标题 */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme === 'dark' ? '#fff' : '#333' }]}>数字人视频</Text>
          <Text style={styles.subtitle}>选择形象，一键生成AI数字人口播视频</Text>
        </View>

        {/* 视频类型选择 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#fff' : '#333' }]}>视频类型</Text>
          <View style={styles.typeContainer}>
            {videoTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  selectedType?.id === type.id && { borderColor: '#D97706', backgroundColor: '#D9770610' },
                ]}
                onPress={() => setSelectedType(type)}
              >
                <Ionicons
                  name={type.icon as any}
                  size={24}
                  color={selectedType?.id === type.id ? '#D97706' : '#666'}
                />
                <Text style={styles.typeName}>{type.name}</Text>
                <Text style={styles.typeDesc}>{type.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 数字人选择 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#fff' : '#333' }]}>选择数字人</Text>
          <TouchableOpacity style={styles.selector} onPress={() => setShowHumanPicker(true)}>
            <View style={styles.selectorLeft}>
              {selectedHuman ? (
                <>
                  <View style={[styles.avatarSmall, { background: selectedHuman.gender === 'female' ? '#ff6b9d' : '#1890ff' }]}>
                    <Ionicons name="person" size={20} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.selectorTitle}>{selectedHuman.name}</Text>
                    <Text style={styles.selectorSubtitle}>{selectedHuman.style === 'friendly' ? '亲切友好' : '专业正式'}</Text>
                  </View>
                </>
              ) : (
                <Text style={styles.selectorPlaceholder}>请选择数字人形象</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* 声音选择 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#fff' : '#333' }]}>选择音色</Text>
          <TouchableOpacity style={styles.selector} onPress={() => setShowVoicePicker(true)}>
            <View style={styles.selectorLeft}>
              {selectedVoice ? (
                <>
                  <View style={[styles.avatarSmall, { background: '#722ed1' }]}>
                    <Ionicons name="mic" size={20} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.selectorTitle}>{selectedVoice.name}</Text>
                    <Text style={styles.selectorSubtitle}>{selectedVoice.preview}</Text>
                  </View>
                </>
              ) : (
                <Text style={styles.selectorPlaceholder}>请选择音色</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* 脚本输入 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#fff' : '#333' }]}>视频脚本</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme === 'dark' ? '#2a2a3e' : '#fff' }]}>
            <TextInput
              style={[styles.textInput, { color: theme === 'dark' ? '#fff' : '#333' }]}
              placeholder="请输入视频脚本内容..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={script}
              onChangeText={setScript}
            />
          </View>
          <Text style={styles.tipText}>建议输入100-500字的脚本内容，效果更佳</Text>
        </View>

        {/* 生成按钮 */}
        <TouchableOpacity
          style={[styles.generateButton, generating && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="videocam" size={20} color="#fff" />
              <Text style={styles.generateButtonText}>生成视频</Text>
            </>
          )}
        </TouchableOpacity>

        {/* 功能说明 */}
        <View style={styles.featureSection}>
          <Text style={[styles.featureTitle, { color: theme === 'dark' ? '#fff' : '#333' }]}>功能特点</Text>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#52c41a" />
            <Text style={styles.featureText}>多种数字人形象可选</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#52c41a" />
            <Text style={styles.featureText}>支持声音克隆，个性化音色</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#52c41a" />
            <Text style={styles.featureText}>一键生成，3-5分钟完成</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#52c41a" />
            <Text style={styles.featureText}>高清导出，多平台适用</Text>
          </View>
        </View>
      </ScrollView>

      {/* 数字人选择弹窗 */}
      <Modal visible={showHumanPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme === 'dark' ? '#2a2a3e' : '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme === 'dark' ? '#fff' : '#333' }]}>选择数字人</Text>
              <TouchableOpacity onPress={() => setShowHumanPicker(false)}>
                <Ionicons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={digitalHumans}
              renderItem={renderHumanItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.pickerList}
            />
          </View>
        </View>
      </Modal>

      {/* 声音选择弹窗 */}
      <Modal visible={showVoicePicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme === 'dark' ? '#2a2a3e' : '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme === 'dark' ? '#fff' : '#333' }]}>选择音色</Text>
              <TouchableOpacity onPress={() => setShowVoicePicker(false)}>
                <Ionicons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={voices}
              renderItem={renderVoiceItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.pickerList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeCard: {
    width: (width - 48) / 3,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  typeName: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  typeDesc: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectorSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  selectorPlaceholder: {
    fontSize: 14,
    color: '#999',
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  textInput: {
    padding: 16,
    fontSize: 14,
    minHeight: 120,
  },
  tipText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  generateButton: {
    backgroundColor: '#D97706',
    borderRadius: 25,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  featureSection: {
    marginBottom: 30,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  pickerList: {
    padding: 16,
  },
  pickerItem: {
    flex: 1,
    margin: 8,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemStyle: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
});
>>>>>>> 962968886be726cd434c792933b5515366d34518
