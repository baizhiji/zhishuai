import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { accountService, SubscriptionInfo, PlanInfo } from '../services/account.service';

export default function SubscriptionScreen() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('yearly');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sub, planList] = await Promise.all([
        accountService.getSubscriptionInfo(),
        accountService.getPlans(),
      ]);
      setSubscription(sub);
      setPlans(planList);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = () => {
    const plan = plans.find(p => p.id === selectedPlan);
    if (plan) {
      Alert.alert(
        '确认订阅',
        `确定订阅「${plan.name}」吗？\n价格：¥${plan.price}/${plan.period}`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '确认订阅',
            onPress: () => {
              Alert.alert('提示', '订阅功能暂未开放，请联系客服');
            },
          },
        ]
      );
    }
  };

  const handleToggleAutoRenew = () => {
    if (subscription) {
      setSubscription({
        ...subscription,
        autoRenew: !subscription.autoRenew,
      });
      Alert.alert(
        '自动续费',
        subscription.autoRenew ? '已关闭自动续费' : '已开启自动续费'
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'yearly':
        return '#faad14';
      case 'quarterly':
        return '#3B82F6';
      default:
        return '#64748B';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 当前订阅 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>当前订阅</Text>
        <View style={styles.currentCard}>
          <View style={styles.currentHeader}>
            <View>
              <Text style={styles.planName}>{subscription?.plan}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {subscription?.status === 'active' ? '正常' : '已过期'}
                </Text>
              </View>
            </View>
            <View style={styles.daysContainer}>
              <Text style={styles.daysNumber}>{subscription?.remainingDays}</Text>
              <Text style={styles.daysText}>剩余天数</Text>
            </View>
          </View>
          <View style={styles.currentInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>开始时间</Text>
              <Text style={styles.infoValue}>{subscription?.startDate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>到期时间</Text>
              <Text style={[styles.infoValue, styles.expireValue]}>
                {subscription?.expireDate}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 功能使用情况 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>功能使用情况</Text>
        <View style={styles.featuresCard}>
          {subscription?.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureLeft}>
                <Text style={styles.featureName}>{feature.name}</Text>
                <Text style={styles.featureLimit}>/ {feature.limit}</Text>
              </View>
              <Text style={styles.featureUsed}>{feature.used}次</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 订阅管理 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>订阅管理</Text>
          <TouchableOpacity
            style={[
              styles.autoRenewBadge,
              subscription?.autoRenew && styles.autoRenewActive,
            ]}
            onPress={handleToggleAutoRenew}
          >
            <Text
              style={[
                styles.autoRenewText,
                subscription?.autoRenew && styles.autoRenewTextActive,
              ]}
            >
              {subscription?.autoRenew ? '自动续费已开启' : '自动续费已关闭'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 套餐选择 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>选择套餐</Text>
        {plans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              selectedPlan === plan.id && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan(plan.id)}
          >
            <View style={styles.planHeader}>
              <View style={styles.planInfo}>
                <Text
                  style={[
                    styles.planName2,
                    plan.id === 'yearly' && styles.planNameHighlight,
                  ]}
                >
                  {plan.name}
                </Text>
                {plan.id === 'yearly' && (
                  <View style={styles.recommendBadge}>
                    <Text style={styles.recommendText}>推荐</Text>
                  </View>
                )}
              </View>
              <View>
                <Text
                  style={[
                    styles.planPrice,
                    { color: getPlanColor(plan.id) },
                  ]}
                >
                  ¥{plan.price}
                </Text>
                <Text style={styles.planPeriod}>/ {plan.period}</Text>
              </View>
            </View>
            <View style={styles.planFeatures}>
              {plan.features.map((feature, index) => (
                <Text key={index} style={styles.planFeature}>
                  · {feature}
                </Text>
              ))}
            </View>
            {selectedPlan === plan.id && (
              <View style={styles.selectedIndicator}>
                <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* 订阅按钮 */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
          <Text style={styles.subscribeButtonText}>确认订阅</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  currentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  currentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#22C55E',
  },
  daysContainer: {
    alignItems: 'center',
  },
  daysNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#faad14',
  },
  daysText: {
    fontSize: 12,
    color: '#64748B',
  },
  currentInfo: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 14,
    color: '#1E293B',
  },
  expireValue: {
    color: '#EF4444',
    fontWeight: '500',
  },
  featuresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  featureItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  featureLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureName: {
    fontSize: 14,
    color: '#1E293B',
  },
  featureLimit: {
    fontSize: 12,
    color: '#22C55E',
    marginLeft: 4,
  },
  featureUsed: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  autoRenewBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  autoRenewActive: {
    backgroundColor: '#DCFCE7',
  },
  autoRenewText: {
    fontSize: 12,
    color: '#64748B',
  },
  autoRenewTextActive: {
    color: '#22C55E',
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#F1F5F9',
  },
  planCardSelected: {
    borderColor: '#3B82F6',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planName2: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  planNameHighlight: {
    color: '#faad14',
  },
  recommendBadge: {
    backgroundColor: '#faad14',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  recommendText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  planPeriod: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
  },
  planFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  planFeature: {
    fontSize: 12,
    color: '#64748B',
    marginRight: 12,
    marginBottom: 4,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  subscribeButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 40,
  },
});
