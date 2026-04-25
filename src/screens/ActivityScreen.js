import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../components/Shared';
import { Colors } from '../constants/theme';
import { activities } from '../constants/data';

export default function ActivityScreen({ route, navigation }) {
  const issueId = route?.params?.id || 'DEV-95';
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView style={[styles.container, { paddingTop: insets.top + 8 }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <View style={styles.navLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.accentBlue} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>{issueId}</Text>
        </View>
        <View style={styles.navRight}>
          <Text style={styles.voteText}>0 👍</Text>
          <TouchableOpacity>
            <Ionicons name="star-outline" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.dotsText}>···</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tab} onPress={() => navigation.goBack()}>
          <Text style={styles.tabText}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, styles.activeTab]}>
          <Text style={[styles.tabText, styles.activeTabText]}>Activity 💬3</Text>
        </TouchableOpacity>
      </View>

      {/* Activity feed */}
      <ScrollView style={styles.feed} contentContainerStyle={{ padding: 16 }}>
        {activities.map((item, i) => (
          <View key={i} style={styles.timelineItem}>
            {/* Connector line */}
            {i < activities.length - 1 && <View style={styles.connector} />}
            {/* Avatar */}
            <View style={styles.avatarCol}>
              {item.user ? (
                <Avatar initials={item.initials} color={item.color} size={32} />
              ) : (
                <View style={styles.clockAvatar}>
                  <Ionicons name="time-outline" size={14} color={Colors.textTertiary} />
                </View>
              )}
            </View>
            {/* Content */}
            <View style={styles.contentCol}>
              {item.user && <Text style={styles.userName}>{item.user}</Text>}
              <Text style={styles.timeText}>{item.time}</Text>
              <Text style={styles.activityText}>
                {item.text}
                {item.link && <Text style={styles.linkText}> {item.link}</Text>}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom input */}
      <View style={styles.bottomInput}>
        <TextInput placeholder="@mention people" placeholderTextColor={Colors.textTertiary} style={styles.mentionInput} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { marginLeft: -4 },
  navTitle: { fontSize: 18, fontWeight: '700' },
  voteText: { fontSize: 14, color: Colors.textTertiary },
  dotsText: { color: Colors.accentBlue, fontSize: 20, fontWeight: '700', letterSpacing: 2 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingHorizontal: 16 },
  tab: { paddingBottom: 10, marginRight: 24 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: Colors.accentBlue },
  tabText: { fontSize: 14, fontWeight: '500', color: Colors.textTertiary },
  activeTabText: { color: Colors.accentBlue },
  feed: { flex: 1 },
  timelineItem: { flexDirection: 'row', marginBottom: 20, position: 'relative' },
  connector: { position: 'absolute', left: 15, top: 40, bottom: -12, width: 2, backgroundColor: Colors.border },
  avatarCol: { marginRight: 12 },
  clockAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  contentCol: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  timeText: { fontSize: 12, color: Colors.textTertiary, marginBottom: 4 },
  activityText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  linkText: { color: Colors.accentBlue },
  bottomInput: { borderTopWidth: 1, borderTopColor: Colors.border, paddingHorizontal: 16, paddingVertical: 12 },
  mentionInput: { backgroundColor: Colors.bgSecondary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
});
