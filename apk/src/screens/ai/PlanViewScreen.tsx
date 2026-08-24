/**
 * PlanViewScreen - 查看已保存方案
 * 智枢 AI APK - 移动端
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import businessService, { BusinessPlanDetail } from '../../services/business.service';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import PageHeader from '../../components/PageHeader';

export default function PlanViewScreen({ route }: any) {
  const { planId, scenarioId } = route.params;
  const [plan, setPlan] = useState<BusinessPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const detail = await businessService.getPlanDetail(planId);
        setPlan(detail);
      } catch (err: any) {
        Alert.alert('加载失败', err?.message || '无法加载方案详情');
      } finally {
        setLoading(false);
      }
    })();
  }, [planId]);

  const handleDownload = async (format: 'ppt' | 'pdf' | 'docx' | 'xlsx') => {
    if (!plan) return;
    setDownloading(format);

    try {
      const url = businessService.getExportUrl(plan.id, format);
      const ext = format === 'xlsx' ? 'xlsx' : format === 'docx' ? 'docx' : format === 'pdf' ? 'pdf' : 'pptx';
      const fileName = `${plan.businessName}_${plan.scenarioName}.${ext}`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      const downloadResult = await FileSystem.downloadAsync(url, filePath);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: format === 'pdf' ? 'application/pdf' :
            format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
            format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          dialogTitle: `保存 ${plan.businessName} 方案`,
        });
      } else {
        await Share.share({ url: downloadResult.uri, title: fileName });
      }
    } catch (err: any) {
      Alert.alert('下载失败', err?.message || '文件下载失败');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <PageHeader title="方案详情" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6D28D9" />
        </View>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.container}>
        <PageHeader title="方案详情" />
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>方案未找到</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader title={plan.scenarioName} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* 摘要 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{plan.businessName}</Text>
          <Text style={styles.summaryScenario}>{plan.scenarioName}</Text>
          <Text style={styles.summaryDate}>
            {new Date(plan.createdAt).toLocaleString('zh-CN')}
          </Text>
        </View>

        {/* 章节 */}
        {plan.sections.map((section, index) => (
          <TouchableOpacity
            key={index}
            style={styles.sectionCard}
            activeOpacity={0.7}
            onPress={() => setExpandedSection(expandedSection === index ? null : index)}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>{section.order + 1}</Text>
              </View>
              <Text style={styles.sectionTitle} numberOfLines={expandedSection === index ? undefined : 1}>
                {section.title}
              </Text>
              <Ionicons
                name={expandedSection === index ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#9CA3AF"
              />
            </View>
            {expandedSection === index && (
              <Text style={styles.sectionContent}>{section.content}</Text>
            )}
          </TouchableOpacity>
        ))}

        {/* 下载 */}
        <View style={styles.downloadSection}>
          <Text style={styles.downloadTitle}>下载方案</Text>
          <View style={styles.downloadButtons}>
            <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: '#DC2626' }]} onPress={() => handleDownload('pdf')} disabled={downloading !== null}>
              {downloading === 'pdf' ? <ActivityIndicator size="small" color="#FFF" /> : (
                <><Ionicons name="document" size={20} color="#FFF" /><Text style={styles.downloadBtnText}>PDF</Text></>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: '#EA580C' }]} onPress={() => handleDownload('ppt')} disabled={downloading !== null}>
              {downloading === 'ppt' ? <ActivityIndicator size="small" color="#FFF" /> : (
                <><Ionicons name="easel" size={20} color="#FFF" /><Text style={styles.downloadBtnText}>PPT</Text></>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: '#6D28D9' }]} onPress={() => handleDownload('docx')} disabled={downloading !== null}>
              {downloading === 'docx' ? <ActivityIndicator size="small" color="#FFF" /> : (
                <><Ionicons name="document-text" size={20} color="#FFF" /><Text style={styles.downloadBtnText}>DOCX</Text></>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: '#059669' }]} onPress={() => handleDownload('xlsx')} disabled={downloading !== null}>
              {downloading === 'xlsx' ? <ActivityIndicator size="small" color="#FFF" /> : (
                <><Ionicons name="grid" size={20} color="#FFF" /><Text style={styles.downloadBtnText}>Excel</Text></>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#6B7280' },

  summaryCard: {
    backgroundColor: '#1F1B2E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  summaryScenario: { fontSize: 14, color: '#C4B5FD', backgroundColor: 'rgba(109,40,217,0.3)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 8 },
  summaryDate: { fontSize: 12, color: '#94A3B8' },

  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionNumber: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#6D28D9', justifyContent: 'center', alignItems: 'center' },
  sectionNumberText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1F2937' },
  sectionContent: { fontSize: 14, color: '#374151', lineHeight: 22, marginTop: 12, paddingLeft: 38 },

  downloadSection: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginTop: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  downloadTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937', marginBottom: 16, textAlign: 'center' },
  downloadButtons: { flexDirection: 'row', justifyContent: 'space-around' },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, gap: 8, minWidth: 90 },
  downloadBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
});
