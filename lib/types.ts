export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  is_pro: boolean;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface Jar {
  id: string;
  owner_id: string;
  name: string;
  emoji: string;
  color: string;
  balance: number;
  target_amount: number | null;
  is_shared: boolean;
  position: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  jar_id: string;
  user_id: string;
  type: 'fill' | 'spend' | 'transfer_in' | 'transfer_out';
  amount: number;
  note: string | null;
  date: string;
  created_at: string;
  user?: User;
}

export interface JarMember {
  id: string;
  jar_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  invited_at: string;
  accepted_at: string | null;
  user?: User;
}

export const JAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA',
  '#60A5FA', '#34D399', '#F472B6', '#FB923C',
];

export const JAR_EMOJIS = [
  '🏠', '🍕', '✈️', '🎮', '👗', '🚗', '💊', '🎁',
  '💰', '📚', '🎬', '🍿', '☕', '🛒', '💡', '🎉',
  '🐕', '🌴', '💍', '👶', '🎓', '🏋️', '🎸', '📱',
];
