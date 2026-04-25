import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SectionHeader, Avatar } from '../components/Shared';
import { Colors } from '../constants/theme';
import { notifications as notifData } from '../constants/data';

const tabs = ['All', 'Mentions', 'Subscriptions'];

export default function NotificationsScreen() {
  const [activeTab, setActiveTab] = useState('Subscriptions');
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <SectionHeader title="Notifications" showDots />

      {/* Tabs */}
      <View style={styles.tabRow}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView>
        {notifData.map(n => (
          <View key={n.id} style={styles.notifItem}>
            {n.tag && (
              <View style={styles.tagRow}>
                <Text style={styles.tagId}>{n.tag.id}</Text>
                <Text style={styles.tagLabel}>{n.tag.label}</Text>
              </View>
            )}
            <View style={styles.notifContent}>
              <Avatar initials={n.avatar.initials} color={n.avatar.color} size={32} />
              <View style={styles.notifBody}>
                <View style={styles.notifHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifName}>{n.name}</Text>
                    <Text style={styles.notifAction}>{n.action}</Text>
                  </View>
                  {n.emoji && <Text style={styles.emoji}>{n.emoji}</Text>}
                </View>
                {n.text ? <Text style={styles.notifText} numberOfLines={3}>{n.text}</Text> : null}
                {n.link && (
                  <TouchableOpacity>
                    <Text style={styles.linkText}>{n.link}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8 },
  tab: { flex: 1, paddingBottom: 8, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: Colors.accentBlue },
  tabText: { fontSize: 14, fontWeight: '500', color: Colors.textTertiary },
  activeTabText: { color: Colors.accentBlue },
  notifItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tagId: { fontSize: 12, fontWeight: '600', color: Colors.accentBlue },
  tagLabel: { fontSize: 12, color: Colors.textSecondary },
  notifContent: { flexDirection: 'row', gap: 12 },
  notifBody: { flex: 1 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  notifName: { fontSize: 14, fontWeight: '600' },
  notifAction: { fontSize: 12, color: Colors.textTertiary, marginTop: 1 },
  emoji: { fontSize: 18 },
  notifText: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, lineHeight: 20 },
  linkText: { fontSize: 14, color: Colors.accentBlue, marginTop: 4 },
});
