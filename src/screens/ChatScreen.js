import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, Modal, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../context/AuthContext';
import { useWS } from '../context/WebSocketContext';
import { api } from '../utils/api';
import { COLORS, SERVER_URL } from '../utils/config';

function Avatar({ name, color = COLORS.primary, size = 32 }) {
  const letter = name ? name.charAt(0) : '?';
  return (
    <View style={[{ width: size, height: size, borderRadius: size/2, backgroundColor: color, justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: size * 0.45 }}>{letter}</Text>
    </View>
  );
}

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatScreen({ route, navigation }) {
  const { type, id, name } = route.params;
  const { user } = useAuth();
  const { addListener, sendTyping } = useWS();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [editText, setEditText] = useState('');
  const [editing, setEditing] = useState(false);
  const flatRef = useRef(null);
  const typingTimer = useRef(null);

  const chatId = type === 'group' ? id : `dm_${[user.id, id].sort().join('_')}`;

  const loadMessages = useCallback(async () => {
    try {
      const msgs = await api.getMessages(
        type === 'group' ? id : null,
        type === 'direct' ? id : null
      );
      setMessages(msgs);
    } catch (e) {}
    setLoading(false);
  }, [type, id]);

  useEffect(() => {
    navigation.setOptions({ title: name });
    loadMessages();
  }, [loadMessages, name]);

  useEffect(() => {
    const remove = addListener((msg) => {
      if (msg.type === 'new_message') {
        const m = msg.message;
        const belongsHere =
          (type === 'group' && m.groupId === id) ||
          (type === 'direct' && ((m.fromId === id && m.toId === user.id) || (m.fromId === user.id && m.toId === id)));
        if (belongsHere) {
          setMessages(prev => [...prev, m]);
          setTimeout(() => flatRef.current?.scrollToEnd(), 100);
        }
      }
      if (msg.type === 'message_edited') {
        setMessages(prev => prev.map(m => m.id === msg.message.id ? msg.message : m));
      }
      if (msg.type === 'message_deleted') {
        setMessages(prev => prev.map(m => m.id === msg.messageId ? { ...m, deleted: true, text: 'این پیام حذف شد' } : m));
      }
      if (msg.type === 'typing' && msg.chatId === chatId && msg.userId !== user.id) {
        setTypingUser(msg.name);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTypingUser(null), 3000);
      }
    });
    return remove;
  }, [addListener, type, id, user, chatId]);

  async function handleSend() {
    if (!text.trim() || sending) return;
    const t = text.trim();
    setText('');
    setSending(true);
    try {
      await api.sendMessage({
        text: t,
        groupId: type === 'group' ? id : null,
        toId: type === 'direct' ? id : null,
      });
    } catch (e) {
      Alert.alert('خطا', e.message);
      setText(t);
    }
    setSending(false);
  }

  async function handleSendImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const formData = new FormData();
    formData.append('file', { uri: asset.uri, type: 'image/jpeg', name: 'photo.jpg' });
    if (type === 'group') formData.append('groupId', id);
    else formData.append('toId', id);
    try {
      await api.sendFile(formData);
    } catch (e) {
      Alert.alert('خطا', e.message);
    }
  }

  async function handleSendFile() {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    const formData = new FormData();
    formData.append('file', { uri: asset.uri, type: asset.mimeType || 'application/octet-stream', name: asset.name });
    if (type === 'group') formData.append('groupId', id);
    else formData.append('toId', id);
    try {
      await api.sendFile(formData);
    } catch (e) {
      Alert.alert('خطا', e.message);
    }
  }

  function handleLongPress(msg) {
    if (msg.deleted) return;
    const isOwn = msg.fromId === user.id;
    const options = [];
    if (isOwn || user.role === 'admin') {
      options.push({ text: '✏️ ویرایش', onPress: () => { setEditing(true); setEditText(msg.text); setSelectedMsg(msg); } });
      options.push({ text: '🗑️ حذف', style: 'destructive', onPress: () => handleDelete(msg) });
    }
    options.push({ text: '📌 پین', onPress: () => handlePin(msg) });
    options.push({ text: 'لغو', style: 'cancel' });
    Alert.alert('پیام', msg.text?.substring(0, 50), options);
  }

  async function handleDelete(msg) {
    try { await api.deleteMessage(msg.id); } catch (e) { Alert.alert('خطا', e.message); }
  }

  async function handlePin(msg) {
    try {
      await api.pinMessage(chatId, msg.id);
      Alert.alert('✅', 'پیام پین شد');
    } catch (e) { Alert.alert('خطا', e.message); }
  }

  async function handleEdit() {
    if (!editText.trim()) return;
    try {
      await api.editMessage(selectedMsg.id, editText.trim());
      setEditing(false);
      setSelectedMsg(null);
    } catch (e) { Alert.alert('خطا', e.message); }
  }

  function handleTyping(val) {
    setText(val);
    sendTyping(chatId);
  }

  if (loading) return (
    <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={i => i.id}
        style={styles.msgList}
        contentContainerStyle={{ padding: 10 }}
        onLayout={() => flatRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => {
          const isOwn = item.fromId === user.id;
          return (
            <TouchableOpacity
              onLongPress={() => handleLongPress(item)}
              activeOpacity={0.8}
              style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}
            >
              {!isOwn && type === 'group' && (
                <Text style={styles.senderName}>{item.fromName}</Text>
              )}
              {item.file && (
                <View style={styles.fileBox}>
                  {item.file.url?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <Image
                      source={{ uri: `${SERVER_URL}${item.file.url}` }}
                      style={styles.fileImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.fileText}>📎 {item.file.name}</Text>
                  )}
                </View>
              )}
              <Text style={[styles.msgText, item.deleted && styles.deletedText]}>
                {item.text}
              </Text>
              <View style={styles.msgMeta}>
                {item.edited && <Text style={styles.editedLabel}>ویرایش شده</Text>}
                <Text style={styles.msgTime}>{formatTime(item.createdAt)}</Text>
                {isOwn && <Text style={styles.readTick}>{item.readBy?.length > 1 ? '✓✓' : '✓'}</Text>}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Typing indicator */}
      {typingUser && (
        <Text style={styles.typing}>{typingUser} در حال تایپ...</Text>
      )}

      {/* Edit modal */}
      <Modal visible={editing} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>ویرایش پیام</Text>
            <TextInput
              style={styles.editInput}
              value={editText}
              onChangeText={setEditText}
              multiline
              textAlign="right"
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditing(false)}>
                <Text style={styles.modalCancelText}>لغو</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleEdit}>
                <Text style={styles.modalSaveText}>ذخیره</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={handleSend} disabled={sending}>
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={handleTyping}
          placeholder="پیامی بنویسید..."
          multiline
          textAlign="right"
          writingDirection="rtl"
          maxLength={2000}
        />
        <TouchableOpacity style={styles.iconBtn} onPress={handleSendImage}>
          <Text style={styles.attachIcon}>🖼️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={handleSendFile}>
          <Text style={styles.attachIcon}>📎</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.chatBg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  msgList: { flex: 1 },
  bubble: {
    maxWidth: '80%', borderRadius: 12, padding: 10,
    marginVertical: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08,
    shadowRadius: 2, elevation: 2,
  },
  bubbleOwn: { backgroundColor: COLORS.myMessage, alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  bubbleOther: { backgroundColor: '#fff', alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  senderName: { fontSize: 12, color: COLORS.primaryDark, fontWeight: 'bold', marginBottom: 3, textAlign: 'right' },
  msgText: { fontSize: 15, color: COLORS.text, textAlign: 'right', lineHeight: 22 },
  deletedText: { color: COLORS.textSecondary, fontStyle: 'italic' },
  msgMeta: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 3 },
  msgTime: { fontSize: 11, color: COLORS.textSecondary },
  readTick: { fontSize: 11, color: COLORS.primaryDark, marginLeft: 3 },
  editedLabel: { fontSize: 10, color: COLORS.textSecondary, marginRight: 4 },
  fileBox: { marginBottom: 6 },
  fileImage: { width: 200, height: 150, borderRadius: 8 },
  fileText: { fontSize: 13, color: COLORS.blue },
  typing: { paddingHorizontal: 16, paddingVertical: 4, fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: 8, backgroundColor: '#fff',
    borderTopWidth: 0.5, borderTopColor: COLORS.border,
  },
  input: {
    flex: 1, backgroundColor: COLORS.background, borderRadius: 24,
    paddingHorizontal: 14, paddingVertical: 8,
    fontSize: 15, maxHeight: 120,
  },
  iconBtn: { padding: 8 },
  sendIcon: { fontSize: 22, color: COLORS.primary },
  attachIcon: { fontSize: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'right', marginBottom: 12, color: COLORS.text },
  editInput: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    padding: 12, fontSize: 15, minHeight: 80,
    backgroundColor: COLORS.background, textAlignVertical: 'top',
  },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 10 },
  modalCancelBtn: { padding: 12, borderRadius: 8, backgroundColor: COLORS.background },
  modalCancelText: { color: COLORS.textSecondary, fontSize: 14 },
  modalSaveBtn: { padding: 12, borderRadius: 8, backgroundColor: COLORS.primary, minWidth: 80, alignItems: 'center' },
  modalSaveText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
