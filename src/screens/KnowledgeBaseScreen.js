import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SectionHeader, SearchBar } from '../components/Shared';
import { Colors } from '../constants/theme';
import { kbData } from '../constants/data';

export default function KnowledgeBaseScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <SectionHeader title="Knowledge Base" showDots onBack={() => navigation.goBack()} />
      <SearchBar placeholder="Search articles" />

      <View style={styles.linksRow}>
        <TouchableOpacity><Text style={styles.blueLink}>Collapse all</Text></TouchableOpacity>
        <TouchableOpacity style={styles.draftsBtn}>
          <Text style={styles.blueLink}>Drafts</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.accentBlue} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.tree}>
        {kbData.map((section, i) => (
          <View key={i} style={styles.treeSection}>
            <View style={styles.treeSectionHeader}>
              <Ionicons name={section.expanded ? 'chevron-down' : 'chevron-forward'} size={14} color={Colors.textTertiary} />
              <Text style={styles.treeSectionName}>{section.name}</Text>
              {section.expanded && (
                <TouchableOpacity style={{ marginLeft: 'auto' }}>
                  <Ionicons name="star-outline" size={16} color={Colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>

            {section.expanded && section.items.map((item, j) => (
              <View key={j} style={styles.treeItem}>
                <View style={styles.treeItemLeft}>
                  <Text style={styles.treeItemName}>{item.name}</Text>
                  {item.locked && <Ionicons name="lock-closed-outline" size={12} color={Colors.textTertiary} />}
                </View>
                {item.count !== undefined && <Text style={styles.treeItemCount}>{item.count}</Text>}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  linksRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  blueLink: { fontSize: 14, color: Colors.accentBlue },
  draftsBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  tree: { flex: 1, paddingHorizontal: 16 },
  treeSection: { marginBottom: 4 },
  treeSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  treeSectionName: { fontSize: 14, fontWeight: '600' },
  treeItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, paddingLeft: 24,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  treeItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  treeItemName: { fontSize: 14, color: Colors.textPrimary },
  treeItemCount: { fontSize: 12, color: Colors.textTertiary },
});
