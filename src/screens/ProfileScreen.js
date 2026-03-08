import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  TextInput, ScrollView, Modal, ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { COLORS } from '../utils/config';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [showChangePass, setShowChangePass] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleChangePassword() {
    if (newPass !== confirmPass) {
      Alert.alert('خطا', 'رمز جدید و تکرار آن یکسان نیستند');
      return;
    }
    if (newPass.length < 4) {
      Alert.alert('خطا', 'رمز جدید باید حداقل ۴ کاراکتر باشد');
      return;
    }
    setLoading(true);
    try {
      await api.changePassword(oldPass, newPass);
      Alert.alert('✅', 'رمز عبور تغییر کرد');
      setShowChangePass(false);
      setOldPass(''); setNewPass(''); setConfirmPass('');
    } catch (e) {
      Alert.alert('خطا', e.message);
    }
    setLoading(false);
  }

  function handleLogout() {
    Alert.alert('خروج', 'آیا می‌خواهید از حساب خود خارج شوید؟', [
      { text: 'لغو', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <ScrollView style={styles.container}>
      {/* Avatar */}
      <View style={styles.header}>
        <View style={styles.bigAvatar}>
          <Text style={styles.bigAvatarText}>{user?.avatar || user?.name?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.username}>@{user?.username}</Text>
        {user?.role === 'admin' && (
          <View style={styles.adminBadge}><Text style={styles.adminText}>👑 ادمین</Text></View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.item} onPress={() => setShowChangePass(true)}>
          <Text style={styles.itemText}>🔑 تغییر رمز عبور</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.item, styles.logoutItem]} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 خروج از حساب</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>توار v2.0</Text>

      {/* Change Password Modal */}
      <Modal visible={showChangePass} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>تغییر رمز عبور</Text>
            <TextInput
              style={styles.input} value={oldPass} onChangeText={setOldPass}
              placeholder="رمز فعلی" secureTextEntry textAlign="right"
            />
            <TextInput
              style={styles.input} value={newPass} onChangeText={setNewPass}
              placeholder="رمز جدید" secureTextEntry textAlign="right"
            />
            <TextInput
              style={styles.input} value={confirmPass} onChangeText={setConfirmPass}
              placeholder="تکرار رمز جدید" secureTextEntry textAlign="right"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowChangePass(false)}>
                <Text style={styles.cancelText}>لغو</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>ذخیره</Text>}
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
  header: { alignItems: 'center', padding: 32, backgroundColor: '#fff' },
  bigAvatar: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  bigAvatarText: { fontSize: 40, color: '#fff', fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  username: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  adminBadge: {
    backgroundColor: '#FFF3CD', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 4, marginTop: 8,
  },
  adminText: { fontSize: 13, color: '#856404' },
  section: { backgroundColor: '#fff', marginTop: 16, borderRadius: 12, marginHorizontal: 16, overflow: 'hidden' },
  item: { padding: 16, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  itemText: { fontSize: 16, color: COLORS.text, textAlign: 'right' },
  logoutItem: { borderBottomWidth: 0 },
  logoutText: { fontSize: 16, color: COLORS.danger, textAlign: 'right' },
  version: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 32, fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'right', marginBottom: 16, color: COLORS.text },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    padding: 12, marginBottom: 12, fontSize: 15, backgroundColor: COLORS.background,
  },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  cancelBtn: { padding: 12, borderRadius: 8, backgroundColor: COLORS.background },
  cancelText: { color: COLORS.textSecondary, fontSize: 14 },
  saveBtn: { padding: 12, borderRadius: 8, backgroundColor: COLORS.primary, minWidth: 80, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
