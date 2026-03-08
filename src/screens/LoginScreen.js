import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/config';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      Alert.alert('خطا', 'لطفاً نام کاربری و رمز عبور را وارد کنید');
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (e) {
      Alert.alert('خطا', e.message || 'ورود ناموفق بود');
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>توار</Text>
          <Text style={styles.logoSub}>پیام‌رسان تیمی</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>نام کاربری</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="نام کاربری"
            autoCapitalize="none"
            textAlign="right"
            writingDirection="rtl"
          />

          <Text style={styles.label}>رمز عبور</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="رمز عبور"
            secureTextEntry
            textAlign="right"
            writingDirection="rtl"
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>ورود</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>توار v2.0</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  logoBox: { alignItems: 'center', marginBottom: 40 },
  logoText: { fontSize: 52, fontWeight: 'bold', color: '#fff' },
  logoSub: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 8 },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  label: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 6, textAlign: 'right' },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    padding: 12, marginBottom: 16, fontSize: 15,
    backgroundColor: COLORS.background, color: COLORS.text,
  },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    padding: 14, alignItems: 'center', marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footer: { textAlign: 'center', color: 'rgba(255,255,255,0.6)', marginTop: 24, fontSize: 12 },
});
