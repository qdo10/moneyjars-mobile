import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Transaction } from '../../lib/types';
import { theme } from '../../lib/theme';

export default function ActivityScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(100);

    if (data) setTransactions(data);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatMoney = (amount: number) => '$' + amount.toFixed(2);

  const formatDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'fill': return { icon: '➕', color: theme.colors.success, label: 'Added' };
      case 'spend': return { icon: '➖', color: theme.colors.danger, label: 'Spent' };
      case 'transfer_in': return { icon: '📥', color: '#60A5FA', label: 'Transfer in' };
      case 'transfer_out': return { icon: '📤', color: '#60A5FA', label: 'Transfer out' };
      default: return { icon: '💰', color: theme.colors.muted, label: 'Transaction' };
    }
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const info = getTypeInfo(item.type);
    const isIncome = item.type === 'fill' || item.type === 'transfer_in';

    return (
      <View style={styles.txRow}>
        <View style={[styles.txIcon, { backgroundColor: info.color + '20' }]}>
          <Text style={styles.txIconText}>{info.icon}</Text>
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txNote}>{item.note || info.label}</Text>
          <Text style={styles.txDate}>{formatDate(item.date)}</Text>
        </View>
        <Text style={[styles.txAmount, { color: isIncome ? theme.colors.success : theme.colors.danger }]}>
          {isIncome ? '+' : '-'}{formatMoney(item.amount)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptyText}>Your transactions will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 100,
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
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txIconText: {
    fontSize: 18,
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
  empty: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  emptyText: {
    color: theme.colors.textLight,
    marginTop: 4,
  },
});
