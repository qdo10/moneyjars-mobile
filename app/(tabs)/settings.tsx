import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { User } from '../../lib/types';
import { theme } from '../../lib/theme';

export default function SettingsScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (data) {
        setUser(data);
        setName(data.name || '');
      }
    }
    loadUser();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('users').update({ name }).eq('id', user.id);
    setSaving(false);
    Alert.alert('Saved', 'Your profile has been updated');
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      {/* Profile */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Profile</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
          />

          <Text style={styles.label}>Email</Text>
          <View style={styles.disabledInput}>
            <Text style={styles.disabledText}>{user?.email}</Text>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Plan */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💎 Plan</Text>
        <View style={styles.card}>
          <View style={styles.planRow}>
            <Text style={styles.planName}>
              {user?.is_pro ? 'Pro Plan' : 'Free Plan'}
            </Text>
            <View style={[styles.planBadge, user?.is_pro && styles.proBadge]}>
              <Text style={[styles.planBadgeText, user?.is_pro && styles.proBadgeText]}>
                {user?.is_pro ? '✨ Pro' : 'Free'}
              </Text>
            </View>
          </View>
          {!user?.is_pro && (
            <TouchableOpacity style={styles.upgradeBtn}>
              <Text style={styles.upgradeBtnText}>Upgrade to Pro — $4.99/mo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ About</Text>
        <View style={styles.card}>
          <MenuItem label="Privacy Policy" />
          <MenuItem label="Terms of Service" />
          <MenuItem label="Version" value="1.0.0" />
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function MenuItem({ label, value }: { label: string; value?: string }) {
  return (
    <View style={menuStyles.row}>
      <Text style={menuStyles.label}>{label}</Text>
      <Text style={menuStyles.value}>{value || '→'}</Text>
    </View>
  );
}

const menuStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  label: {
    fontSize: 15,
    color: theme.colors.text,
  },
  value: {
    fontSize: 15,
    color: theme.colors.textMuted,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.colors.text,
  },
  disabledInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.colors.fill,
  },
  disabledText: {
    fontSize: 16,
    color: theme.colors.textMuted,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  planBadge: {
    backgroundColor: theme.colors.fill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  proBadge: {
    backgroundColor: '#7C3AED',
  },
  planBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  proBadgeText: {
    color: '#FFF',
  },
  upgradeBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  upgradeBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
  logoutBtn: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  logoutText: {
    color: theme.colors.danger,
    fontWeight: '600',
    fontSize: 16,
  },
});
