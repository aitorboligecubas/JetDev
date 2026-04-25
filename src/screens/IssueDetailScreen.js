import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBadge, Avatar, TagChip } from '../components/Shared';
import { Colors } from '../constants/theme';

export default function IssueDetailScreen({ route, navigation }) {
  const issueId = route?.params?.id || 'EVENT-2';
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
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
        <TouchableOpacity style={[styles.tab, styles.activeTab]}>
          <Text style={[styles.tabText, styles.activeTabText]}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('Activity', { id: issueId })}>
          <Text style={styles.tabText}>Activity 💬2</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Metadata grid */}
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Type</Text>
            <StatusBadge type="Epic" label="Epic" />
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Priority</Text>
            <StatusBadge type="N" label="Normal" />
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>State</Text>
            <StatusBadge type="I" label="In progress" />
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Assignee</Text>
            <View style={styles.assigneeRow}>
              <Avatar initials="CP" color={Colors.brandPink} size={22} />
              <Text style={styles.assigneeName}>Carry P</Text>
            </View>
          </View>
        </View>

        {/* Info rows */}
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>Visible to issue readers</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>Created by Ana Bartasheva almost 4 years ago</Text>
        </View>

        {/* Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invitations</Text>
          <View style={styles.tagsRow}>
            <TagChip label="Star" />
            <TagChip label="App development" color="pink" />
          </View>
        </View>

        {/* Links */}
        <TouchableOpacity style={styles.linksRow}>
          <View>
            <Text style={styles.linksTitle}>Links</Text>
            <Text style={styles.linksDesc}>2 is related to, 4 parent for, 1 subtask</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  metaItem: { width: '46%', gap: 4 },
  metaLabel: { fontSize: 12, color: Colors.textTertiary },
  assigneeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  assigneeName: { fontSize: 14 },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  infoText: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  section: { paddingHorizontal: 16, paddingVertical: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  tagsRow: { flexDirection: 'row', gap: 8 },
  linksRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  linksTitle: { fontSize: 14, fontWeight: '600' },
  linksDesc: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
});
