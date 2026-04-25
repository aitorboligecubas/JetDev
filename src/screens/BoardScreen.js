import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchBar, StatusBadge } from '../components/Shared';
import { Colors } from '../constants/theme';
import { epics } from '../constants/data';

export default function BoardScreen() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Product launch Epic</Text>
          <Ionicons name="chevron-down" size={16} color={Colors.textTertiary} />
        </View>
        <TouchableOpacity>
          <Ionicons name="filter-outline" size={20} color={Colors.accentBlue} />
        </TouchableOpacity>
      </View>

      <SearchBar placeholder="Enter search request" />

      {/* Column headers */}
      <View style={styles.colHeaders}>
        <Text style={styles.colHeaderText}>OPEN</Text>
        <Text style={styles.colHeaderText}>DEVEL</Text>
      </View>

      {/* Board */}
      <ScrollView style={styles.boardScroll} contentContainerStyle={{ padding: 16, gap: 16 }}>
        {epics.map((epic, i) => (
          <View key={i}>
            <View style={styles.epicHeader}>
              <Ionicons name={epic.collapsed ? 'chevron-forward' : 'chevron-down'} size={14} color={Colors.textTertiary} />
              <Text style={styles.epicName}>{epic.name}</Text>
              {epic.tag && (
                <View style={styles.epicTag}>
                  <Text style={styles.epicTagText}>{epic.tag}</Text>
                </View>
              )}
            </View>

            {!epic.collapsed && epic.cards.map((card, j) => (
              <View key={j} style={[styles.card, { borderLeftColor: card.borderColor }]}>
                <Text style={styles.cardId}>{card.id}</Text>
                {card.title ? <Text style={styles.cardTitle}>{card.title}</Text> : null}
                {card.tags.length > 0 && (
                  <View style={styles.cardTags}>
                    {card.tags.map(t => <StatusBadge key={t} type={t} />)}
                  </View>
                )}
              </View>
            ))}

            {!epic.collapsed && (
              <TouchableOpacity style={styles.addCard}>
                <Text style={styles.addCardText}>+ Add card</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  colHeaders: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  colHeaderText: { flex: 1, fontSize: 12, fontWeight: '600', color: Colors.textTertiary, letterSpacing: 1 },
  boardScroll: { flex: 1 },
  epicHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  epicName: { fontSize: 14, fontWeight: '600' },
  epicTag: { backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  epicTagText: { fontSize: 12, color: Colors.accentBlue, fontWeight: '500' },
  card: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    marginLeft: 16,
  },
  cardId: { fontSize: 12, color: Colors.textTertiary },
  cardTitle: { fontSize: 14, fontWeight: '500', marginTop: 4 },
  cardTags: { flexDirection: 'row', gap: 6, marginTop: 8 },
  addCard: { marginLeft: 16, marginTop: 4 },
  addCardText: { fontSize: 14, color: Colors.accentBlue, fontWeight: '500' },
});
