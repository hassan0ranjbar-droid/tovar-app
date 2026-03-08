import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, Modal, TextInput, ActivityIndicator, ScrollView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { COLORS } from '../utils/config';

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function AdminScreen() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'user' });
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [u, g] = await Promise.all([api.getUsers(), api.getGroups()]);
      setUsers(u);
      setGroups(g);
    } catch (e) {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAddUser() {
    if (!newUser.username || !newUser.password || !newUser.name) {
      Alert.alert('خطا', 'همه فیلدها را پر کنید');
      return;
    }
    setSaving(true);
    try {
      await api.createUser(newUser);
      Alert.alert('✅', 'کاربر اضافه شد');
      setShowAddUser(false);
      setNewUser({ username: '', password: '', name: '', role: 'user' });
      load();
    } catch (e) { Alert.alert('خطا', e.message); }
    setSaving(false);
  }

  async function handleDeleteUser(u) {
    Alert.alert('حذف کاربر', `آیا می‌خواهید "${u.name}" را حذف کنید؟`, [
      { text: 'لغو', style: 'cancel' },
      {
        text: 'حذف', style: 'destructive',
        onPress: async () => {
          try { await api.deleteUser(u.id); load(); }
          catch (e) { Alert.alert('خطا', e.message); }
        }
      }
    ]);
  }

  async function handleAddGroup() {
    if (!newGroup.name) { Alert.alert('خطا', 'نام گروه الزامی است'); return; }
    setSaving(true);
    try {
      await api.createGroup({ ...newGroup, members: users.map(u => u.id) });
      Alert.alert('✅', 'گروه ایجاد شد');
      setShowAddGroup(false);
      setNewGroup({ name: '', description: '' });
      load();
    } catch (e) { Alert.alert('خطا', e.message); }
    setSaving(false);
  }

  if (user?.role !== 'admin') {
    return (
      <View style={styles.center}>
        <Text style={styles.noAccess}>🔒 دسترسی ندارید</Text>
      </View>
    );
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>;

  return (
    <ScrollView style={styles.container}>
      {/* Users */}
      <Section title={`👥 کاربران (${users.length})`}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddUser(true)}>
          <Text style={styles.addBtnText}>+ افزودن کاربر</Text>
        </TouchableOpacity>
        {users.map(u => (
          <View key={u.id} style={styles.listItem}>
            <View style={[styles.smallAvatar, { backgroundColor: u.role === 'admin' ? COLORS.danger : COLORS.blue }]}>
              <Text style={styles.smallAvatarText}>{u.avatar || u.name.charAt(0)}</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{u.name}</Text>
              <Text style={styles.itemSub}>@{u.username} • {u.role === 'admin' ? '👑 ادمین' : 'کاربر'}</Text>
            </View>
            {u.id !== '1' && (
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteUser(u)}>
                <Text style={styles.deleteBtnText}>🗑️</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </Section>

      {/* Groups */}
      <Section title={`💬 گروه‌ها (${groups.length})`}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddGroup(true)}>
          <Text style={styles.addBtnText}>+ ایجاد گروه</Text>
        </TouchableOpacity>
        {groups.map(g => (
          <View key={g.id} style={styles.listItem}>
            <View style={[styles.smallAvatar, { backgroundColor: COLORS.primaryDark }]}>
              <Text style={styles.smallAvatarText}>{g.name.charAt(0)}</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{g.name}</Text>
              <Text style={styles.itemSub}>{g.description || `${g.members?.length || 0} عضو`}</Text>
            </View>
          </View>
        ))}
      </Section>

      {/* Add User Modal */}
      <Modal visible={showAddUser} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>➕ افزودن کاربر جدید</Text>
            {[
              { key: 'name', placeholder: 'نام کامل' },
              { key: 'username', placeholder: 'نام کاربری' },
              { key: 'password', placeholder: 'رمز عبور', secure: true },
            ].map(f => (
              <TextInput
                key={f.key}
                style={styles.input}
                value={newUser[f.key]}
                onChangeText={v => setNewUser(p => ({ ...p, [f.key]: v }))}
                placeholder={f.placeholder}
                secureTextEntry={f.secure}
                textAlign="right"
              />
            ))}
            <TouchableOpacity
              style={[styles.roleToggle, newUser.role === 'admin' && styles.roleToggleActive]}
              onPress={() => setNewUser(p => ({ ...p, role: p.role === 'admin' ? 'user' : 'admin' }))}
            >
              <Text style={[styles.roleToggleText, newUser.role === 'admin' && styles.roleToggleTextActive]}>
                {newUser.role === 'admin' ? '👑 ادمین' : '👤 کاربر عادی'}
              </Text>
            </TouchableOpacity>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddUser(false)}>
                <Text style={styles.cancelText}>لغو</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddUser} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>افزودن</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Group Modal */}
      <Modal visible={showAddGroup} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>➕ ایجاد گروه جدید</Text>
            <TextInput
              style={styles.input} value={newGroup.name}
              onChangeText={v => setNewGroup(p => ({ ...p, name: v }))}
              placeholder="نام گروه" textAlign="right"
            />
            <TextInput
              style={styles.input} value={newGroup.description}
              onChangeText={v => setNewGroup(p => ({ ...p, description: v }))}
              placeholder="توضیحات (اختیاری)" textAlign="right"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddGroup(false)}>
                <Text style={styles.cancelText}>لغو</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddGroup} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>ایجاد</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noAccess: { fontSize: 18, color: COLORS.textSecondary },
  section: { backgroundColor: '#fff', margin: 12, borderRadius: 12, overflow: 'hidden', padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, textAlign: 'right', marginBottom: 12 },
  addBtn: {
    backgroundColor: COLORS.primary, borderRadius: 8,
    padding: 10, alignItems: 'center', marginBottom: 12,
  },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  listItem: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  smallAvatar: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  smallAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  itemInfo: { flex: 1, marginRight: 10 },
  itemName: { fontSize: 15, fontWeight: '600', color: COLORS.text, textAlign: 'right' },
  itemSub: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'right' },
  deleteBtn: { padding: 6 },
  deleteBtnText: { fontSize: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'right', marginBottom: 16, color: COLORS.text },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    padding: 12, marginBottom: 12, fontSize: 15, backgroundColor: COLORS.background,
    textAlign: 'right',
  },
  roleToggle: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    padding: 12, alignItems: 'center', marginBottom: 12,
  },
  roleToggleActive: { borderColor: COLORS.primary, backgroundColor: '#E8F5E9' },
  roleToggleText: { fontSize: 14, color: COLORS.textSecondary },
  roleToggleTextActive: { color: COLORS.primary, fontWeight: 'bold' },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { padding: 12, borderRadius: 8, backgroundColor: COLORS.background },
  cancelText: { color: COLORS.textSecondary, fontSize: 14 },
  saveBtn: { padding: 12, borderRadius: 8, backgroundColor: COLORS.primary, minWidth: 80, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
