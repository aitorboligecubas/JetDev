import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Animated, Easing, Modal, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useToast } from '../components/Toast';
import { JB, Type, Colors } from '../constants/theme';
import { quickPrompts } from '../constants/data';

const historyProjects = [
  { id: 1, name: 'Restaurant Booking API', stack: 'Node.js', time: '3 days ago', url: 'github.com/JetDev-Team/rest-api', status: 'active' },
  { id: 2, name: 'Weather CLI Tool', stack: 'Python', time: '1 week ago', url: 'github.com/JetDev-Team/weather', status: 'down' },
  { id: 3, name: 'Portfolio Site', stack: 'React', time: '2 weeks ago', url: 'github.com/JetDev-Team/portfolio', status: 'active' },
];

const stepperSteps = ['Parse', 'Gen', 'Deploy', 'Preview'];

const terminalLogs = [
  "> Parsing prompt with Junie AI...",
  "> Detected stack: Node.js + Express + PostgreSQL",
  "> Scaffolding project structure...",
  "> Writing route handlers (4 endpoints)...",
  "> Generating Prisma schema...",
  "> Installing dependencies (npm i)...",
  "> Configuring AWS EC2 t3.micro...",
  "> Running health checks...",
];

export default function JetDevScreen() {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState('empty');
  const [prompt, setPrompt] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [logIndex, setLogIndex] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [previewTab, setPreviewTab] = useState('Preview');
  const showToast = useToast();
  const stateRef = useRef(state);
  
  const opacityPulse = useRef(new Animated.Value(1)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const cursorOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => { stateRef.current = state; }, [state]);

  // Generating active pulse (Opacity only for Stepper)
  useEffect(() => {
    if (state === 'generating') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacityPulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
          Animated.timing(opacityPulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      loop.start();
      
      const cursorLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(cursorOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      );
      cursorLoop.start();
      
      return () => { loop.stop(); cursorLoop.stop(); };
    }
  }, [state]);

  // Preview pulse
  useEffect(() => {
    if (state === 'preview') {
      const loop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseScale, { toValue: 1.3, duration: 1000, useNativeDriver: true }),
            Animated.timing(pulseScale, { toValue: 1, duration: 1000, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(opacityPulse, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
            Animated.timing(opacityPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
          ])
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [state]);

  useEffect(() => {
    if (state === 'generating') {
      setLogIndex(0);
      setCurrentStep(0);
      
      const interval = setInterval(() => {
        setLogIndex(prev => {
          const next = prev + 1;
          if (next >= terminalLogs.length) clearInterval(interval);
          
          if (next === 2) setCurrentStep(1);
          if (next === 5) setCurrentStep(2);
          if (next === 7) setCurrentStep(3);
          
          return next;
        });
      }, 1000);

      const timeout = setTimeout(() => {
        if (stateRef.current === 'generating') setState('preview');
      }, 8500);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [state]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -4, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleGenerate = () => {
    if (prompt.trim().length < 5) {
      shake();
      setState('error');
      return;
    }
    if (prompt.toLowerCase().includes('error') || prompt.toLowerCase().includes('falla')) {
      setState('error');
      return;
    }
    setState('generating');
  };

  const handleAccept = () => {
    setState('success');
  };

  const handleDiscard = () => {
    showToast('Environment discarded');
    setState('empty');
    setPrompt('');
  };

  const reset = () => {
    setState('empty');
    setPrompt('');
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top + 8 }]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>JetDev</Text>
        {state === 'empty' && (
          <TouchableOpacity onPress={() => setShowHistory(true)} style={styles.historyBtn}>
            <Text style={styles.historyBtnText}>↗ History</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* STATE A: Empty */}
      {state === 'empty' && (
        <View style={styles.emptyState}>
          <LinearGradient
            colors={[JB.pink, JB.purple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroIconRow}>
              <Text style={styles.heroTitle}>⚡ JetDev</Text>
            </View>
            <Text style={styles.heroSubtitle}>Describe what you want. Junie builds it in the cloud.</Text>

            <Animated.View style={{ transform: [{ translateX: shakeAnim }], width: '100%' }}>
              <TextInput
                value={prompt}
                onChangeText={setPrompt}
                placeholder="Describe your app idea..."
                placeholderTextColor="rgba(255,255,255,0.45)"
                multiline
                style={styles.heroTextarea}
              />
              <TouchableOpacity onPress={handleGenerate} style={styles.heroGenerateBtn} activeOpacity={0.8}>
                <Text style={styles.heroGenerateBtnText}>⚡ Generate with Junie</Text>
              </TouchableOpacity>
            </Animated.View>
          </LinearGradient>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow} contentContainerStyle={{ gap: 8 }}>
            {quickPrompts.map(qp => (
              <TouchableOpacity key={qp.label} onPress={() => setPrompt(qp.prompt)} style={styles.quickChip}>
                <Text style={styles.quickChipText}>{qp.emoji} {qp.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>RECENT PROJECTS</Text>
            {historyProjects.slice(0, 2).map(proj => (
              <TouchableOpacity key={proj.id} style={styles.recentItem}>
                <View style={styles.recentItemTop}>
                  <Text style={styles.recentItemName}>{proj.name}</Text>
                  <Text style={styles.recentItemTime}>{proj.time}</Text>
                </View>
                <View style={styles.tagBlue}>
                  <Text style={styles.tagBlueText}>{proj.stack}</Text>
                </View>
                <View style={styles.recentItemLinkRow}>
                  <View style={[styles.statusDot, { backgroundColor: proj.status === 'active' ? JB.success : JB.warning }]} />
                  <Text style={styles.recentItemLink}>{proj.url}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={JB.text3} style={styles.recentChevron} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* STATE B: Generating */}
      {state === 'generating' && (
        <View style={styles.stateWrapper}>
          <View style={styles.card}>
            <Text style={styles.projectName}>Restaurant Booking API</Text>
            <View style={styles.tagBlue}>
              <Text style={styles.tagBlueText}>Node.js + Express + PostgreSQL</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.stepperContainer}>
              {stepperSteps.map((step, idx) => {
                const isActive = idx === currentStep;
                const isPast = idx < currentStep;
                const isDone = isPast || (currentStep === stepperSteps.length - 1 && isActive);
                
                return (
                  <View key={step} style={styles.stepItem}>
                    <View style={styles.stepCircleRow}>
                      <Animated.View style={[
                        styles.stepCircle, 
                        isDone && styles.stepCircleDone, 
                        isActive && !isDone && styles.stepCircleActive,
                        isActive && !isDone && { opacity: opacityPulse }
                      ]}>
                        {isDone && <Text style={styles.stepDoneIcon}>✓</Text>}
                      </Animated.View>
                      {idx < stepperSteps.length - 1 && (
                        <View style={[styles.stepLine, isPast && styles.stepLineDone]} />
                      )}
                    </View>
                    <Text style={[styles.stepText, isDone && styles.stepTextDone, isActive && !isDone && styles.stepTextActive]}>{step}</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.terminalBox}>
              <View style={styles.terminalHeader}>
                <View style={styles.terminalDotsRow}>
                  <View style={[styles.termDot, { backgroundColor: '#FF5F56' }]} />
                  <View style={[styles.termDot, { backgroundColor: '#FFBD2E' }]} />
                  <View style={[styles.termDot, { backgroundColor: '#27C93F' }]} />
                </View>
                <Text style={styles.terminalTitle}>JUNIE</Text>
              </View>
              {terminalLogs.slice(0, logIndex + 1).map((log, i) => {
                const isPast = i < logIndex;
                const prefix = log.substring(0, 2);
                const text = log.substring(2);
                return (
                  <Text key={i} style={styles.terminalTextLine}>
                    <Text style={styles.terminalPrefix}>{prefix}</Text>
                    <Text style={isPast ? styles.terminalTextDone : styles.terminalTextActive}>{text}</Text>
                  </Text>
                );
              })}
              <Animated.Text style={[styles.terminalCursor, { opacity: cursorOpacity }]}>{'> '}▋</Animated.Text>
            </View>

            <View style={styles.progressRow}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${Math.min(100, ((logIndex + 1) / terminalLogs.length) * 100)}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(Math.min(100, ((logIndex + 1) / terminalLogs.length) * 100))}%</Text>
            </View>

            <TouchableOpacity onPress={reset} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STATE C: Preview */}
      {state === 'preview' && (
        <View style={styles.stateWrapper}>
          <View style={styles.cardNoPad}>
            <View style={styles.previewHeaderCard}>
              <View style={styles.liveRow}>
                <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseScale }], opacity: opacityPulse }]} />
                <Text style={styles.liveText}>● Live on AWS</Text>
              </View>
              <Text style={styles.stackText}>Node.js + Express</Text>
            </View>

            <View style={styles.pseudoTabs}>
              {['Preview', 'Logs', 'Files'].map(tab => (
                <TouchableOpacity key={tab} onPress={() => setPreviewTab(tab)} style={[styles.pseudoTab, previewTab === tab && styles.pseudoTabActive]}>
                  <Text style={[styles.pseudoTabText, previewTab === tab && styles.pseudoTabTextActive]}>{tab}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.codeBlock}>
              <View style={styles.codeTopBar}>
                <View style={styles.methodBadge}><Text style={styles.methodBadgeText}>GET</Text></View>
                <Text style={styles.pathText}>/api/status</Text>
                <View style={{ flex: 1 }} />
                <Text style={styles.status200}>200 OK</Text>
                <Text style={styles.latencyText}>12ms</Text>
              </View>
              <View style={styles.codeDivider} />
              
              <Text style={styles.codeLine}><Text style={styles.codeBracket}>{'{'}</Text></Text>
              <Text style={styles.codeLine}>
                <Text style={styles.codeKey}>  "status"</Text>
                <Text style={styles.codeBracket}>: </Text>
                <Text style={styles.codeString}>"ok"</Text>
                <Text style={styles.codeBracket}>,</Text>
              </Text>
              <Text style={styles.codeLine}>
                <Text style={styles.codeKey}>  "endpoints"</Text>
                <Text style={styles.codeBracket}>: </Text>
                <Text style={styles.codeNumber}>4</Text>
                <Text style={styles.codeBracket}>,</Text>
              </Text>
              <Text style={styles.codeLine}>
                <Text style={styles.codeKey}>  "version"</Text>
                <Text style={styles.codeBracket}>: </Text>
                <Text style={styles.codeString}>"1.0.0"</Text>
              </Text>
              <Text style={styles.codeLine}><Text style={styles.codeBracket}>{'}'}</Text></Text>
            </View>

            <Text style={styles.suggestedLabel}>NEXT STEPS</Text>
            <View style={styles.nextStepItem}>
              <View style={styles.nextStepDot} />
              <Text style={styles.nextStepText}>Add authentication (JWT)</Text>
              <Text style={styles.nextStepChevron}>›</Text>
            </View>
            <View style={styles.nextStepItem}>
              <View style={styles.nextStepDot} />
              <Text style={styles.nextStepText}>Connect database</Text>
              <Text style={styles.nextStepChevron}>›</Text>
            </View>
            <View style={styles.nextStepItem}>
              <View style={styles.nextStepDot} />
              <Text style={styles.nextStepText}>Add validation</Text>
              <Text style={styles.nextStepChevron}>›</Text>
            </View>

            <View style={styles.actionColumn}>
              <TouchableOpacity onPress={handleAccept} style={styles.primaryBtn} activeOpacity={0.8}>
                <Ionicons name="logo-github" size={16} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Accept & Commit to Git</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDiscard} style={styles.destructiveLink} activeOpacity={0.6}>
                <Text style={styles.destructiveLinkText}>Discard environment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* STATE D: Success */}
      {state === 'success' && (
        <View style={styles.stateWrapper}>
          <View style={styles.cardCenter}>
            <View style={styles.successSquare}>
              <Ionicons name="checkmark" size={20} color={JB.success} />
            </View>
            <Text style={styles.successTitle}>Committed to GitHub</Text>
            <Text style={styles.successSubtitle}>The codebase is ready for collaboration.</Text>

            <TouchableOpacity onPress={() => Linking.openURL('https://github.com/JetDev-Team/restaurant-api')} style={styles.githubBox}>
              <Ionicons name="logo-github" size={16} color={JB.text1} />
              <Text style={styles.githubBoxUrl}>github.com/JetDev-Team/restaurant-api</Text>
              <Ionicons name="copy-outline" size={16} color={JB.text3} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <View style={styles.infoRow}>
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>STACK</Text>
                <Text style={styles.infoValue}>Node.js + Express</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>CREATED</Text>
                <Text style={styles.infoValue}>just now</Text>
              </View>
            </View>

            <TouchableOpacity onPress={() => Linking.openURL('https://github.com/JetDev-Team/restaurant-api')} style={[styles.primaryBtn, { width: '100%', marginBottom: 8 }]} activeOpacity={0.8}>
              <Text style={styles.primaryBtnText}>Open in Browser</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={reset} style={styles.flatLink}>
              <Text style={styles.flatLinkText}>Build something new</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STATE E: Error */}
      {state === 'error' && (
        <View style={styles.stateWrapper}>
          <View style={styles.cardNoPad}>
            <View style={styles.errorAccentLine} />
            <View style={styles.cardPadCenter}>
              <View style={styles.errorSquare}>
                <Ionicons name="warning-outline" size={20} color={JB.error} />
              </View>
              <Text style={styles.errorTitle}>Generation failed</Text>
              
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>
                  {prompt.length < 5 && prompt.length > 0 
                    ? "Error: Prompt too short.\nPlease provide more details."
                    : "Error: Connection timeout (30s)\nCheck network and try again."}
                </Text>
              </View>

              <TouchableOpacity onPress={handleGenerate} style={[styles.primaryBtn, { width: '100%', marginTop: 24, marginBottom: 8 }]} activeOpacity={0.8}>
                <Text style={styles.primaryBtnText}>Try again</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setState('empty')} style={styles.flatLink}>
                <Text style={styles.flatLinkText}>Edit prompt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* History Modal */}
      <Modal visible={showHistory} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Project History</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Ionicons name="close" size={24} color={JB.text1} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {historyProjects.map(proj => (
                <TouchableOpacity key={proj.id} onPress={() => Linking.openURL(`https://${proj.url}`)} style={styles.historyItem}>
                  <View style={styles.historyItemTop}>
                    <View style={styles.historyItemTitleRow}>
                      <View style={[styles.statusDot, { backgroundColor: proj.status === 'active' ? JB.success : JB.warning }]} />
                      <Text style={styles.historyItemName}>{proj.name}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={JB.text3} />
                  </View>
                  <View style={styles.historyItemBottom}>
                    <Text style={styles.historyItemMeta}>{proj.stack} · {proj.time}</Text>
                    <Text style={styles.historyItemUrl}>{proj.url}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: JB.bg1 },
  contentContainer: { paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { ...Type.screenTitle },
  historyBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: JB.bg2, borderRadius: 8 },
  historyBtnText: { color: JB.blue, fontSize: 13, fontWeight: '600' },
  stateWrapper: { paddingHorizontal: 16, paddingTop: 16 },

  /* Card Base (Islands style) */
  card: { backgroundColor: JB.bg0, borderRadius: 12, borderWidth: 1, borderColor: JB.border, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  cardNoPad: { backgroundColor: JB.bg0, borderRadius: 12, borderWidth: 1, borderColor: JB.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, overflow: 'hidden' },
  cardPadCenter: { padding: 24, alignItems: 'center' },
  cardCenter: { backgroundColor: JB.bg0, borderRadius: 12, borderWidth: 1, borderColor: JB.border, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  
  /* Buttons */
  primaryBtn: { backgroundColor: JB.blue, borderRadius: 8, height: 40, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  flatLink: { height: 40, alignItems: 'center', justifyContent: 'center' },
  flatLinkText: { color: JB.blue, fontSize: 14, fontWeight: '600' },
  destructiveLink: { height: 40, alignItems: 'center', justifyContent: 'center' },
  destructiveLinkText: { color: JB.text2, fontSize: 13, fontWeight: '600' },

  /* Tags */
  tagBlue: { backgroundColor: '#EEF4FF', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  tagBlueText: { fontSize: 11, fontWeight: '600', color: JB.blue },

  /* Empty State */
  emptyState: { paddingHorizontal: 16, paddingTop: 8 },
  heroCard: { width: '100%', borderRadius: 16, padding: 20, marginBottom: 24 },
  heroIconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 20 },
  heroTextarea: { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderRadius: 8, padding: 12, minHeight: 70, fontSize: 15, color: '#FFF', textAlignVertical: 'top', marginBottom: 12 },
  heroGenerateBtn: { backgroundColor: '#FFF', width: '100%', height: 40, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  heroGenerateBtnText: { color: JB.text1, fontSize: 14, fontWeight: '600' },
  quickRow: { marginBottom: 24 },
  quickChip: { backgroundColor: JB.bg1, borderRadius: 6, borderWidth: 1, borderColor: JB.border, paddingHorizontal: 12, paddingVertical: 6, height: 30, justifyContent: 'center' },
  quickChipText: { fontSize: 12, fontWeight: '500', color: JB.text1 },
  recentSection: { marginTop: 8 },
  recentTitle: { ...Type.sectionLabel, marginBottom: 8 },
  recentItem: { backgroundColor: JB.bg0, borderRadius: 12, borderWidth: 1, borderColor: JB.border, borderLeftWidth: 3, borderLeftColor: JB.success, padding: 16, marginBottom: 12, position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  recentItemTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  recentItemName: { ...Type.cardTitle },
  recentItemTime: { ...Type.caption },
  recentItemLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  recentItemLink: { ...Type.bodySmall, color: JB.blue },
  recentChevron: { position: 'absolute', right: 16, top: 35 },

  /* Generating State */
  projectName: { ...Type.cardTitle, marginBottom: 8 },
  divider: { height: 1, backgroundColor: JB.border, marginVertical: 16 },
  stepperContainer: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginHorizontal: 8 },
  stepItem: { alignItems: 'center', flex: 1 },
  stepCircleRow: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center', marginBottom: 8 },
  stepCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: JB.borderMed, backgroundColor: '#FFF', zIndex: 2, alignItems: 'center', justifyContent: 'center' },
  stepCircleDone: { borderColor: JB.success, backgroundColor: JB.success },
  stepCircleActive: { borderWidth: 2, borderColor: JB.blue },
  stepDoneIcon: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  stepLine: { position: 'absolute', left: '50%', right: '-50%', height: 2, backgroundColor: JB.border, zIndex: 1 },
  stepLineDone: { backgroundColor: JB.success },
  stepText: { fontSize: 11, color: JB.text3 },
  stepTextDone: { color: JB.success },
  stepTextActive: { color: JB.blue, fontWeight: '700' },
  terminalBox: { backgroundColor: JB.termBg, borderRadius: 8, padding: 12, marginTop: 12, minHeight: 180 },
  terminalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  terminalDotsRow: { flexDirection: 'row', gap: 6, marginRight: 12 },
  termDot: { width: 10, height: 10, borderRadius: 5 },
  terminalTitle: { fontSize: 10, fontWeight: '600', color: JB.text2, letterSpacing: 1.5 },
  terminalTextLine: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, lineHeight: 18 },
  terminalPrefix: { color: JB.termPurple },
  terminalTextDone: { color: JB.termGreen },
  terminalTextActive: { color: JB.termWhite },
  terminalCursor: { color: JB.blue, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, marginBottom: 24 },
  progressBarBg: { flex: 1, height: 3, backgroundColor: '#2D2D2D', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: JB.blue },
  progressText: { fontSize: 11, fontWeight: '600', color: JB.termWhite },
  cancelBtn: { alignSelf: 'center' },
  cancelText: { fontSize: 13, color: JB.text3, fontWeight: '500' },

  /* Preview State */
  previewHeaderCard: { padding: 16, paddingBottom: 8 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: JB.success },
  liveText: { fontSize: 13, fontWeight: '600', color: JB.success },
  stackText: { fontSize: 12, color: JB.text2, position: 'absolute', right: 16, top: 16 },
  pseudoTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: JB.border, paddingHorizontal: 16, marginBottom: 12 },
  pseudoTab: { paddingBottom: 8, marginRight: 16, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  pseudoTabActive: { borderBottomColor: JB.blue },
  pseudoTabText: { fontSize: 13, fontWeight: '400', color: JB.text2 },
  pseudoTabTextActive: { fontWeight: '600', color: JB.blue },
  codeBlock: { backgroundColor: JB.termBg, marginHorizontal: 16, borderRadius: 8, padding: 16, marginBottom: 20 },
  codeTopBar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  methodBadge: { backgroundColor: '#0E7C2B', borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2 },
  methodBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  pathText: { color: JB.termGreen, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12 },
  status200: { color: JB.termGreen, fontSize: 11 },
  latencyText: { color: JB.termGray, fontSize: 11 },
  codeDivider: { backgroundColor: '#2D2D2D', height: 1, marginVertical: 8 },
  codeLine: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12.5, lineHeight: 19 },
  codeBracket: { color: JB.termWhite },
  codeKey: { color: '#9876AA' },
  codeString: { color: '#6A8759' },
  codeNumber: { color: '#6897BB' },
  suggestedLabel: { ...Type.sectionLabel, marginLeft: 16, marginBottom: 8 },
  nextStepItem: { flexDirection: 'row', alignItems: 'center', paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: 'rgba(123, 82, 255, 0.3)', marginLeft: 20, marginBottom: 8 },
  nextStepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: JB.purple, marginRight: 8 },
  nextStepText: { fontSize: 13, color: JB.text1, flex: 1 },
  nextStepChevron: { fontSize: 16, color: JB.text3, marginRight: 16 },
  actionColumn: { padding: 16, gap: 12, marginTop: 8 },

  /* Success State */
  successSquare: { width: 48, height: 48, backgroundColor: '#F0FBF0', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successTitle: { fontSize: 20, fontWeight: '700', color: JB.text1, marginBottom: 4 },
  successSubtitle: { fontSize: 13, color: JB.text2, textAlign: 'center', marginBottom: 20 },
  githubBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: JB.bg1, borderWidth: 1, borderColor: JB.border, borderRadius: 8, padding: 12, width: '100%', marginBottom: 20 },
  githubBoxUrl: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, color: JB.blue, marginLeft: 8 },
  infoRow: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 24 },
  infoCell: { flex: 1, backgroundColor: JB.bg1, borderRadius: 8, padding: 10 },
  infoLabel: { ...Type.sectionLabel },
  infoValue: { fontSize: 13, fontWeight: '600', color: JB.text1, marginTop: 2 },

  /* Error State */
  errorAccentLine: { height: 3, backgroundColor: JB.error },
  errorSquare: { width: 48, height: 48, backgroundColor: '#FFF5F5', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  errorTitle: { fontSize: 18, fontWeight: '600', color: JB.text1 },
  errorBox: { backgroundColor: '#FFF5F5', borderRadius: 6, borderLeftWidth: 3, borderLeftColor: JB.error, padding: 10, marginTop: 16, width: '100%' },
  errorBoxText: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11.5, color: JB.error, lineHeight: 17 },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: JB.bg0, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: JB.border },
  modalTitle: { fontSize: 18, fontWeight: '600', color: JB.text1 },
  modalScroll: { padding: 20 },
  historyItem: { borderBottomWidth: 1, borderBottomColor: JB.border, paddingVertical: 16 },
  historyItemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  historyItemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyItemName: { ...Type.cardTitle },
  historyItemBottom: { paddingLeft: 16 },
  historyItemMeta: { ...Type.caption, marginBottom: 4 },
  historyItemUrl: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, color: JB.text2 },
});
