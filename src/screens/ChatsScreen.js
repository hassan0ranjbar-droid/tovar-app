import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, RefreshControl, ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useWS } from '../context/WebSocketContext';
import { api } from '../utils/api';
import { COLORS } from '../utils/config';

function Avatar({ name, color = COLORS.primary, size = 44 }) {
  const letter = name ? name.charAt(0) : '?';
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.45 }]}>{letter}</Text>
    </View>
  );
}

function timeAgo(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'همین الان';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} دقیقه پیش`;
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('fa-IR');
}

export default function ChatsScreen({ navigation }) {
  const { user } = useAuth();
  const { onlineUsers, addListener } = useWS();
  const [tab, setTab] = useState('groups');
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [g, u, allMsgs] = await Promise.all([
        api.getGroups(),
        api.getUsers(),
        // We'll get last messages per group
        Promise.resolve([]),
      ]);
      setGroups(g);
      setUsers(u.filter(u2 => u2.id !== user.id));
    } catch (e) {}
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const remove = addListener((msg) => {
      if (msg.type === 'new_message' || msg.type === 'group_created' || msg.type === 'user_joined') {
        load();
      }
    });
    return remove;
  }, [addListener, load]);

  const filteredGroups = groups.filter(g => g.name.includes(search));
  const filteredUsers = users.filter(u2 => u2.name.includes(search) || u2.username.includes(search));

  function isOnline(userId) {
    return onlineUsers.some(u2 => u2.userId === userId);
  }

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="جستجو..."
          textAlign="right"
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'groups' && styles.tabActive]}
          onPress={() => setTab('groups')}
        >
          <Text style={[styles.tabText, tab === 'groups' && styles.tabTextActive]}>گروه‌ها</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'direct' && styles.tabActive]}
          onPress={() => setTab('direct')}
        >
          <Text style={[styles.tabText, tab === 'direct' && styles.tabTextActive]}>پیام مستقیم</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {tab === 'groups' ? (
        <FlatList
          data={filteredGroups}
          keyExtractor={i => i.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chatItem}
              onPress={() => navigation.navigate('Chat', { type: 'group', id: item.id, name: item.name })}
            >
              <Avatar name={item.name} color={COLORS.primaryDark} />
              <View style={styles.chatInfo}>
                <Text style={styles.chatName}>{item.name}</Text>
                <Text style={styles.chatSub}>{item.description || `${item.members?.length || 0} عضو`}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>گروهی یافت نشد</Text>}
        />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={i => i.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chatItem}
              onPress={() => navigation.navigate('Chat', { type: 'direct', id: item.id, name: item.name })}
            >
              <View>
                <Avatar name={item.name} color={item.role === 'admin' ? COLORS.danger : COLORS.blue} />
                {isOnline(item.id) && <View style={styles.onlineDot} />}
              </View>
              <View style={styles.chatInfo}>
                <Text style={styles.chatName}>{item.name}</Text>
                <Text style={styles.chatSub}>
                  {item.role === 'admin' ? '👑 ادمین' : ''}
                  {isOnline(item.id) ? ' • آنلاین' : ''}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>کاربری یافت نشد</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    margin: 12, backgroundColor: COLORS.background,
    borderRadius: 10, paddingHorizontal: 12,
  },
  searchInput: { flex: 1, padding: 10, fontSize: 15, textAlign: 'right' },
  searchIcon: { fontSize: 16 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, padding: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 14, color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary, fontWeight: 'bold' },
  chatItem: {
    flexDirection: 'row-reverse', padding: 14,
    alignItems: 'center', borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  avatar: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold' },
  chatInfo: { flex: 1, marginRight: 12 },
  chatName: { fontSize: 16, fontWeight: '600', color: COLORS.text, textAlign: 'right' },
  chatSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2, textAlign: 'right' },
  onlineDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: COLORS.primary,
    position: 'absolute', bottom: 0, left: 0,
    borderWidth: 2, borderColor: '#fff',
  },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40, fontSize: 15 },
});
