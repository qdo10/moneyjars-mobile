import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { JAR_COLORS, JAR_EMOJIS } from '../../lib/types';
import { theme } from '../../lib/theme';

export default function CreateJarScreen() {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('💰');
  const [color, setColor] = useState(JAR_COLORS[0]);
  const [hasGoal, setHasGoal] = useState(false);
  const [targetAmount, setTargetAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a jar name');
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check free tier limit
    const { data: existing } = await supabase
      .from('jars')
      .select('id')
      .eq('owner_id', user.id);

    const { data: userData } = await supabase
      .from('users')
      .select('is_pro')
      .eq('id', user.id)
      .single();

    if (!userData?.is_pro && (existing?.length || 0) >= 3) {
      Alert.alert(
        'Upgrade to Pro',
        'You\'ve reached the free limit of 3 jars. Upgrade to Pro for unlimited jars!',
        [{ text: 'OK' }]
      );
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('jars').insert({
      owner_id: user.id,
      name: name.trim(),
      emoji,
      color,
      balance: 0,
      target_amount: hasGoal && targetAmount ? parseFloat(targetAmount) : null,
      is_shared: false,
      position: existing?.length || 0,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to create jar');
    } else {
      router.back();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelBtn}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Jar</Text>
        <TouchableOpacity onPress={handleCreate} disabled={loading}>
          <Text style={[styles.createBtn, loading && { opacity: 0.5 }]}>
            {loading ? 'Creating...' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Preview */}
      <View style={styles.preview}>
        <View style={[styles.previewJar, { borderColor: color }]}>
          <View style={[styles.previewFill, { backgroundColor: color + '30' }]} />
          <Text style={styles.previewEmoji}>{emoji}</Text>
        </View>
        <Text style={styles.previewName}>{name || 'Jar Name'}</Text>
      </View>

      {/* Name */}
      <View style={styles.section}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Groceries, Date Night, Vacation"
          placeholderTextColor={theme.colors.muted}
          value={name}
          onChangeText={setName}
          autoFocus
        />
      </View>

      {/* Emoji */}
      <View style={styles.section}>
        <Text style={styles.label}>Icon</Text>
        <View style={styles.emojiGrid}>
          {JAR_EMOJIS.map((e) => (
            <TouchableOpacity
              key={e}
              style={[styles.emojiBtn, emoji === e && styles.emojiBtnActive]}
              onPress={() => setEmoji(e)}
            >
              <Text style={styles.emojiText}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Color */}
      <View style={styles.section}>
        <Text style={styles.label}>Color</Text>
        <View style={styles.colorRow}>
          {JAR_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorBtn,
                { backgroundColor: c },
                color === c && styles.colorBtnActive,
              ]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>
      </View>

      {/* Goal */}
      <View style={styles.section}>
        <View style={styles.goalToggle}>
          <Text style={styles.label}>Set a savings goal</Text>
          <Switch
            value={hasGoal}
            onValueChange={setHasGoal}
            trackColor={{ true: theme.colors.primary }}
          />
        </View>
        {hasGoal && (
          <View style={styles.goalInput}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.goalInputField}
              placeholder="1000"
              placeholderTextColor={theme.colors.muted}
              value={targetAmount}
              onChangeText={setTargetAmount}
              keyboardType="numeric"
            />
          </View>
        )}
      </View>
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
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  createBtn: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  preview: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  previewJar: {
    width: 80,
    height: 100,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  previewFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  previewEmoji: {
    fontSize: 32,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
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
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiBtnActive: {
    backgroundColor: theme.colors.fill,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  emojiText: {
    fontSize: 22,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  colorBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  colorBtnActive: {
    borderWidth: 3,
    borderColor: theme.colors.text,
  },
  goalToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  goalInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  dollarSign: {
    fontSize: 20,
    color: theme.colors.muted,
    marginRight: 4,
  },
  goalInputField: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
});
