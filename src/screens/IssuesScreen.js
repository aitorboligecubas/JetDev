import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SectionHeader, SearchBar, Avatar, TagChip } from '../components/Shared';
import { Colors } from '../constants/theme';
import { issues } from '../constants/data';

const typeColors = { N: '#59A869', C: '#F5760A', E: '#0060FF' };
const filters = ['Project', 'Assignee', 'State', 'Type'];

export default function IssuesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <SectionHeader title="Event Management Dept" showPlus showDots />
      <SearchBar placeholder="Find issues that contain key words" />

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.filtersRow}>
        {filters.map(f => (
          <TouchableOpacity key={f} style={styles.filterChip}>
            <Text style={styles.filterChipText}>{f}</Text>
            <Ionicons name="chevron-down" size={12} color={Colors.textTertiary} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.matchCount}>Matches 1301 issues</Text>

      <ScrollView style={styles.list}>
        {issues.map((issue, i) => (
          <TouchableOpacity
            key={issue.id}
            style={styles.issueItem}
            onPress={() => navigation.navigate('IssueDetail', { id: issue.id })}
            activeOpacity={0.6}
          >
            <View style={[styles.typeCircle, { backgroundColor: typeColors[issue.type] }]}>
              <Text style={styles.typeText}>{issue.type}</Text>
            </View>
            <View style={styles.issueContent}>
              <View style={styles.issueTopRow}>
                <Text style={styles.issueId}>{issue.id}</Text>
                <Text style={styles.issueTime}>{issue.time}</Text>
              </View>
              <Text style={styles.issueTitle}>{issue.title}</Text>
              {issue.tag && (
                <View style={{ marginTop: 4 }}>
                  <TagChip label={issue.tag} />
                </View>
              )}
            </View>
            <Avatar initials={issue.avatar.initials} color={issue.avatar.color} size={28} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  filtersRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 0,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  filterChipText: { fontSize: 14, color: Colors.textSecondary },
  matchCount: { fontSize: 12, color: Colors.textTertiary, paddingHorizontal: 16, paddingVertical: 4 },
  list: { flex: 1 },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  typeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  typeText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  issueContent: { flex: 1 },
  issueTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  issueId: { fontSize: 12, color: Colors.textTertiary },
  issueTime: { fontSize: 12, color: Colors.textTertiary },
  issueTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
});
