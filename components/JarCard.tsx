import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Jar } from '../lib/types';
import { theme } from '../lib/theme';

interface JarCardProps {
  jar: Jar;
  width: number;
  onPress: () => void;
}

export function JarCard({ jar, width, onPress }: JarCardProps) {
  const progress = jar.target_amount
    ? Math.min((jar.balance / jar.target_amount) * 100, 100)
    : null;

  const formatMoney = (amount: number) =>
    '$' + amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return (
    <TouchableOpacity
      style={[styles.card, { width }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Background fill */}
      {progress !== null && (
        <View
          style={[
            styles.fillBg,
            {
              height: `${progress}%` as any,
              backgroundColor: jar.color + '20',
            },
          ]}
        />
      )}

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={[styles.emojiWrap, { backgroundColor: jar.color + '20' }]}>
            <Text style={styles.emoji}>{jar.emoji}</Text>
          </View>
          {jar.is_shared && (
            <View style={styles.sharedBadge}>
              <Text style={styles.sharedText}>👥</Text>
            </View>
          )}
        </View>

        {/* Name & Balance */}
        <Text style={styles.name} numberOfLines={1}>{jar.name}</Text>
        <Text style={[styles.balance, { color: jar.color }]}>
          {formatMoney(jar.balance)}
        </Text>

        {/* Goal Progress */}
        {jar.target_amount && (
          <View style={styles.goalSection}>
            <View style={styles.goalRow}>
              <Text style={styles.goalLabel}>🎯 Goal</Text>
              <Text style={styles.goalAmount}>{formatMoney(jar.target_amount)}</Text>
            </View>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%` as any,
                    backgroundColor: jar.color,
                  },
                ]}
              />
            </View>
            {progress !== null && progress >= 100 && (
              <Text style={styles.goalReached}>🎉 Goal reached!</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fillBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  emojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  sharedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#A78BFA20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharedText: {
    fontSize: 14,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  balance: {
    fontSize: 22,
    fontWeight: '700',
  },
  goalSection: {
    marginTop: 10,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  goalAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  progressBg: {
    height: 6,
    backgroundColor: theme.colors.fill,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  goalReached: {
    fontSize: 11,
    color: theme.colors.success,
    fontWeight: '600',
    marginTop: 4,
  },
});
