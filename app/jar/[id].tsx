import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Jar, Transaction } from '../../lib/types';
import { theme } from '../../lib/theme';

export default function JarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [jar, setJar] = useState<Jar | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const { data: jarData } = await supabase
      .from('jars')
      .select('*')
      .eq('id', id)
      .single();

    if (jarData) setJar(jarData);

    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .eq('jar_id', id)
      .order('date', { ascending: false })
      .limit(50);

    if (txData) setTransactions(txData);
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Jar',
      'Are you sure? All transactions will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('transactions').delete().eq('jar_id', id);
            await supabase.from('jars').delete().eq('id', id);
            router.back();
          },
        },
      ]
    );
  };

  const formatMoney = (amount: number) => '$' + amount.toFixed(2);
  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!jar) {
    return (
      <View style={styles.loading}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const progress = jar.target_amount
    ? Math.min((jar.balance / jar.target_amount) * 100, 100)
    : null;

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'fill': return { icon: '➕', color: theme.colors.success };
      case 'spend': return { icon: '➖', color: theme.colors.danger };
      case 'transfer_in': return { icon: '📥', color: '#60A5FA' };
      case 'transfer_out': return { icon: '📤', color: '#60A5FA' };
      default: return { icon: '💰', color: theme.colors.muted };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: jar.color }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.headerBtnText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={handleDelete}>
            <Text style={styles.headerBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.jarInfo}>
          <Text style={styles.jarEmoji}>{jar.emoji}</Text>
          <Text style={styles.jarName}>{jar.name}</Text>
          {jar.is_shared && (
            <View style={styles.sharedPill}>
              <Text style={styles.sharedPillText}>👥 Shared</Text>
            </View>
          )}
        </View>

        <Text style={styles.balance}>{formatMoney(jar.balance)}</Text>

        {/* Goal */}
        {jar.target_amount && (
          <View style={styles.goalSection}>
            <View style={styles.goalRow}>
              <Text style={styles.goalLabel}>🎯 Goal: {formatMoney(jar.target_amount)}</Text>
              <Text style={styles.goalPercent}>{Math.round(progress || 0)}%</Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
            </View>
            {progress !== null && progress >= 100 && (
              <Text style={styles.goalReached}>🎉 Goal reached!</Text>
            )}
          </View>
        )}

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() =>
              router.push({ pathname: '/transaction', params: { type: 'fill', jarId: id } } as never)
            }
          >
            <Text style={styles.quickBtnText}>➕ Add</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() =>
              router.push({ pathname: '/transaction', params: { type: 'spend', jarId: id } } as never)
            }
          >
            <Text style={styles.quickBtnText}>➖ Spend</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Transactions */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={jar.color} />
        }
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>History</Text>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No transactions yet</Text>
        }
        renderItem={({ item }) => {
          const info = getTypeInfo(item.type);
          const isIncome = item.type === 'fill' || item.type === 'transfer_in';
          return (
            <View style={styles.txRow}>
              <View style={[styles.txIcon, { backgroundColor: info.color + '20' }]}>
                <Text>{info.icon}</Text>
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txNote}>
                  {item.note || (item.type === 'fill' ? 'Added money' : 'Spent')}
                </Text>
                <Text style={styles.txDate}>{formatDate(item.date)}</Text>
              </View>
              <Text style={[styles.txAmount, { color: isIncome ? theme.colors.success : theme.colors.danger }]}>
                {isIncome ? '+' : '-'}{formatMoney(item.amount)}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  headerBtn: {
    padding: 8,
  },
  headerBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  jarInfo: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  jarEmoji: {
    fontSize: 48,
    marginBottom: 4,
  },
  jarName: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700',
  },
  sharedPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  sharedPillText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
  },
  balance: {
    color: '#FFF',
    fontSize: 42,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  goalSection: {
    marginBottom: theme.spacing.md,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  goalLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  goalPercent: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  progressBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 4,
  },
  goalReached: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 6,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  quickBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textMuted,
    paddingVertical: theme.spacing.xl,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: 14,
    marginBottom: 8,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  txNote: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
  },
  txDate: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
});
