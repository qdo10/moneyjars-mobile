import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Jar, User } from '../../lib/types';
import { theme } from '../../lib/theme';
import { JarCard } from '../../components/JarCard';

const { width } = Dimensions.get('window');
const JAR_CARD_WIDTH = (width - 48 - 12) / 2;

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [jars, setJars] = useState<Jar[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadData = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (userData) setUser(userData);

    const { data: jarsData } = await supabase
      .from('jars')
      .select('*')
      .eq('owner_id', authUser.id)
      .order('position', { ascending: true });

    if (jarsData) setJars(jarsData);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const totalBalance = jars.reduce((sum, jar) => sum + jar.balance, 0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatMoney = (amount: number) =>
    '$' + amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.name}>{user?.name || 'Friend'}</Text>
          </View>
          {!user?.is_pro && (
            <TouchableOpacity
              style={styles.proBadge}
              onPress={() => router.push('/settings' as never)}
            >
              <Text style={styles.proBadgeText}>✨ Go Pro</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Total in Jars</Text>
          <Text style={styles.balanceAmount}>{formatMoney(totalBalance)}</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: '#34D39920' }]}
            onPress={() => router.push({ pathname: '/transaction', params: { type: 'fill' } } as never)}
          >
            <Text style={styles.quickBtnEmoji}>➕</Text>
            <Text style={[styles.quickBtnLabel, { color: '#34D399' }]}>Add</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: '#FF6B6B20' }]}
            onPress={() => router.push({ pathname: '/transaction', params: { type: 'spend' } } as never)}
          >
            <Text style={styles.quickBtnEmoji}>➖</Text>
            <Text style={[styles.quickBtnLabel, { color: '#FF6B6B' }]}>Spend</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: '#60A5FA20' }]}
            onPress={() => router.push({ pathname: '/transaction', params: { type: 'transfer' } } as never)}
          >
            <Text style={styles.quickBtnEmoji}>🔄</Text>
            <Text style={[styles.quickBtnLabel, { color: '#60A5FA' }]}>Transfer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Jars */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Jars</Text>
          <TouchableOpacity onPress={() => router.push('/jar/create' as never)}>
            <Text style={styles.addBtn}>+ New Jar</Text>
          </TouchableOpacity>
        </View>

        {jars.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🫙</Text>
            <Text style={styles.emptyTitle}>No jars yet</Text>
            <Text style={styles.emptyText}>Create your first jar to start budgeting!</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/jar/create' as never)}
            >
              <Text style={styles.emptyBtnText}>Create First Jar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.jarsGrid}>
            {jars.map((jar) => (
              <JarCard
                key={jar.id}
                jar={jar}
                width={JAR_CARD_WIDTH}
                onPress={() => router.push(`/jar/${jar.id}` as never)}
              />
            ))}
          </View>
        )}

        {/* Pro upsell */}
        {!user?.is_pro && jars.length >= 2 && (
          <TouchableOpacity style={styles.proCard}>
            <Text style={styles.proCardTitle}>🚀 Upgrade to Pro</Text>
            <Text style={styles.proCardText}>
              Unlimited jars, shared budgeting with your partner, and more!
            </Text>
            <View style={styles.proCardPriceRow}>
              <Text style={styles.proCardPrice}>$4.99/mo</Text>
              <Text style={styles.proCardTrial}>7-day free trial</Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  greeting: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  name: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700',
  },
  proBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  proBadgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  balanceSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  balanceAmount: {
    color: '#FFF',
    fontSize: 40,
    fontWeight: '700',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: theme.borderRadius.lg,
  },
  quickBtnEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  quickBtnLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  addBtn: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  jarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    color: theme.colors.textLight,
    marginBottom: theme.spacing.lg,
  },
  emptyBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
  },
  emptyBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  proCard: {
    marginTop: theme.spacing.lg,
    backgroundColor: '#7C3AED',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
  },
  proCardTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  proCardText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: theme.spacing.md,
  },
  proCardPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proCardPrice: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  proCardTrial: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
});
