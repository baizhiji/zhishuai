/**
 * PlanGenerationScreen - 商业方案生成与查看
 * 智枢 AI APK - 移动端
 *
 * 流程：填写信息 → AI生成 → 查看方案 → 下载/优化
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Share,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import businessService, { BusinessPlan, BusinessPlanSection } from '../../services/business.service';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import PageHeader from '../../components/PageHeader';

interface ScenarioConfig {
  id: string;
  name: string;
  description: string;
  icon: { icon: string; color: string };
  formLabels: string[];
  formPlaceholders: string[];
}

const SCENARIO_META: Record<string, ScenarioConfig> = {
  startup: {
    id: 'startup', name: '创业方案', description: '为新企业或项目制定完整的创业计划',
    icon: { icon: 'bulb', color: '#2563EB' },
    formLabels: ['企业/项目名称', '业务描述', '目标用户（选填）', '预算范围（选填）', '时间规划（选填）'],
    formPlaceholders: ['例如：AI智能客服SaaS平台', '详细描述你的创业想法、产品或服务', '谁是你的目标用户？', '例如：50-100万', '例如：6个月内完成MVP'],
  },
  operations: {
    id: 'operations', name: '运营策划', description: '优化企业运营效率，制定运营管理体系',
    icon: { icon: 'settings', color: '#059669' },
    formLabels: ['企业名称', '业务描述', '当前运营痛点', '团队规模（选填）', '补充信息（选填）'],
    formPlaceholders: ['你的企业名称', '描述主营业务', '当前遇到的主要运营问题', '例如：10-50人', '其他需要特别说明的内容'],
  },
  diagnosis: {
    id: 'diagnosis', name: '企业诊断', description: '全面分析企业经营状况，识别问题根源',
    icon: { icon: 'pulse', color: '#EA580C' },
    formLabels: ['企业名称', '业务描述', '经营年限', '面临的主要问题', '补充信息（选填）'],
    formPlaceholders: ['你的企业名称', '描述主营业务和市场定位', '例如：3年', '描述当前遇到的核心挑战', '其他背景信息'],
  },
  product_promotion: {
    id: 'product_promotion', name: '产品宣传方案', description: '为产品制定全渠道宣传推广方案',
    icon: { icon: 'megaphone', color: '#DC2626' },
    formLabels: ['产品名称', '产品描述', '目标市场（选填）', '推广预算（选填）', '补充信息（选填）'],
    formPlaceholders: ['你的产品名称', '描述产品功能、特点和卖点', '你想覆盖的目标市场和人群', '例如：10-30万', '其他说明'],
  },
  competitive_analysis: {
    id: 'competitive_analysis', name: '竞品分析报告', description: '深度分析竞争对手',
    icon: { icon: 'trophy', color: '#4F46E5' },
    formLabels: ['企业/产品名称', '行业领域', '主要竞品名称', '你的差异化优势', '补充信息（选填）'],
    formPlaceholders: ['你的企业或产品名称', '你所在的行业和细分领域', '列出1-3个主要竞争对手', '你的核心竞争力和差异化', '其他背景信息'],
  },
  brick_and_mortar: {
    id: 'brick_and_mortar', name: '实体店经营方案', description: '线下实体店全链路经营方案',
    icon: { icon: 'storefront', color: '#0D9488' },
    formLabels: ['店铺名称', '经营品类', '选址情况（选填）', '投资预算（选填）', '补充信息（选填）'],
    formPlaceholders: ['你的店铺名称', '描述经营品类和定位', '例如：商圈、社区店', '例如：20-50万', '其他说明'],
  },
  marketing: {
    id: 'marketing', name: '市场营销方案', description: '系统化市场营销策略',
    icon: { icon: 'trending-up', color: '#D946EF' },
    formLabels: ['企业/品牌名称', '业务描述', '目标市场（选填）', '营销预算（选填）', '补充信息（选填）'],
    formPlaceholders: ['你的企业或品牌名称', '描述业务、产品和目标', '核心目标市场和人群', '例如：50-100万', '其他说明'],
  },
};

type Phase = 'input' | 'generating' | 'preview';

export default function PlanGenerationScreen({ route, navigation }: any) {
  const scenario: ScenarioConfig = SCENARIO_META[route.params.scenario.id] || {
    ...route.params.scenario,
    formLabels: ['企业/项目名称', '业务描述', '目标用户（选填）', '预算范围（选填）', '时间规划（选填）'],
    formPlaceholders: ['请输入...', '详细描述...', '', '', ''],
    icon: { icon: 'document-text', color: '#6B7280' },
  };

  const [phase, setPhase] = useState<Phase>('input');
  const [formValues, setFormValues] = useState<string[]>(['', '', '', '', '']);
  const [plan, setPlan] = useState<BusinessPlan | null>(null);
  const [generatingText, setGeneratingText] = useState('正在分析您的需求...');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const isLoading = phase === 'generating';

  const updateField = (index: number, value: string) => {
    const newValues = [...formValues];
    newValues[index] = value;
    setFormValues(newValues);
  };

  const canGenerate = formValues[0].trim() && formValues[1].trim();

  const generatingPhrases = [
    '正在分析您的需求...',
    '正在构建专业方案框架...',
    '正在调用大模型生成内容...',
    '正在优化方案结构...',
    '即将完成，请稍候...',
  ];

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setPhase('generating');
    setPlan(null);

    // 轮换生成中文字
    let phraseIndex = 0;
    const phraseTimer = setInterval(() => {
      phraseIndex = (phraseIndex + 1) % generatingPhrases.length;
      setGeneratingText(generatingPhrases[phraseIndex]);
    }, 3000);

    try {
      const result = await businessService.generatePlan({
        scenarioId: scenario.id,
        businessName: formValues[0],
        businessDescription: formValues[1],
        targetAudience: formValues[2] || undefined,
        budget: formValues[3] || undefined,
        timeline: formValues[4] || undefined,
      });
      setPlan(result);
      setPhase('preview');
    } catch (err: any) {
      Alert.alert('生成失败', err?.message || '方案生成失败，请检查API配置后重试');
      setPhase('input');
    } finally {
      clearInterval(phraseTimer);
    }
  };

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
        await Share.share({
          url: downloadResult.uri,
          title: fileName,
        });
      }
    } catch (err: any) {
      Alert.alert('下载失败', err?.message || '文件下载失败，请稍后重试');
    } finally {
      setDownloading(null);
    }
  };

  const handleRegenerate = () => {
    setPhase('input');
    setPlan(null);
  };

  // 生成中状态
  if (phase === 'generating') {
    return (
      <View style={styles.container}>
        <PageHeader title={scenario.name} />
        <View style={styles.generatingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.generatingText}>{generatingText}</Text>
          <Text style={styles.generatingHint}>
            AI 正在综合运用商业知识和数据分析能力{'\n'}为您生成专业方案，预计需要20-60秒
          </Text>
        </View>
      </View>
    );
  }

  // 预览状态
  if (phase === 'preview' && plan) {
    return (
      <View style={styles.container}>
        <PageHeader title={scenario.name} rightAction={
          <TouchableOpacity onPress={handleRegenerate}>
            <Ionicons name="refresh" size={22} color="#2563EB" />
          </TouchableOpacity>
        } />

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* 方案摘要卡片 */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{plan.businessName}</Text>
            <Text style={styles.summaryScenario}>{scenario.name}</Text>
            <Text style={styles.summaryDate}>
              生成时间：{new Date(plan.createdAt).toLocaleString('zh-CN')}
            </Text>
          </View>

          {/* 方案内容 */}
          {plan.sections.map((section, index) => (
            <TouchableOpacity
              key={index}
              style={styles.sectionCard}
              activeOpacity={0.7}
              onPress={() => setExpandedSection(expandedSection === index ? null : index)}
            >
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionNumber, { backgroundColor: scenario.icon?.color || '#2563EB' }]}>
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

          {/* 下载按钮 */}
          <View style={styles.downloadSection}>
            <Text style={styles.downloadTitle}>下载方案</Text>
            <View style={styles.downloadButtons}>
              <TouchableOpacity
                style={[styles.downloadBtn, { backgroundColor: '#DC2626' }]}
                activeOpacity={0.7}
                onPress={() => handleDownload('pdf')}
                disabled={downloading !== null}
              >
                {downloading === 'pdf' ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="document" size={20} color="#FFF" />
                    <Text style={styles.downloadBtnText}>PDF</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.downloadBtn, { backgroundColor: '#EA580C' }]}
                activeOpacity={0.7}
                onPress={() => handleDownload('ppt')}
                disabled={downloading !== null}
              >
                {downloading === 'ppt' ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="easel" size={20} color="#FFF" />
                    <Text style={styles.downloadBtnText}>PPT</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.downloadBtn, { backgroundColor: '#2563EB' }]}
                activeOpacity={0.7}
                onPress={() => handleDownload('docx')}
                disabled={downloading !== null}
              >
                {downloading === 'docx' ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="document-text" size={20} color="#FFF" />
                    <Text style={styles.downloadBtnText}>DOCX</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* 重新生成 */}
          <TouchableOpacity style={styles.regenerateBtn} onPress={handleRegenerate}>
            <Ionicons name="refresh" size={18} color="#6B7280" />
            <Text style={styles.regenerateText}>重新生成方案</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // 输入状态
  return (
    <View style={styles.container}>
      <PageHeader title={scenario.name} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* 场景说明 */}
        <View style={styles.infoCard}>
          <View style={[styles.infoIcon, { backgroundColor: `${scenario.icon?.color || '#2563EB'}15` }]}>
            <Ionicons name={scenario.icon?.icon || 'document-text'} size={28} color={scenario.icon?.color || '#2563EB'} />
          </View>
          <Text style={styles.infoTitle}>{scenario.name}</Text>
          <Text style={styles.infoDesc}>{scenario.description}</Text>
        </View>

        {/* 表单 */}
        <Text style={styles.formTitle}>填写信息</Text>
        <Text style={styles.formHint}>请至少填写企业名称和业务描述（标注*的必填）</Text>

        <View style={styles.formCard}>
          {scenario.formLabels.map((label, index) => (
            <View key={index} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {label}
                {index < 2 && <Text style={styles.required}> *</Text>}
              </Text>
              <TextInput
                style={[
                  styles.fieldInput,
                  index === 1 && styles.fieldInputMultiline,
                ]}
                placeholder={scenario.formPlaceholders[index]}
                placeholderTextColor="#9CA3AF"
                value={formValues[index]}
                onChangeText={v => updateField(index, v)}
                multiline={index === 1}
                numberOfLines={index === 1 ? 4 : 1}
                textAlignVertical={index === 1 ? 'top' : 'center'}
              />
            </View>
          ))}
        </View>

        {/* 生成按钮 */}
        <TouchableOpacity
          style={[styles.generateBtn, !canGenerate && styles.generateBtnDisabled]}
          activeOpacity={0.8}
          onPress={handleGenerate}
          disabled={!canGenerate}
        >
          <Ionicons name="sparkles" size={20} color="#FFF" />
          <Text style={styles.generateBtnText}>AI 生成方案</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          方案由 AI 生成，仅供参考。实际决策请结合专业判断。
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },

  // Generating
  generatingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  generatingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 12,
  },
  generatingHint: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Info Card
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  infoIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  infoDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 21 },

  // Form
  formTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  formHint: { fontSize: 13, color: '#9CA3AF', marginBottom: 14 },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  required: { color: '#DC2626' },
  fieldInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fieldInputMultiline: {
    minHeight: 100,
    paddingTop: 12,
  },

  // Generate Button
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 20,
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateBtnDisabled: {
    backgroundColor: '#93C5FD',
    shadowOpacity: 0,
    elevation: 0,
  },
  generateBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  disclaimer: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#1E3A5F',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  summaryScenario: {
    fontSize: 14,
    color: '#93C5FD',
    backgroundColor: 'rgba(37,99,235,0.3)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 8,
  },
  summaryDate: { fontSize: 12, color: '#94A3B8' },

  // Section Card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionNumberText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1F2937' },
  sectionContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    marginTop: 12,
    paddingLeft: 38,
  },

  // Download
  downloadSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  downloadTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  downloadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    minWidth: 90,
  },
  downloadBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },

  // Regenerate
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 6,
    marginTop: 8,
  },
  regenerateText: { fontSize: 14, color: '#6B7280' },
});
