import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WS_URL } from '../utils/config';

const WSContext = createContext(null);

export function WSProvider({ children, user }) {
  const ws = useRef(null);
  const listeners = useRef([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const reconnectTimer = useRef(null);

  const connect = useCallback(async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token || !user) return;
    try {
      if (ws.current) ws.current.close();
      ws.current = new WebSocket(`${WS_URL}?token=${token}`);

      ws.current.onopen = () => {
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
        // ping every 25s
        ws.current._ping = setInterval(() => {
          if (ws.current?.readyState === 1)
            ws.current.send(JSON.stringify({ type: 'ping' }));
        }, 25000);
      };

      ws.current.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'online_users') setOnlineUsers(msg.users);
          if (msg.type === 'user_online') setOnlineUsers(prev => [...prev.filter(u => u.userId !== msg.userId), { userId: msg.userId, name: msg.name }]);
          if (msg.type === 'user_offline') setOnlineUsers(prev => prev.filter(u => u.userId !== msg.userId));
          listeners.current.forEach(fn => fn(msg));
        } catch (err) {}
      };

      ws.current.onclose = () => {
        clearInterval(ws.current?._ping);
        reconnectTimer.current = setTimeout(connect, 4000);
      };

      ws.current.onerror = () => {
        ws.current?.close();
      };
    } catch (err) {}
  }, [user]);

  useEffect(() => {
    if (user) connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      clearInterval(ws.current?._ping);
      ws.current?.close();
    };
  }, [user, connect]);

  function addListener(fn) {
    listeners.current.push(fn);
    return () => { listeners.current = listeners.current.filter(l => l !== fn); };
  }

  function sendTyping(chatId) {
    if (ws.current?.readyState === 1)
      ws.current.send(JSON.stringify({ type: 'typing', chatId }));
  }

  return (
    <WSContext.Provider value={{ onlineUsers, addListener, sendTyping }}>
      {children}
    </WSContext.Provider>
  );
}

export const useWS = () => useContext(WSContext);
