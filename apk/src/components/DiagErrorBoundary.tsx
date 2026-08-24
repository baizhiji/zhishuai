import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { saveError, getBootLog, loadSavedError } from '../utils/diag';

const DARK_BG = '#1E1B2E';
const CARD_BG = '#2A2640';
const ACCENT = '#A78BFA';
const GREEN = '#4ADE80';
const RED = '#F87171';
const WHITE = '#FFFFFF';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
  componentStack: string;
}

export default class DiagErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, componentStack: '' };

  static getDerivedStateFromError(error: Error) {
    saveError(error);
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ componentStack: info.componentStack || '' });
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorScreen
          error={this.state.error}
          componentStack={this.state.componentStack}
          onRetry={() => this.setState({ error: null, componentStack: '' })}
        />
      );
    }
    return this.props.children;
  }
}

function ErrorScreen({
  error,
  componentStack,
  onRetry,
}: {
  error: Error;
  componentStack: string;
  onRetry: () => void;
}) {
  const [bootLog, setBootLog] = React.useState<string[]>([]);

  React.useEffect(() => {
    loadSavedError().then(() => {
      setBootLog(getBootLog());
    });
  }, []);

  const stackLines = (error.stack || '').split('\n').slice(0, 14);
  const componentLines = componentStack.split('\n').slice(0, 8);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>诊断信息（请拍照发我）</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>错误消息</Text>
          <Text style={styles.errorMsg} selectable>
            {error.message || String(error)}
          </Text>
        </View>
        {stackLines.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>JS 堆栈</Text>
            {stackLines.map((line, i) => (
              <Text key={i} style={styles.mono} selectable>
                {line}
              </Text>
            ))}
          </View>
        )}
        {componentLines.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>组件位置</Text>
            {componentLines.map((line, i) => (
              <Text key={i} style={styles.mono} selectable>
                {line}
              </Text>
            ))}
          </View>
        )}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>启动日志（JS 执行进度）</Text>
          {bootLog.length === 0 && <Text style={styles.mono}>无日志</Text>}
          {bootLog.map((line, i) => (
            <Text key={i} style={[styles.mono, styles.green]} selectable>
              {line}
            </Text>
          ))}
        </View>
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryText}>重新加载</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>
          如果看不到此页面而是直接闪退，说明是原生层问题，请告诉我"仍是闪退"
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK_BG },
  content: { padding: 16, paddingBottom: 48 },
  title: { color: WHITE, fontSize: 20, fontWeight: '700', marginBottom: 12 },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  errorMsg: { color: RED, fontSize: 15, lineHeight: 22 },
  mono: { color: WHITE, fontSize: 11, lineHeight: 16 },
  green: { color: GREEN },
  retryBtn: {
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  retryText: { color: WHITE, fontSize: 16, fontWeight: '600' },
  hint: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
