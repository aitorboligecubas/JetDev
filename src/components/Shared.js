import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';

/* ─── Avatar ─── */
export function Avatar({ initials, color = Colors.accentBlue, size = 32 }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

/* ─── TagChip ─── */
export function TagChip({ label, color }) {
  const bg = color === 'pink' ? '#FFE8F0' : '#F0F0F0';
  const textColor = color === 'pink' ? Colors.brandPink : Colors.textSecondary;
  return (
    <View style={[styles.tagChip, { backgroundColor: bg }]}>
      <Text style={[styles.tagChipText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

/* ─── StatusBadge ─── */
const badgeConfigs = {
  N: { bg: '#E8F5E9', color: '#2E7D32', letter: 'N', text: 'Normal' },
  Bug: { bg: '#FFEBEE', color: '#CC0000', letter: '', text: 'Bug' },
  Epic: { bg: '#E3F2FD', color: '#0060FF', letter: 'E', text: 'Epic' },
  C: { bg: '#FFF3E0', color: '#F5760A', letter: 'C', text: 'Critical' },
  I: { bg: '#FFF3E0', color: '#F5760A', letter: 'I', text: 'In progress' },
  Kotlin: { bg: '#1A1A1A', color: '#FFFFFF', letter: '', text: 'Kotlin' },
};

export function StatusBadge({ type, label }) {
  const c = badgeConfigs[type] || badgeConfigs.N;
  const displayText = label || c.text;
  return (
    <View style={[styles.statusBadge, { backgroundColor: c.bg }]}>
      {c.letter ? <Text style={[styles.statusBadgeLetter, { color: c.color }]}>{c.letter}</Text> : null}
      <Text style={[styles.statusBadgeText, { color: c.color }]}>{displayText}</Text>
    </View>
  );
}

/* ─── SearchBar ─── */
export function SearchBar({ placeholder = 'Search...' }) {
  return (
    <View style={styles.searchWrapper}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={Colors.textTertiary} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          style={styles.searchInput}
        />
      </View>
    </View>
  );
}

/* ─── SectionHeader ─── */
export function SectionHeader({ title, showPlus, showDots, onBack, rightContent }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.accentBlue} />
          </TouchableOpacity>
        )}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionHeaderRight}>
        {rightContent}
        {showPlus && (
          <TouchableOpacity style={styles.plusButton}>
            <Ionicons name="add" size={20} color="#FFF" />
          </TouchableOpacity>
        )}
        {showDots && (
          <TouchableOpacity>
            <Text style={styles.dotsText}>···</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: '600',
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 3,
    alignSelf: 'flex-start',
  },
  statusBadgeLetter: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 36,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    marginLeft: -4,
    marginRight: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  plusButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsText: {
    color: Colors.accentBlue,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
