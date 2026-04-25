import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Animated as RNAnimated, Easing, Modal, Linking, Platform, FlatList, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../components/Toast';
import { JB, Type, Colors } from '../constants/theme';
import { quickPrompts } from '../constants/data';
import Svg, { Path } from 'react-native-svg';
import {
  Zap, Terminal, GitBranch, CheckCircle,
  TriangleAlert, Clock, Copy,
  ChevronRight, History, Layers,
  Loader, CircleCheck, Sparkles, X,
  Trash2, Lock, Mail, BellOff
} from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const historyProjects = [
  { id: 1, name: 'Restaurant Booking API', stack: 'Node.js', time: '3 days ago', url: 'github.com/JetDev-Team/rest-api', status: 'active' },
  { id: 2, name: 'Weather CLI Tool', stack: 'Python', time: '1 week ago', url: 'github.com/JetDev-Team/weather', status: 'down' },
  { id: 3, name: 'Portfolio Site', stack: 'React', time: '2 weeks ago', url: 'github.com/JetDev-Team/portfolio', status: 'active' },
];

const stepperSteps = ['Parse', 'Gen', 'Deploy', 'Preview'];

const terminalLogsData = [
  { time: "0.1s", text: "Parsing prompt with Junie AI..." },
  { time: "0.8s", text: "Detected stack: Node.js + Express + PostgreSQL" },
  { time: "1.2s", text: "Scaffolding project structure..." },
  { time: "2.5s", text: "Writing route handlers (4 endpoints)..." },
  { time: "4.1s", text: "Generating Prisma schema..." },
  { time: "5.8s", text: "Installing dependencies (npm i)..." },
  { time: "7.2s", text: "Configuring AWS EC2 t3.micro..." },
  { time: "8.4s", text: "Running health checks..." },
];

const GitHubIcon = ({ size = 16, color = '#19191C' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </Svg>
);

const SpinningLoader = () => {
  const spin = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.timing(spin, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <RNAnimated.View style={{ transform: [{ rotate }] }}>
      <Loader size={20} color="#0060FF" strokeWidth={2} />
    </RNAnimated.View>
  );
};

const BlinkingCursor = () => {
  const opacity = useRef(new RNAnimated.Value(1)).current;
  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        RNAnimated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <RNAnimated.Text style={{ opacity, color: '#0060FF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12 }}>▍</RNAnimated.Text>
  );
};

const PulsingRing = () => {
  const scale = useRef(new RNAnimated.Value(1)).current;
  const opacity = useRef(new RNAnimated.Value(1)).current;
  
  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.parallel([
        RNAnimated.timing(scale, { toValue: 1.6, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        RNAnimated.timing(opacity, { toValue: 0, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, []);

  return <RNAnimated.View style={[styles.pulsingRing, { transform: [{ scale }], opacity }]} />;
};

const FadeInLog = ({ children }) => {
  const opacity = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    RNAnimated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, []);
  return <RNAnimated.View style={{ opacity, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 }}>{children}</RNAnimated.View>;
};

const SlideUpModal = ({ visible, children }) => {
  const slideAnim = useRef(new RNAnimated.Value(SCREEN_HEIGHT)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      RNAnimated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }).start();
    } else if (mounted) {
      RNAnimated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setMounted(false);
      });
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <Modal visible={true} animationType="none" transparent={true}>
      <RNAnimated.View style={{ flex: 1, transform: [{ translateY: slideAnim }] }}>
        {children}
      </RNAnimated.View>
    </Modal>
  );
};

const JetDevHeroGradient = ({ children, isFullscreen }) => (
  <View style={[styles.heroContainer, isFullscreen && styles.heroContainerFullscreen]}>
    {/* BASE LAYER */}
    <LinearGradient colors={['#0D0221', '#4A1FBF', '#7B52FF']} locations={[0, 0.45, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
    {/* BLOOM LAYER */}
    <LinearGradient colors={['#FF318C', 'transparent']} locations={[0, 0.7]} start={{ x: 1, y: 0 }} end={{ x: 0.2, y: 0.8 }} style={[StyleSheet.absoluteFillObject, { opacity: 0.85 }]} />
    {/* DEPTH LAYER */}
    <LinearGradient colors={['#0060FF', 'transparent']} locations={[0, 0.6]} start={{ x: 0, y: 1 }} end={{ x: 0.7, y: 0.2 }} style={[StyleSheet.absoluteFillObject, { opacity: 0.35 }]} />
    {/* VIGNETTE */}
    <LinearGradient colors={['rgba(0,0,0,0.25)', 'transparent', 'rgba(0,0,0,0.15)']} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
    <View style={[styles.heroContent, isFullscreen && styles.heroContentFullscreen]}>
      {children}
    </View>
  </View>
);

export default function JetDevScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [state, setState] = useState('empty');
  const [prompt, setPrompt] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [logIndex, setLogIndex] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [previewTab, setPreviewTab] = useState('Preview');
  const [copyFlash, setCopyFlash] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [answersCount, setAnswersCount] = useState(0);
  const [customCards, setCustomCards] = useState([]);
  
  const sheetAnim = useRef(new RNAnimated.Value(500)).current;
  
  const showToast = useToast();
  const stateRef = useRef(state);
  const inputRef = useRef(null);
  const scrollViewRef = useRef(null);
  const terminalListRef = useRef(null);
  
  const shakeAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: isExpanded ? { display: 'none' } : {
        height: 50 + insets.bottom,
        paddingTop: 8,
        paddingBottom: insets.bottom,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        backgroundColor: '#FFFFFF',
      }
    });
  }, [isExpanded, insets.bottom, navigation]);

  useEffect(() => {
    if (state === 'generating') {
      setIsExpanded(true);
      setLogIndex(0);
      setCurrentStep(0);
      setAnswersCount(0);
      setActiveQuestion(null);
      setCustomCards([]);
      
      const interval = setInterval(() => {
        setLogIndex(prev => {
          const next = prev + 1;
          if (next >= terminalLogsData.length) clearInterval(interval);
          if (next === 2) setCurrentStep(1);
          if (next === 5) setCurrentStep(2);
          if (next === 7) setCurrentStep(3);
          return next;
        });
      }, 1000);

      const timeout = setTimeout(() => {
        if (stateRef.current === 'generating') {
          setIsExpanded(false);
          setTimeout(() => setState('preview'), 300);
        }
      }, 8500);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [state]);

  useEffect(() => {
    if (isExpanded && terminalListRef.current && logIndex > 0) {
      terminalListRef.current.scrollToEnd({ animated: true });
    }
  }, [logIndex, isExpanded]);

  useEffect(() => {
    if (state === 'generating') {
      if (logIndex >= 3 && answersCount === 0 && activeQuestion?.id !== 'A') {
        if (!activeQuestion) {
          setActiveQuestion({
            id: 'A',
            title: "Should users be able to cancel their own bookings?",
            options: [
              { icon: Trash2, text: "Yes, let them cancel", choice: "users can cancel bookings" },
              { icon: Lock, text: "No, admin only", choice: "only admins can cancel" }
            ]
          });
        }
      } else if (logIndex >= 5 && answersCount === 1 && activeQuestion?.id !== 'B') {
        if (!activeQuestion) {
           setActiveQuestion({
            id: 'B',
            title: "Send a confirmation when a booking is made?",
            options: [
              { icon: Mail, text: "Yes, email confirmation", choice: "email confirmation" },
              { icon: BellOff, text: "No, keep it simple", choice: "no email confirmation" }
            ]
          });
        }
      }
    }
  }, [logIndex, state, answersCount, activeQuestion]);

  useEffect(() => {
    if (activeQuestion) {
      RNAnimated.spring(sheetAnim, {
        toValue: 0,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }).start();
    }
  }, [activeQuestion]);

  const handleAnswer = (choiceText) => {
    RNAnimated.timing(sheetAnim, { toValue: 500, duration: 300, useNativeDriver: true }).start(() => {
      setActiveQuestion(null);
      const newAnswersCount = answersCount + 1;
      setAnswersCount(newAnswersCount);
      
      const newCards = [...customCards, {
        id: Math.random().toString(),
        afterIndex: logIndex,
        title: `Got it — adding ${choiceText} to the build`,
        icon: 'Sparkles'
      }];
      
      if (newAnswersCount === 2) {
        newCards.push({
          id: 'personalized',
          afterIndex: logIndex + 0.1,
          title: "Personalized to your answers",
          subtitle: "2 custom decisions applied to your build",
          icon: 'SparklesPink',
          special: true
        });
      }
      
      setCustomCards(newCards);
    });
  };

  const shake = () => {
    RNAnimated.sequence([
      RNAnimated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      RNAnimated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      RNAnimated.timing(shakeAnim, { toValue: -4, duration: 60, useNativeDriver: true }),
      RNAnimated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
      RNAnimated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
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

  const handleAccept = () => setState('success');

  const handleDiscard = () => {
    showToast('Environment discarded');
    setIsExpanded(false);
    setTimeout(() => {
      setState('empty');
      setPrompt('');
    }, 300);
  };

  const reset = () => {
    setState('empty');
    setPrompt('');
  };

  const getQuickIcon = (label) => {
    if (label.includes('REST API')) return <Zap size={12} color="#FF318C" strokeWidth={2} />;
    if (label.includes('Web App')) return <Layers size={12} color="#6B6B6B" strokeWidth={1.5} />;
    if (label.includes('CLI Tool')) return <Terminal size={12} color="#6B6B6B" strokeWidth={1.5} />;
    return <Zap size={12} color="#FF318C" strokeWidth={2} />;
  };

  const handleQuickChip = (label) => {
    let fullPrompt = '';
    if (label.includes('REST API')) {
      fullPrompt = 'A REST API with JWT auth, CRUD endpoints for users and resources, PostgreSQL database, and Swagger docs';
    } else if (label.includes('Web App')) {
      fullPrompt = 'A full-stack web app with React frontend, Express backend, user login, and a dashboard';
    } else if (label.includes('CLI Tool')) {
      fullPrompt = 'A Node.js CLI tool with interactive prompts, file input/output processing, and colored terminal output';
    } else {
      fullPrompt = label;
    }
    setPrompt(fullPrompt);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const renderItem = ({ item }) => {
    if (item.type === 'log') {
      const isLastLog = item.index === logIndex; 
      return (
        <FadeInLog key={item.id}>
          <Text style={styles.logPrefix}>{'> '}</Text>
          <Text style={[styles.logText, isLastLog ? styles.logTextActive : styles.logTextDone]}>
            {item.item.text}
          </Text>
          {isLastLog && <BlinkingCursor />}
          <Text style={styles.logTime}>{item.item.time}</Text>
        </FadeInLog>
      );
    } else {
      const { special, title, subtitle } = item.item;
      if (special) {
        return (
          <FadeInLog key={item.id}>
             <View style={styles.specialCard}>
               <Sparkles size={16} color="#FF318C" style={{ marginRight: 8, marginTop: 2 }} />
               <View>
                 <Text style={styles.specialCardTitle}>{title}</Text>
                 <Text style={styles.specialCardSubtitle}>{subtitle}</Text>
               </View>
             </View>
          </FadeInLog>
        );
      } else {
        return (
          <FadeInLog key={item.id}>
             <View style={styles.answerCard}>
               <Sparkles size={14} color="#FF318C" style={{ marginRight: 8 }} />
               <Text style={styles.answerCardTitle}>{title}</Text>
             </View>
          </FadeInLog>
        );
      }
    }
  };

  const renderFeed = [];
  for (let i = 0; i <= logIndex && i < terminalLogsData.length; i++) {
    renderFeed.push({ type: 'log', item: terminalLogsData[i], id: `log-${i}`, index: i });
    
    const cardsAfterThis = customCards.filter(c => Math.floor(c.afterIndex) === i);
    cardsAfterThis.sort((a, b) => a.afterIndex - b.afterIndex);
    
    cardsAfterThis.forEach(card => {
       renderFeed.push({ type: 'custom', item: card, id: `custom-${card.id}` });
    });
  }

  return (
    <ScrollView ref={scrollViewRef} style={[styles.container, { paddingTop: insets.top + 8 }]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>JetDev</Text>
        {state === 'empty' && (
          <TouchableOpacity onPress={() => setShowHistory(true)} style={styles.historyBtn}>
            <History size={14} color="#0060FF" strokeWidth={2} style={{ marginRight: 4 }} />
            <Text style={styles.historyBtnText}>History</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* STATE A: Empty */}
      {(state === 'empty' || state === 'generating') && (
        <View style={styles.emptyState}>
          <JetDevHeroGradient isFullscreen={false}>
            <Text style={styles.heroSubtitle}>Describe what you want. Junie builds it in the cloud.</Text>
            <RNAnimated.View style={{ transform: [{ translateX: shakeAnim }], width: '100%' }}>
              <View style={styles.heroInputWrapper}>
                <TextInput
                  ref={inputRef}
                  value={prompt}
                  onChangeText={setPrompt}
                  placeholder="Describe your app idea..."
                  placeholderTextColor="rgba(255, 255, 255, 0.42)"
                  multiline
                  style={styles.heroTextarea}
                />
                <TouchableOpacity onPress={handleGenerate} style={styles.heroInnerBtn} activeOpacity={0.8}>
                  <Zap size={14} color="#19191C" strokeWidth={2.5} fill="none" />
                  <Text style={styles.heroInnerBtnText}>Generate</Text>
                </TouchableOpacity>
              </View>
            </RNAnimated.View>
          </JetDevHeroGradient>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow} contentContainerStyle={{ gap: 8 }}>
            {quickPrompts.map(qp => (
              <TouchableOpacity key={qp.label} onPress={() => handleQuickChip(qp.label)} style={styles.quickChip}>
                {getQuickIcon(qp.label)}
                <Text style={styles.quickChipText}>{qp.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>RECENT PROJECTS</Text>
            {historyProjects.slice(0, 3).map(proj => (
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
                <View style={styles.recentChevron}>
                  <ChevronRight size={16} color="#ABABAB" strokeWidth={1.5} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* FULLSCREEN GENERATING MODAL */}
      <SlideUpModal visible={isExpanded}>
        <JetDevHeroGradient isFullscreen={true}>
          <View style={[styles.genHeader, { paddingTop: insets.top + 16 }]}>
            <TouchableOpacity onPress={handleDiscard} style={styles.genCloseBtn}>
              <X size={16} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.genProjectName}>Restaurant Booking API</Text>
            <View style={styles.genStackTag}>
              <Text style={styles.genStackTagText}>Node.js</Text>
            </View>
          </View>

          <View style={styles.genStepper}>
            {stepperSteps.map((step, idx) => {
              const isActive = idx === currentStep;
              const isPast = idx < currentStep;
              const isDone = isPast || (currentStep === stepperSteps.length - 1 && isActive);
              
              return (
                <View key={step} style={styles.genStepItem}>
                  <View style={styles.genStepCircleRow}>
                    {isDone ? (
                      <View style={styles.genStepIconWrap}>
                        <CircleCheck size={26} color="#59A869" strokeWidth={2} fill="none" />
                      </View>
                    ) : isActive ? (
                      <View style={styles.genStepIconWrap}>
                        <PulsingRing />
                        <View style={styles.genActiveCircle} />
                      </View>
                    ) : (
                      <View style={styles.genStepPending} />
                    )}
                    {idx < stepperSteps.length - 1 && (
                      <View style={[styles.genStepLine, isPast && styles.genStepLineDone]} />
                    )}
                  </View>
                  <Text style={[styles.genStepText, isDone && styles.genStepTextDone, isActive && !isDone && styles.genStepTextActive]}>{step}</Text>
                </View>
              );
            })}
          </View>

          <View style={[styles.genTerminal, { opacity: activeQuestion ? 0.4 : 1.0 }]}>
            <View style={styles.terminalHeader}>
              <View style={styles.terminalDotsRow}>
                <View style={[styles.termDot, { backgroundColor: '#FF5F56' }]} />
                <View style={[styles.termDot, { backgroundColor: '#FFBD2E' }]} />
                <View style={[styles.termDot, { backgroundColor: '#27C93F' }]} />
              </View>
              <Text style={styles.terminalTitle}>JUNIE LOG</Text>
            </View>
            
            <FlatList
              ref={terminalListRef}
              data={renderFeed}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              style={{ flex: 1, marginTop: 12 }}
              showsVerticalScrollIndicator={false}
            />
          </View>

          <View style={[styles.genBottom, { paddingBottom: insets.bottom + 16, opacity: activeQuestion ? 0.4 : 1.0 }]}>
            <View style={styles.genProgressBarBg}>
              <LinearGradient
                colors={[JB.pink, JB.purple]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.genProgressBarFill, { width: `${Math.min(100, ((logIndex + 1) / terminalLogsData.length) * 100)}%` }]}
              />
            </View>
            <View style={styles.genProgressTextRow}>
              <Text style={styles.genProgressSubtext}>{Math.round(Math.min(100, ((logIndex + 1) / terminalLogsData.length) * 100))}% completed</Text>
              <Text style={styles.genProgressSubtext}>Estimated time: ~12s</Text>
            </View>
            <TouchableOpacity onPress={handleDiscard} style={styles.genCancelBtn}>
              <Text style={styles.genCancelText}>Cancel generation</Text>
            </TouchableOpacity>
          </View>

          {/* BOTTOM SHEET FOR QUESTIONS */}
          <RNAnimated.View style={[styles.bottomSheet, { transform: [{ translateY: sheetAnim }], paddingBottom: insets.bottom + 16 }]}>
            {activeQuestion && (
              <>
                <View style={styles.sheetDragIndicator} />
                <Text style={styles.sheetLabel}>⚡ Junie</Text>
                <Text style={styles.sheetQuestion}>{activeQuestion.title}</Text>
                
                {activeQuestion.options.map((opt, i) => {
                  const Icon = opt.icon;
                  return (
                    <TouchableOpacity key={i} style={styles.sheetOptionBtn} activeOpacity={0.8} onPress={() => handleAnswer(opt.choice)}>
                      <Icon size={18} color="#FFF" style={{ marginRight: 10 }} />
                      <Text style={styles.sheetOptionText}>{opt.text}</Text>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </RNAnimated.View>
        </JetDevHeroGradient>
      </SlideUpModal>

      {/* STATE C: Preview */}
      {state === 'preview' && (
        <View style={styles.stateWrapper}>
          <View style={styles.cardNoPad}>
            <View style={styles.previewHeaderCard}>
              <View style={styles.liveRow}>
                <View style={styles.liveDot} />
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
              <Text style={styles.codeLine}><Text style={styles.codeKey}>  "status"</Text><Text style={styles.codeBracket}>: </Text><Text style={styles.codeString}>"ok"</Text><Text style={styles.codeBracket}>,</Text></Text>
              <Text style={styles.codeLine}><Text style={styles.codeKey}>  "endpoints"</Text><Text style={styles.codeBracket}>: </Text><Text style={styles.codeNumber}>4</Text><Text style={styles.codeBracket}>,</Text></Text>
              <Text style={styles.codeLine}><Text style={styles.codeKey}>  "version"</Text><Text style={styles.codeBracket}>: </Text><Text style={styles.codeString}>"1.0.0"</Text></Text>
              <Text style={styles.codeLine}><Text style={styles.codeBracket}>{'}'}</Text></Text>
            </View>
            <View style={styles.suggestedHeaderRow}>
              <Sparkles size={14} color="#7B52FF" strokeWidth={1.5} style={{ marginRight: 6 }} />
              <Text style={styles.suggestedLabel}>NEXT STEPS</Text>
            </View>
            <View style={styles.nextStepItem}><View style={styles.nextStepDot} /><Text style={styles.nextStepText}>Add authentication (JWT)</Text><ChevronRight size={14} color="#7B52FF" strokeWidth={2.5} /></View>
            <View style={styles.nextStepItem}><View style={styles.nextStepDot} /><Text style={styles.nextStepText}>Connect database</Text><ChevronRight size={14} color="#7B52FF" strokeWidth={2.5} /></View>
            <View style={styles.nextStepItem}><View style={styles.nextStepDot} /><Text style={styles.nextStepText}>Add validation</Text><ChevronRight size={14} color="#7B52FF" strokeWidth={2.5} /></View>
            <View style={styles.actionColumn}>
              <TouchableOpacity onPress={handleAccept} style={styles.primaryBtn} activeOpacity={0.8}><GitBranch size={15} color="#FFFFFF" strokeWidth={2} style={{ marginRight: 8 }} /><Text style={styles.primaryBtnText}>Accept & Commit to Git</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setState('empty')} style={styles.destructiveLink} activeOpacity={0.6}><Text style={styles.destructiveLinkText}>Discard environment</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* STATE D: Success */}
      {state === 'success' && (
        <View style={styles.stateWrapper}>
          <View style={styles.cardCenter}>
            <View style={styles.successSquare}><CheckCircle size={32} color="#59A869" strokeWidth={1.5} fill="none" /></View>
            <Text style={styles.successTitle}>Committed to GitHub</Text>
            <Text style={styles.successSubtitle}>The codebase is ready for collaboration.</Text>
            <View style={styles.githubBox}>
              <TouchableOpacity onPress={() => Linking.openURL('https://github.com/JetDev-Team/restaurant-api')} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <GitHubIcon size={16} color={JB.text1} />
                <Text style={styles.githubBoxUrl}>github.com/JetDev-Team/restaurant-api</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { showToast('URL copied to clipboard'); setCopyFlash(true); setTimeout(() => setCopyFlash(false), 500); }}>
                <Copy size={14} color={copyFlash ? "#0060FF" : "#ABABAB"} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoCell}><Text style={styles.infoLabel}>STACK</Text><Text style={styles.infoValue}>Node.js + Express</Text></View>
              <View style={styles.infoCell}><Text style={styles.infoLabel}>CREATED</Text><Text style={styles.infoValue}>just now</Text></View>
            </View>
            <TouchableOpacity onPress={() => Linking.openURL('https://github.com/JetDev-Team/restaurant-api')} style={[styles.primaryBtn, { width: '100%', marginBottom: 8 }]} activeOpacity={0.8}><Text style={styles.primaryBtnText}>Open in Browser</Text></TouchableOpacity>
            <TouchableOpacity onPress={reset} style={styles.flatLink}><Text style={styles.flatLinkText}>Build something new</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {/* STATE E: Error */}
      {state === 'error' && (
        <View style={styles.stateWrapper}>
          <View style={styles.cardNoPad}>
            <View style={styles.errorAccentLine} />
            <View style={styles.cardPadCenter}>
              <View style={styles.errorSquare}><TriangleAlert size={28} color="#CC0000" strokeWidth={1.5} fill="none" /></View>
              <Text style={styles.errorTitle}>Generation failed</Text>
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{prompt.length < 5 && prompt.length > 0 ? "Error: Prompt too short.\nPlease provide more details." : "Error: Connection timeout (30s)\nCheck network and try again."}</Text>
              </View>
              <TouchableOpacity onPress={handleGenerate} style={[styles.primaryBtn, { width: '100%', marginTop: 24, marginBottom: 8 }]} activeOpacity={0.8}><Text style={styles.primaryBtnText}>Try again</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setState('empty')} style={styles.flatLink}><Text style={styles.flatLinkText}>Edit prompt</Text></TouchableOpacity>
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
              <TouchableOpacity onPress={() => setShowHistory(false)}><Text style={{ fontSize: 24, color: JB.text1, fontWeight: '300' }}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {historyProjects.map(proj => (
                <TouchableOpacity key={proj.id} onPress={() => Linking.openURL(`https://${proj.url}`)} style={styles.historyItem}>
                  <View style={styles.historyItemTop}>
                    <View style={styles.historyItemTitleRow}>
                      <View style={[styles.statusDot, { backgroundColor: proj.status === 'active' ? JB.success : JB.warning }]} />
                      <Text style={styles.historyItemName}>{proj.name}</Text>
                    </View>
                    <ChevronRight size={16} color="#ABABAB" strokeWidth={1.5} />
                  </View>
                  <View style={styles.historyItemBottom}>
                    <Text style={styles.historyItemMeta}>{proj.stack} · {proj.time}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><GitHubIcon size={12} color={JB.text2} /><Text style={styles.historyItemUrl}>{proj.url}</Text></View>
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
  historyBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: JB.bg2, borderRadius: 8 },
  historyBtnText: { color: JB.blue, fontSize: 13, fontWeight: '600' },
  stateWrapper: { paddingHorizontal: 16, paddingTop: 16 },

  cardNoPad: { backgroundColor: JB.bg0, borderRadius: 12, borderWidth: 1, borderColor: JB.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, overflow: 'hidden' },
  cardPadCenter: { padding: 24, alignItems: 'center' },
  cardCenter: { backgroundColor: JB.bg0, borderRadius: 12, borderWidth: 1, borderColor: JB.border, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  
  primaryBtn: { backgroundColor: JB.blue, borderRadius: 8, height: 40, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  flatLink: { height: 40, alignItems: 'center', justifyContent: 'center' },
  flatLinkText: { color: JB.blue, fontSize: 14, fontWeight: '600' },
  destructiveLink: { height: 40, alignItems: 'center', justifyContent: 'center' },
  destructiveLinkText: { color: JB.text2, fontSize: 13, fontWeight: '600' },

  tagBlue: { backgroundColor: '#EEF4FF', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  tagBlueText: { fontSize: 11, fontWeight: '600', color: JB.blue },

  /* Empty State / Hero */
  emptyState: { paddingTop: 8 },
  heroContainer: { borderRadius: 20, overflow: 'hidden', marginHorizontal: 16, marginBottom: 24, minHeight: 220, position: 'relative' },
  heroContainerFullscreen: { marginHorizontal: 0, marginTop: 0, marginBottom: 0, borderRadius: 0, flex: 1 },
  heroContent: { padding: 20, zIndex: 10 },
  heroContentFullscreen: { flex: 1, padding: 0 },
  heroSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  heroInputWrapper: { position: 'relative', width: '100%' },
  heroTextarea: { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.22)', borderWidth: 1, borderRadius: 16, padding: 14, paddingBottom: 48, minHeight: 120, fontSize: 15, color: '#FFFFFF', textAlignVertical: 'top' },
  heroInnerBtn: { position: 'absolute', bottom: 10, right: 10, backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 12, height: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  heroInnerBtnText: { color: '#19191C', fontSize: 13, fontWeight: '700' },
  quickRow: { paddingHorizontal: 16, marginBottom: 24 },
  quickChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: JB.bg1, borderRadius: 6, borderWidth: 1, borderColor: JB.border, paddingHorizontal: 12, paddingVertical: 6, height: 30, justifyContent: 'center' },
  quickChipText: { fontSize: 12, fontWeight: '500', color: JB.text1 },
  recentSection: { paddingHorizontal: 16, marginTop: 8 },
  recentTitle: { ...Type.sectionLabel, marginBottom: 8 },
  recentItem: { backgroundColor: JB.bg0, borderRadius: 12, borderWidth: 1, borderColor: JB.border, borderLeftWidth: 3, borderLeftColor: JB.success, padding: 16, marginBottom: 12, position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  recentItemTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  recentItemName: { ...Type.cardTitle },
  recentItemTime: { ...Type.caption },
  recentItemLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  recentItemLink: { ...Type.bodySmall, color: JB.blue },
  recentChevron: { position: 'absolute', right: 16, top: 35 },

  /* Fullscreen Generating State */
  genHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 },
  genCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  genProjectName: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  genStackTag: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  genStackTagText: { color: '#FFF', fontSize: 11, fontWeight: '600' },

  genStepper: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 32 },
  genStepItem: { alignItems: 'center', flex: 1 },
  genStepCircleRow: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center', marginBottom: 10 },
  genStepIconWrap: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', zIndex: 2, backgroundColor: 'transparent' },
  genActiveCircle: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#0060FF', position: 'absolute' },
  pulsingRing: { position: 'absolute', width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0, 96, 255, 0.4)', zIndex: 1 },
  genStepPending: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'transparent', zIndex: 2 },
  genStepLine: { position: 'absolute', left: '50%', right: '-50%', height: 2, backgroundColor: 'rgba(255,255,255,0.15)', zIndex: 1 },
  genStepLineDone: { backgroundColor: JB.success },
  genStepText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  genStepTextDone: { color: JB.success, fontWeight: '600' },
  genStepTextActive: { color: '#FFF', fontWeight: '700' },

  genTerminal: { flex: 1, backgroundColor: '#0D0117', borderRadius: 16, marginHorizontal: 20, marginTop: 24, padding: 16 },
  terminalHeader: { flexDirection: 'row', alignItems: 'center' },
  terminalDotsRow: { flexDirection: 'row', gap: 6, marginRight: 12 },
  termDot: { width: 10, height: 10, borderRadius: 5 },
  terminalTitle: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5 },
  
  logLineContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  logPrefix: { color: '#FF318C', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, marginRight: 4 },
  logText: { flex: 1, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, lineHeight: 18 },
  logTextDone: { color: '#A9B665' },
  logTextActive: { color: '#FFFFFF' },
  logTime: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginLeft: 8, marginTop: 2 },

  genBottom: { padding: 20 },
  genProgressBarBg: { width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 },
  genProgressBarFill: { height: '100%' },
  genProgressTextRow: { flexDirection: 'row', justifyContent: 'space-between' },
  genProgressSubtext: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  genCancelBtn: { marginTop: 16, alignSelf: 'center', padding: 8 },
  genCancelText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', fontWeight: '500' },

  /* Mid-Build Questions & Feed Cards */
  answerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 10, marginVertical: 4, width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  answerCardTitle: { color: '#FFF', fontSize: 13, fontWeight: '500' },
  specialCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(255, 49, 140, 0.15)', borderColor: 'rgba(255, 49, 140, 0.3)', borderWidth: 1, borderRadius: 12, padding: 12, marginVertical: 6, width: '100%' },
  specialCardTitle: { color: '#FFF', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  specialCardSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },

  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(20, 10, 40, 0.97)', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, zIndex: 100, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  sheetDragIndicator: { width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetLabel: { color: '#FF318C', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  sheetQuestion: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', lineHeight: 26, marginBottom: 20 },
  sheetOptionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8 },
  sheetOptionText: { color: '#FFF', fontSize: 15, fontWeight: '500' },

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
  suggestedHeaderRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 16, marginBottom: 8 },
  suggestedLabel: { ...Type.sectionLabel },
  nextStepItem: { flexDirection: 'row', alignItems: 'center', paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: 'rgba(123, 82, 255, 0.3)', marginLeft: 20, marginBottom: 8 },
  nextStepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: JB.purple, marginRight: 8 },
  nextStepText: { fontSize: 13, color: JB.text1, flex: 1 },
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
