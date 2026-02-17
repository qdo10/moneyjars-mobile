import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Jar } from '../lib/types';
import { theme } from '../lib/theme';

type TxType = 'fill' | 'spend' | 'transfer';

export default function TransactionScreen() {
  const params = useLocalSearchParams<{ type?: string; jarId?: string }>();
  const router = useRouter();
  const [type, setType] = useState<TxType>((params.type as TxType) || 'fill');
  const [jars, setJars] = useState<Jar[]>([]);
  const [selectedJar, setSelectedJar] = useState<string>(params.jarId || '');
  const [toJar, setToJar] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadJars() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('jars')
        .select('*')
        .eq('owner_id', user.id)
        .order('position');

      if (data) {
        setJars(data);
        if (!selectedJar && data.length > 0) {
          setSelectedJar(data[0].id);
        }
      }
    }
    loadJars();
  }, []);

  const handleSubmit = async () => {
    if (!selectedJar || !amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (type === 'transfer' && !toJar) {
      Alert.alert('Error', 'Please select a destination jar');
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const amountNum = parseFloat(amount);
    const jar = jars.find(j => j.id === selectedJar);
    if (!jar) return;

    try {
      if (type === 'fill') {
        await supabase.from('transactions').insert({
          jar_id: selectedJar,
          user_id: user.id,
          type: 'fill',
          amount: amountNum,
          note: note || null,
          date: new Date().toISOString(),
        });
        await supabase.from('jars')
          .update({ balance: jar.balance + amountNum })
          .eq('id', selectedJar);
      } else if (type === 'spend') {
        await supabase.from('transactions').insert({
          jar_id: selectedJar,
          user_id: user.id,
          type: 'spend',
          amount: amountNum,
          note: note || null,
          date: new Date().toISOString(),
        });
        await supabase.from('jars')
          .update({ balance: Math.max(0, jar.balance - amountNum) })
          .eq('id', selectedJar);
      } else if (type === 'transfer') {
        const destJar = jars.find(j => j.id === toJar);
        if (!destJar) return;

        await supabase.from('transactions').insert([
          {
            jar_id: selectedJar,
            user_id: user.id,
            type: 'transfer_out',
            amount: amountNum,
            note: `Transfer to ${destJar.name}`,
            date: new Date().toISOString(),
          },
          {
            jar_id: toJar,
            user_id: user.id,
            type: 'transfer_in',
            amount: amountNum,
            note: `Transfer from ${jar.name}`,
            date: new Date().toISOString(),
          },
        ]);

        await supabase.from('jars')
          .update({ balance: Math.max(0, jar.balance - amountNum) })
          .eq('id', selectedJar);
        await supabase.from('jars')
          .update({ balance: destJar.balance + amountNum })
          .eq('id', toJar);
      }

      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to process transaction');
    } finally {
      setLoading(false);
    }
  };

  const typeConfig = {
    fill: { label: 'Add Money', color: theme.colors.success, emoji: '➕' },
    spend: { label: 'Log Spending', color: theme.colors.danger, emoji: '➖' },
    transfer: { label: 'Transfer', color: '#60A5FA', emoji: '🔄' },
  };

  const config = typeConfig[type];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelBtn}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{config.label}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Type Tabs */}
      <View style={styles.typeTabs}>
        {(['fill', 'spend', 'transfer'] as TxType[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.typeTab, type === t && { backgroundColor: typeConfig[t].color + '20' }]}
            onPress={() => setType(t)}
          >
            <Text style={[styles.typeTabText, type === t && { color: typeConfig[t].color }]}>
              {typeConfig[t].emoji} {typeConfig[t].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Amount */}
      <View style={styles.amountSection}>
        <Text style={styles.dollarSign}>$</Text>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          placeholder="0"
          placeholderTextColor={theme.colors.muted}
          keyboardType="decimal-pad"
          autoFocus
        />
      </View>

      {/* Jar Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>{type === 'transfer' ? 'From' : 'Jar'}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.jarPicker}>
          {jars.map((jar) => (
            <TouchableOpacity
              key={jar.id}
              style={[styles.jarOption, selectedJar === jar.id && { borderColor: jar.color, borderWidth: 2 }]}
              onPress={() => setSelectedJar(jar.id)}
            >
              <Text style={styles.jarOptionEmoji}>{jar.emoji}</Text>
              <Text style={styles.jarOptionName} numberOfLines={1}>{jar.name}</Text>
              <Text style={[styles.jarOptionBalance, { color: jar.color }]}>
                ${jar.balance.toFixed(0)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* To Jar (transfer) */}
      {type === 'transfer' && (
        <View style={styles.section}>
          <Text style={styles.label}>To</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.jarPicker}>
            {jars.filter(j => j.id !== selectedJar).map((jar) => (
              <TouchableOpacity
                key={jar.id}
                style={[styles.jarOption, toJar === jar.id && { borderColor: jar.color, borderWidth: 2 }]}
                onPress={() => setToJar(jar.id)}
              >
                <Text style={styles.jarOptionEmoji}>{jar.emoji}</Text>
                <Text style={styles.jarOptionName} numberOfLines={1}>{jar.name}</Text>
                <Text style={[styles.jarOptionBalance, { color: jar.color }]}>
                  ${jar.balance.toFixed(0)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Note */}
      <View style={styles.section}>
        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          style={styles.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder={type === 'spend' ? "e.g., Groceries at Trader Joe's" : 'e.g., Paycheck'}
          placeholderTextColor={theme.colors.muted}
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, { backgroundColor: config.color }, loading && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitBtnText}>
          {loading ? 'Processing...' : config.label}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  cancelBtn: {
    fontSize: 16,
    color: theme.colors.textLight,
    width: 60,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  typeTabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  typeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
  },
  dollarSign: {
    fontSize: 36,
    color: theme.colors.muted,
    marginRight: 4,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '700',
    color: theme.colors.text,
    minWidth: 100,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
  },
  jarPicker: {
    flexDirection: 'row',
  },
  jarOption: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: 12,
    marginRight: 10,
    width: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  jarOptionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  jarOptionName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  jarOptionBalance: {
    fontSize: 14,
    fontWeight: '700',
  },
  noteInput: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  submitBtn: {
    marginHorizontal: theme.spacing.lg,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
