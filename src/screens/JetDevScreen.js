import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Animated as RNAnimated, Easing, Modal, Linking, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import MaskedView from '@react-native-masked-view/masked-view';
import { useToast } from '../components/Toast';
import { JB, Type, Colors } from '../constants/theme';
import { quickPrompts } from '../constants/data';
import { createTask, pollTask, acceptTask } from '../api/jetdev';
import { API_BASE } from '../api/config';
import Svg, { Path } from 'react-native-svg';
import {
  Zap, Terminal, GitBranch, CheckCircle,
  TriangleAlert, Clock, Copy,
  ChevronRight, History, Layers,
  CircleCheck, Sparkles, X,
  Trash2, Lock, Mail, BellOff,
  FolderOpen, Server, Code2, ExternalLink,
  Plus, Mic, ArrowUp
} from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const historyProjects = [
  { id: 1, name: 'Restaurant Booking API', stack: 'Node.js', time: '3 days ago', url: 'github.com/JetDev-Team/rest-api', status: 'live' },
  { id: 2, name: 'Weather CLI Tool', stack: 'Python', time: '1 week ago', url: 'github.com/JetDev-Team/weather', status: 'offline' },
  { id: 3, name: 'Portfolio Site', stack: 'React', time: '2 weeks ago', url: 'github.com/JetDev-Team/portfolio', status: 'live' },
  { id: 4, name: 'Auth Service', stack: 'Node.js', time: '1 month ago', url: 'github.com/JetDev-Team/auth-service', status: 'offline' },
];

const ProjectCard = ({ proj }) => {
  const isLive = proj.status === 'active' || proj.status === 'live';
  const statusColor = isLive ? '#59A869' : '#F5760A';
  const statusText = isLive ? 'Live' : 'Offline';

  return (
    <View style={styles.minimalCard}>
      {/* ROW 1 */}
      <View style={styles.minimalCardRow1}>
        <Text style={styles.minimalCardName} numberOfLines={1}>{proj.name}</Text>
        <Text style={styles.minimalCardTime}>{proj.time}</Text>
      </View>
      
      {/* ROW 2 */}
      <View style={styles.minimalCardRow2}>
        <Text style={styles.minimalCardStack}>
          {proj.stack} · <Text style={{ color: statusColor }}>{statusText}</Text>
        </Text>
      </View>
      
      {/* ROW 3 */}
      <View style={styles.minimalCardRow3}>
        <Text style={styles.minimalCardUrl} numberOfLines={1}>{proj.url}</Text>
        <TouchableOpacity onPress={() => Linking.openURL(`https://${proj.url}`)} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <ExternalLink size={16} color="#0060FF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const stepperSteps = ['Parse', 'Gen', 'Deploy', 'Preview'];

const GitHubIcon = ({ size = 16, color = '#19191C' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </Svg>
);

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

const useStableId = (prefix) => {
  const n = useRef(0);
  return () => {
    n.current += 1;
    return `${prefix}-${Date.now()}-${n.current}`;
  };
};

const GradientText = ({ text, style, colors = ['#FF318C', '#7B52FF'], width = 140, height = 20 }) => {
  return (
    <MaskedView
      maskElement={
        <Text style={style} numberOfLines={1}>
          {text}
        </Text>
      }
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width, height }}
      />
    </MaskedView>
  );
};

const SearchingDots = () => {
  const dot1 = useRef(new RNAnimated.Value(0.15)).current;
  const dot2 = useRef(new RNAnimated.Value(0.15)).current;
  const dot3 = useRef(new RNAnimated.Value(0.15)).current;

  useEffect(() => {
    const mk = (val, delay) => RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.delay(delay),
        RNAnimated.timing(val, { toValue: 1, duration: 550, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        RNAnimated.timing(val, { toValue: 0.15, duration: 550, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );

    const a1 = mk(dot1, 0);
    const a2 = mk(dot2, 180);
    const a3 = mk(dot3, 360);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.activityDotsRow}>
      <RNAnimated.View style={[styles.activityDotWrap, { opacity: dot1 }]}>
        <LinearGradient colors={['#FF318C', '#7B52FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.activityDotGrad} />
      </RNAnimated.View>
      <RNAnimated.View style={[styles.activityDotWrap, { opacity: dot2 }]}>
        <LinearGradient colors={['#FF318C', '#7B52FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.activityDotGrad} />
      </RNAnimated.View>
      <RNAnimated.View style={[styles.activityDotWrap, { opacity: dot3 }]}>
        <LinearGradient colors={['#FF318C', '#7B52FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.activityDotGrad} />
      </RNAnimated.View>
    </View>
  );
};

const ActivityRow = ({ label, status, doneValue, doneColor = '#FFFFFF' }) => {
  const entryOpacity = useRef(new RNAnimated.Value(0)).current;
  const entryX = useRef(new RNAnimated.Value(18)).current;

  const labelOpacity = useRef(new RNAnimated.Value(1)).current;
  const searchingOpacity = useRef(new RNAnimated.Value(1)).current;
  const valueOpacity = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(entryOpacity, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      RNAnimated.timing(entryX, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [entryOpacity, entryX]);

  useEffect(() => {
    if (status === 'done') {
      RNAnimated.timing(labelOpacity, { toValue: 0.4, duration: 300, useNativeDriver: true }).start();
      RNAnimated.timing(searchingOpacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
        RNAnimated.timing(valueOpacity, { toValue: 1, duration: 280, delay: 100, useNativeDriver: true }).start();
      });
    } else {
      searchingOpacity.setValue(1);
      valueOpacity.setValue(0);
      labelOpacity.setValue(1);
    }
  }, [status, labelOpacity, searchingOpacity, valueOpacity]);

  const isSuccessValue = doneColor !== '#19191C';

  return (
    <RNAnimated.View style={[styles.activityRowWrap, { opacity: entryOpacity, transform: [{ translateX: entryX }] }]}>
      <View style={styles.activityRow}>
        <RNAnimated.Text style={[styles.activityLabel, { opacity: labelOpacity }, status === 'done' ? styles.activityLabelDone : styles.activityLabelActive]}>
          {label}
        </RNAnimated.Text>

        <View style={styles.activityRight}>
          <RNAnimated.View style={[styles.activitySearchingWrap, { opacity: searchingOpacity }]}>
            <Text style={styles.activitySearchingText}>Searching</Text>
            <SearchingDots />
          </RNAnimated.View>

          <RNAnimated.View style={{ opacity: valueOpacity }}>
            {isSuccessValue ? (
              <GradientText text={doneValue} style={styles.activityValueGradientMask} width={120} height={20} />
            ) : (
              <Text style={[styles.activityValue, { color: doneColor }]}>{doneValue}</Text>
            )}
          </RNAnimated.View>
        </View>
      </View>
    </RNAnimated.View>
  );
};

const JunieDotPulse = ({ delay = 0 }) => {
  const scale = useRef(new RNAnimated.Value(0.5)).current;
  const opacity = useRef(new RNAnimated.Value(0.3)).current;

  useEffect(() => {
    const anim = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.delay(delay),
        RNAnimated.parallel([
          RNAnimated.timing(scale, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          RNAnimated.timing(opacity, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
        RNAnimated.parallel([
          RNAnimated.timing(scale, { toValue: 0.5, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          RNAnimated.timing(opacity, { toValue: 0.3, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [delay, opacity, scale]);

  return (
    <RNAnimated.View style={[styles.thinkingDotWrap, { opacity, transform: [{ scale }] }]}>
      <LinearGradient colors={['#FF318C', '#7B52FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.thinkingDotGrad} />
    </RNAnimated.View>
  );
};

const JunieLabel = () => (
  <View style={styles.junieLabelRow}>
    <Zap size={11} color="#FF318C" strokeWidth={2.4} />
    <GradientText text="Junie" style={styles.junieLabelText} width={54} height={14} />
  </View>
);

const JunieMessage = ({ text, thinkingMs = 1200 }) => {
  const thinkingOpacity = useRef(new RNAnimated.Value(1)).current;
  const bubbleOpacity = useRef(new RNAnimated.Value(0)).current;
  const bubbleY = useRef(new RNAnimated.Value(12)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      RNAnimated.parallel([
        RNAnimated.timing(thinkingOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        RNAnimated.timing(bubbleOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        RNAnimated.timing(bubbleY, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }, thinkingMs);
    return () => clearTimeout(t);
  }, [bubbleOpacity, bubbleY, thinkingMs, thinkingOpacity]);

  return (
    <View style={styles.junieBlock}>
      <JunieLabel />

      <RNAnimated.View style={[styles.junieBubble, { opacity: thinkingOpacity }]}>
        <View style={styles.thinkingRow}>
          <JunieDotPulse delay={0} />
          <JunieDotPulse delay={200} />
          <JunieDotPulse delay={400} />
        </View>
      </RNAnimated.View>

      <RNAnimated.View style={[styles.junieBubble, { opacity: bubbleOpacity, transform: [{ translateY: bubbleY }] }]}>
        <Text style={styles.junieText}>{text}</Text>
      </RNAnimated.View>
    </View>
  );
};

const UserMessage = ({ text }) => {
  const opacity = useRef(new RNAnimated.Value(0)).current;
  const y = useRef(new RNAnimated.Value(10)).current;

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(opacity, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      RNAnimated.timing(y, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [opacity, y]);

  return (
    <RNAnimated.View style={[styles.userBubble, { opacity, transform: [{ translateY: y }] }]}>
      <Text style={styles.userText}>{text}</Text>
    </RNAnimated.View>
  );
};

const QuestionCard = ({ question, options, onAnswer }) => {
  const entryOpacity = useRef(new RNAnimated.Value(0)).current;
  const entryY = useRef(new RNAnimated.Value(20)).current;
  const exitOpacity = useRef(new RNAnimated.Value(1)).current;
  const exitY = useRef(new RNAnimated.Value(0)).current;

  const [selectedIdx, setSelectedIdx] = useState(null);
  const pressedScale = useRef(new RNAnimated.Value(1)).current;
  const autoTimer = useRef(null);
  const answered = useRef(false);

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(entryOpacity, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      RNAnimated.timing(entryY, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    autoTimer.current = setTimeout(() => {
      if (!answered.current) handleSelect(0);
    }, 3000);

    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current);
    };
  }, []);

  const handleSelect = (idx) => {
    if (answered.current) return;
    answered.current = true;
    if (autoTimer.current) clearTimeout(autoTimer.current);
    setSelectedIdx(idx);

    RNAnimated.sequence([
      RNAnimated.spring(pressedScale, { toValue: 0.97, speed: 25, bounciness: 0, useNativeDriver: true }),
      RNAnimated.spring(pressedScale, { toValue: 1, speed: 25, bounciness: 0, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      RNAnimated.parallel([
        RNAnimated.timing(exitOpacity, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        RNAnimated.timing(exitY, { toValue: 8, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start(() => {
        const opt = options[idx];
        onAnswer?.(opt.answerText ?? opt.text);
      });
    }, 350);
  };

  return (
    <RNAnimated.View style={[styles.questionWrap, { opacity: RNAnimated.multiply(entryOpacity, exitOpacity), transform: [{ translateY: RNAnimated.add(entryY, exitY) }] }]}>
      <View style={styles.qBorderWrap}>
        <LinearGradient
          colors={['#FF318C', '#7B52FF', '#FF318C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.qInnerCard}>
          <LinearGradient colors={['#FF318C', '#7B52FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.questionAccentLine} />
          <View style={styles.questionInner}>
            <GradientText text="⚡ JUNIE" style={styles.questionLabel} width={84} height={14} />
            <Text style={styles.questionText}>{question}</Text>

            <View style={styles.questionOptionsCol}>
              {options.map((opt, idx) => {
                const Icon = opt.icon;
                const isSelected = selectedIdx === idx;
                return (
                  <RNAnimated.View key={opt.text} style={{ transform: [{ scale: isSelected ? pressedScale : 1 }] }}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => handleSelect(idx)}
                      style={[
                        styles.questionOptionBtn,
                        isSelected && styles.questionOptionBtnSelected
                      ]}
                      disabled={selectedIdx !== null}
                    >
                      <Icon size={16} color="rgba(25,25,28,0.55)" />
                      <Text style={styles.questionOptionText}>{opt.text}</Text>
                    </TouchableOpacity>
                  </RNAnimated.View>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </RNAnimated.View>
  );
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
  const [showHistory, setShowHistory] = useState(false);
  const [previewTab, setPreviewTab] = useState('Preview');
  const [copyFlash, setCopyFlash] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [genFeed, setGenFeed] = useState([]);
  const [genInput, setGenInput] = useState('');

  const [task, setTask] = useState(null);
  const [taskError, setTaskError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const cancelPollRef = useRef(null);
  const seenLogsRef = useRef(new Set());
  const seenStatusesRef = useRef(new Set());

  const genScrollRef = useRef(null);
  const genProgress = useRef(new RNAnimated.Value(0)).current;
  const genTimers = useRef([]);
  const makeId = useStableId('gen');

  const sendBg = useRef(new RNAnimated.Value(0)).current;
  const sendScale = useRef(new RNAnimated.Value(1)).current;
  const shimmerAnim = useRef(new RNAnimated.Value(0)).current;
  const shimmerWidthRef = useRef(0);
  
  const showToast = useToast();
  const stateRef = useRef(state);
  const inputRef = useRef(null);
  const scrollViewRef = useRef(null);
  
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
    if (state !== 'generating') return undefined;

    setIsExpanded(true);
    setCurrentStep(0);
    setGenFeed([]);
    setGenInput('');

    genProgress.stopAnimation();
    genProgress.setValue(0);

    shimmerAnim.stopAnimation();
    shimmerAnim.setValue(0);
    const shimmerLoop = RNAnimated.loop(
      RNAnimated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    shimmerLoop.start();

    return () => {
      shimmerLoop.stop();
      shimmerAnim.stopAnimation();
      shimmerAnim.setValue(0);
    };
  }, [state, genProgress, shimmerAnim]);

  useEffect(() => {
    if (!isExpanded) return;
    const t = setTimeout(() => {
      genScrollRef.current?.scrollToEnd({ animated: true });
    }, 60);
    return () => clearTimeout(t);
  }, [genFeed.length, isExpanded]);

  const handleQuestionAnswer = (questionId, answerText) => {
    setGenFeed(prev => prev.filter(i => i.id !== questionId));
    setGenFeed(prev => [...prev, { id: makeId(), kind: 'user', text: answerText }]);
  };

  const handleSend = () => {
    const text = genInput.trim();
    if (!text) return;
    setGenInput('');
    setGenFeed(prev => [...prev, { id: makeId(), kind: 'user', text }]);
  };

  const hasSendText = genInput.trim().length > 0;

  useEffect(() => {
    RNAnimated.timing(sendBg, {
      toValue: hasSendText ? 1 : 0,
      duration: 200,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    if (hasSendText) {
      sendScale.setValue(0.82);
      RNAnimated.spring(sendScale, { toValue: 1, speed: 22, bounciness: 0, useNativeDriver: true }).start();
    } else {
      sendScale.setValue(1);
    }
  }, [hasSendText, sendBg, sendScale]);

  const shake = () => {
    RNAnimated.sequence([
      RNAnimated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      RNAnimated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      RNAnimated.timing(shakeAnim, { toValue: -4, duration: 60, useNativeDriver: true }),
      RNAnimated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
      RNAnimated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const STATUS_TO_STEP = { queued: 0, generating: 1, building: 1, deploying: 2, deployed: 3, pushing: 3, accepted: 3 };
  const STATUS_TO_LABEL = {
    generating: 'Generating code',
    building: 'Building project',
    deploying: 'Deploying preview',
    pushing: 'Pushing to GitHub',
  };

  const ingestTaskUpdate = (incoming) => {
    setTask(incoming);

    if (typeof STATUS_TO_STEP[incoming.status] === 'number') {
      setCurrentStep(STATUS_TO_STEP[incoming.status]);
    }

    if (Array.isArray(incoming.logs)) {
      setGenFeed(prev => {
        const out = [...prev];
        incoming.logs.forEach((line, idx) => {
          const key = `${idx}::${line}`;
          if (seenLogsRef.current.has(key)) return;
          seenLogsRef.current.add(key);
          if (line.startsWith('Error:')) {
            out.push({ id: `log-${idx}`, kind: 'junie', thinkingMs: 200, text: line });
          } else {
            out.push({ id: `log-${idx}`, kind: 'activity', label: line, status: 'done', doneValue: 'OK', doneColor: '#59A869' });
          }
        });
        return out;
      });
    }

    if (incoming.status && !seenStatusesRef.current.has(incoming.status)) {
      seenStatusesRef.current.add(incoming.status);
      const label = STATUS_TO_LABEL[incoming.status];
      if (label) {
        setGenFeed(prev => {
          const id = `status-${incoming.status}`;
          if (prev.some(p => p.id === id)) return prev;
          return [...prev, { id, kind: 'activity', label, status: 'searching', doneValue: 'OK', doneColor: '#59A869' }];
        });
      }
    }

    if (incoming.status === 'deployed') {
      setCurrentStep(3);
      setIsExpanded(false);
      setTimeout(() => setState('preview'), 300);
    }
    if (incoming.status === 'error') {
      setTaskError(incoming.error || 'Pipeline failed');
      setIsExpanded(false);
      setTimeout(() => setState('error'), 300);
    }
  };

  const handleGenerate = async () => {
    if (prompt.trim().length < 5) {
      shake();
      setTaskError('Prompt too short. Please provide more details.');
      setState('error');
      return;
    }

    setTask(null);
    setTaskError('');
    seenLogsRef.current = new Set();
    seenStatusesRef.current = new Set();
    if (cancelPollRef.current) {
      cancelPollRef.current();
      cancelPollRef.current = null;
    }
    setState('generating');

    try {
      const created = await createTask(prompt.trim());
      setTask(prev => ({ ...(prev || {}), id: created.taskId, status: created.status }));

      cancelPollRef.current = pollTask(created.taskId, {
        onUpdate: ingestTaskUpdate,
        onError: (err) => {
          setTaskError(err.message);
          setIsExpanded(false);
          setTimeout(() => setState('error'), 300);
        },
        intervalMs: 500,
        timeoutMs: 10 * 60 * 1000,
      });
    } catch (err) {
      setTaskError(err?.message || `Cannot reach backend at ${API_BASE}`);
      setIsExpanded(false);
      setTimeout(() => setState('error'), 300);
    }
  };

  const handleAccept = async () => {
    if (!task?.id || accepting) return;
    setAccepting(true);
    try {
      const accepted = await acceptTask(task.id);
      setTask(accepted);
      setState('success');
    } catch (err) {
      setTaskError(err?.message || 'Failed to push to GitHub');
      setState('error');
    } finally {
      setAccepting(false);
    }
  };

  const handleDiscard = () => {
    if (cancelPollRef.current) {
      cancelPollRef.current();
      cancelPollRef.current = null;
    }
    showToast('Environment discarded');
    setIsExpanded(false);
    setTimeout(() => {
      setState('empty');
      setPrompt('');
      setTask(null);
      setTaskError('');
    }, 300);
  };

  const reset = () => {
    if (cancelPollRef.current) {
      cancelPollRef.current();
      cancelPollRef.current = null;
    }
    setState('empty');
    setPrompt('');
    setTask(null);
    setTaskError('');
  };

  useEffect(() => {
    return () => {
      if (cancelPollRef.current) cancelPollRef.current();
    };
  }, []);

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

  return (
    <ScrollView ref={scrollViewRef} style={[styles.container, { paddingTop: insets.top + 8 }]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>JetDev</Text>
        {state === 'empty' && (
          <TouchableOpacity onPress={() => setShowHistory(true)} style={styles.plainHeaderBtn}>
            <Text style={styles.plainHeaderBtnText}>All Projects</Text>
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
              <ProjectCard key={proj.id} proj={proj} />
            ))}
          </View>
        </View>
      )}

      {/* FULLSCREEN GENERATING MODAL */}
      <SlideUpModal visible={isExpanded}>
        <JetDevHeroGradient isFullscreen={true}>
          {/* White base + subtle tint overlay */}
          <View pointerEvents="none" style={styles.genWhiteBase} />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,49,140,0.04)', 'rgba(123,82,255,0.06)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.genTintOverlay}
          />

          <View style={[styles.genHeader, { paddingTop: insets.top + 16 }]}>
            <TouchableOpacity onPress={handleDiscard} style={styles.genCloseBtn}>
              <X size={16} color="#19191C" />
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

          {/* PROGRESS BAR */}
          <View
            style={styles.genProgressTrack}
            onLayout={(e) => {
              shimmerWidthRef.current = e.nativeEvent.layout.width;
            }}
          >
            <RNAnimated.View
              style={[
                styles.genProgressFillWrap,
                { width: genProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }
              ]}
            >
              <RNAnimated.View
                style={{
                  width: '200%',
                  height: '100%',
                  transform: [
                    {
                      translateX: shimmerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-(shimmerWidthRef.current || 200) / 2, 0],
                      }),
                    },
                  ],
                }}
              >
                <LinearGradient
                  colors={['#FF318C', '#7B52FF', '#FF318C']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.genProgressFill}
                />
              </RNAnimated.View>
            </RNAnimated.View>
          </View>

          {/* CHAT FEED */}
          <ScrollView
            ref={genScrollRef}
            style={styles.genFeed}
            contentContainerStyle={[styles.genFeedContent, { paddingBottom: insets.bottom + 8 + 88 }]}
            showsVerticalScrollIndicator={false}
          >
            {genFeed.map(item => {
              if (item.kind === 'activity') {
                return (
                  <ActivityRow
                    key={item.id}
                    label={item.label}
                    status={item.status}
                    doneValue={item.doneValue}
                    doneColor={item.doneColor}
                  />
                );
              }
              if (item.kind === 'junie') {
                return (
                  <JunieMessage
                    key={item.id}
                    text={item.text}
                    thinkingMs={item.thinkingMs ?? 1200}
                  />
                );
              }
              if (item.kind === 'user') {
                return <UserMessage key={item.id} text={item.text} />;
              }
              if (item.kind === 'question') {
                return (
                  <QuestionCard
                    key={item.id}
                    question={item.question}
                    options={item.options}
                    onAnswer={(answerText) => handleQuestionAnswer(item.id, answerText)}
                  />
                );
              }
              return null;
            })}
          </ScrollView>

          {/* INPUT BAR */}
          <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
            <View style={styles.inputRow}>
              <TouchableOpacity style={styles.inputIconBtn} activeOpacity={0.85}>
                <Plus size={18} color="rgba(25,25,28,0.55)" />
              </TouchableOpacity>

              <TextInput
                value={genInput}
                onChangeText={setGenInput}
                placeholder="Ask Junie anything..."
                placeholderTextColor="rgba(25,25,28,0.35)"
                style={styles.inputText}
                multiline
                maxHeight={80}
              />

              <RNAnimated.View
                style={[
                  styles.sendBtn,
                  {
                    transform: [{ scale: sendScale }],
                  }
                ]}
              >
                <View pointerEvents="none" style={styles.sendBtnBaseBg} />
                <RNAnimated.View pointerEvents="none" style={[styles.sendBtnGradWrap, { opacity: sendBg }]}>
                  <LinearGradient colors={['#FF318C', '#7B52FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sendBtnGrad} />
                </RNAnimated.View>
                <TouchableOpacity
                  style={styles.sendBtnPressable}
                  activeOpacity={0.85}
                  onPress={hasSendText ? handleSend : undefined}
                >
                  {hasSendText ? (
                    <ArrowUp size={18} color="#FFFFFF" />
                  ) : (
                    <Mic size={18} color="rgba(25,25,28,0.45)" />
                  )}
                </TouchableOpacity>
              </RNAnimated.View>
            </View>
          </View>
        </JetDevHeroGradient>
      </SlideUpModal>

      {/* STATE C: Preview */}
      {state === 'preview' && (
        <View style={styles.stateWrapper}>
          <View style={styles.cardNoPad}>
            <View style={styles.previewHeaderCard}>
              <View style={styles.liveRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>● Live preview</Text>
              </View>
              <Text style={styles.stackText}>Vite + React</Text>
            </View>
            <View style={styles.codeBlock}>
              <View style={styles.codeTopBar}>
                <View style={styles.methodBadge}><Text style={styles.methodBadgeText}>URL</Text></View>
                <Text style={styles.pathText} numberOfLines={1}>{task?.previewUrl || '—'}</Text>
              </View>
              <View style={styles.codeDivider} />
              <Text style={styles.codeLine}><Text style={styles.codeKey}>Task ID</Text><Text style={styles.codeBracket}>: </Text><Text style={styles.codeString}>{task?.id || '—'}</Text></Text>
              <Text style={styles.codeLine}><Text style={styles.codeKey}>Status </Text><Text style={styles.codeBracket}>: </Text><Text style={styles.codeString}>{task?.status || '—'}</Text></Text>
              <Text style={styles.codeLine}><Text style={styles.codeKey}>Path   </Text><Text style={styles.codeBracket}>: </Text><Text style={styles.codeString} numberOfLines={1}>{task?.projectPath || '—'}</Text></Text>
            </View>
            <View style={styles.suggestedHeaderRow}>
              <Sparkles size={14} color="#7B52FF" strokeWidth={1.5} style={{ marginRight: 6 }} />
              <Text style={styles.suggestedLabel}>NEXT STEPS</Text>
            </View>
            <View style={styles.nextStepItem}><View style={styles.nextStepDot} /><Text style={styles.nextStepText}>Open the live preview</Text><ChevronRight size={14} color="#7B52FF" strokeWidth={2.5} /></View>
            <View style={styles.nextStepItem}><View style={styles.nextStepDot} /><Text style={styles.nextStepText}>Accept to push to GitHub</Text><ChevronRight size={14} color="#7B52FF" strokeWidth={2.5} /></View>
            <View style={styles.nextStepItem}><View style={styles.nextStepDot} /><Text style={styles.nextStepText}>Open in IntelliJ to keep coding</Text><ChevronRight size={14} color="#7B52FF" strokeWidth={2.5} /></View>
            <View style={styles.actionColumn}>
              <TouchableOpacity
                onPress={() => task?.previewUrl && Linking.openURL(task.previewUrl)}
                disabled={!task?.previewUrl}
                style={[styles.primaryBtn, { backgroundColor: '#7B52FF', marginBottom: 8, opacity: task?.previewUrl ? 1 : 0.5 }]}
                activeOpacity={0.8}
              >
                <ExternalLink size={15} color="#FFFFFF" strokeWidth={2} style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Open Preview</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAccept}
                disabled={accepting}
                style={[styles.primaryBtn, accepting && { opacity: 0.6 }]}
                activeOpacity={0.8}
              >
                <GitBranch size={15} color="#FFFFFF" strokeWidth={2} style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>{accepting ? 'Pushing…' : 'Accept & Commit to Git'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDiscard} style={styles.destructiveLink} activeOpacity={0.6}><Text style={styles.destructiveLinkText}>Discard environment</Text></TouchableOpacity>
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
              <TouchableOpacity
                onPress={() => task?.repoUrl && Linking.openURL(task.repoUrl)}
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
              >
                <GitHubIcon size={16} color={JB.text1} />
                <Text style={styles.githubBoxUrl} numberOfLines={1}>
                  {task?.repoUrl ? task.repoUrl.replace(/^https?:\/\//, '') : '—'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { showToast('URL copied to clipboard'); setCopyFlash(true); setTimeout(() => setCopyFlash(false), 500); }}>
                <Copy size={14} color={copyFlash ? "#0060FF" : "#ABABAB"} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoCell}><Text style={styles.infoLabel}>BRANCH</Text><Text style={styles.infoValue} numberOfLines={1}>{task?.branch || '—'}</Text></View>
              <View style={styles.infoCell}><Text style={styles.infoLabel}>STATUS</Text><Text style={styles.infoValue}>{task?.status || '—'}</Text></View>
            </View>
            <TouchableOpacity
              onPress={() => task?.branchUrl && Linking.openURL(task.branchUrl)}
              disabled={!task?.branchUrl}
              style={[styles.primaryBtn, { width: '100%', marginBottom: 8, opacity: task?.branchUrl ? 1 : 0.5 }]}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>Open in Browser</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => task?.intellijUrl && Linking.openURL(task.intellijUrl)}
              disabled={!task?.intellijUrl}
              style={[styles.primaryBtn, { backgroundColor: '#19191C', width: '100%', marginBottom: 8, opacity: task?.intellijUrl ? 1 : 0.5 }]}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>Open in IntelliJ</Text>
            </TouchableOpacity>
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
                <Text style={styles.errorBoxText}>{taskError || `Error reaching backend at ${API_BASE}`}</Text>
              </View>
              <TouchableOpacity onPress={handleGenerate} style={[styles.primaryBtn, { width: '100%', marginTop: 24, marginBottom: 8 }]} activeOpacity={0.8}><Text style={styles.primaryBtnText}>Try again</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { setState('empty'); setTaskError(''); }} style={styles.flatLink}><Text style={styles.flatLinkText}>Edit prompt</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* My Projects Modal */}
      <Modal visible={showHistory} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom, height: '90%' }]}>
            <View style={styles.projectsModalHeader}>
              <Text style={styles.modalTitle}>My Projects</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)} style={styles.projectsModalCloseBtn}>
                <X size={18} color="#19191C" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.projectsScroll} contentContainerStyle={{ padding: 16 }}>
              {historyProjects.map(proj => (
                <ProjectCard key={proj.id} proj={proj} />
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
  recentTitle: { fontSize: 11, fontWeight: '600', color: '#ABABAB', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  
  /* Minimal Project Card */
  minimalCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E8E8E8', padding: 16, marginBottom: 8 },
  minimalCardRow1: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  minimalCardName: { fontSize: 15, fontWeight: '600', color: '#19191C', flex: 1, marginRight: 10 },
  minimalCardTime: { fontSize: 12, color: '#ABABAB' },
  minimalCardRow2: { marginTop: 6 },
  minimalCardStack: { fontSize: 13, color: '#6B6B6B' },
  minimalCardRow3: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  minimalCardUrl: { fontSize: 12, color: '#ABABAB', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', flex: 1, marginRight: 10 },

  plainHeaderBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  plainHeaderBtnText: { fontSize: 14, fontWeight: '500', color: '#0060FF' },

  /* Fullscreen Generating State */
  genHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 },
  genCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.04)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  genProjectName: { color: '#19191C', fontSize: 17, fontWeight: '700' },
  genStackTag: { backgroundColor: 'rgba(0,0,0,0.035)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  genStackTagText: { color: 'rgba(25,25,28,0.9)', fontSize: 11, fontWeight: '700' },

  genWhiteBase: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF' },
  genTintOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  genStepper: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 20, marginBottom: 12 },
  genStepItem: { alignItems: 'center', flex: 1 },
  genStepCircleRow: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center', marginBottom: 10 },
  genStepIconWrap: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', zIndex: 2, backgroundColor: 'transparent' },
  genActiveCircle: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#0060FF', position: 'absolute' },
  pulsingRing: { position: 'absolute', width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0, 96, 255, 0.4)', zIndex: 1 },
  genStepPending: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'transparent', zIndex: 2 },
  genStepLine: { position: 'absolute', left: '50%', right: '-50%', height: 2, backgroundColor: 'rgba(0,0,0,0.10)', zIndex: 1 },
  genStepLineDone: { backgroundColor: JB.success },
  genStepText: { fontSize: 13, color: 'rgba(25,25,28,0.45)', fontWeight: '600' },
  genStepTextDone: { color: JB.success, fontWeight: '600' },
  genStepTextActive: { color: '#19191C', fontWeight: '800' },

  genProgressTrack: { width: '100%', height: 3, backgroundColor: '#F0F0F0', overflow: 'hidden' },
  genProgressFillWrap: { height: '100%' },
  genProgressFill: { width: '100%', height: '100%' },

  genFeed: { flex: 1, backgroundColor: 'transparent' },
  genFeedContent: { paddingTop: 8, paddingHorizontal: 0 },

  activityRowWrap: { width: '100%' },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  activityLabel: { fontSize: 15, color: '#19191C' },
  activityLabelActive: { fontWeight: '500' },
  activityLabelDone: { fontWeight: '400' },
  activityRight: { alignItems: 'flex-end', minHeight: 18, justifyContent: 'center' },
  activitySearchingWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activitySearchingText: { fontSize: 13, color: 'rgba(25,25,28,0.45)', fontStyle: 'italic' },
  activityDotsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  activityDotWrap: { width: 5, height: 5, borderRadius: 2.5, overflow: 'hidden' },
  activityDotGrad: { width: '100%', height: '100%' },
  activityValue: { fontSize: 14, fontWeight: '600' },
  activityValueGradientMask: { fontSize: 14, fontWeight: '700', color: '#000' },

  junieBlock: { width: '100%', marginTop: 10 },
  junieLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5, marginLeft: 20 },
  junieLabelText: { fontSize: 11, fontWeight: '800', color: '#000', letterSpacing: 0.8 },
  junieBubble: {
    alignSelf: 'flex-start',
    marginHorizontal: 20,
    maxWidth: '82%',
    backgroundColor: 'rgba(25,25,28,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(25,25,28,0.08)',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 6,
  },
  junieText: { fontSize: 14, color: '#19191C', lineHeight: 21 },
  thinkingRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 4 },
  thinkingDotWrap: { width: 8, height: 8, borderRadius: 4, overflow: 'hidden' },
  thinkingDotGrad: { width: '100%', height: '100%' },

  userBubble: {
    alignSelf: 'flex-end',
    marginHorizontal: 20,
    maxWidth: '72%',
    backgroundColor: 'rgba(25,25,28,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(25,25,28,0.10)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 6,
  },
  userText: { fontSize: 14, color: '#19191C' },

  questionWrap: { width: '100%' },
  qBorderWrap: { marginHorizontal: 16, marginVertical: 8, padding: 1.5, borderRadius: 19, overflow: 'hidden' },
  qInnerCard: { backgroundColor: '#FAFAFA', borderRadius: 18, overflow: 'hidden' },
  questionAccentLine: { height: 2, width: '100%' },
  questionInner: { padding: 16 },
  questionLabel: { fontSize: 10, fontWeight: '800', color: '#000', letterSpacing: 1.4, marginBottom: 10 },
  questionText: { fontSize: 16, fontWeight: '700', color: '#19191C', lineHeight: 23, marginBottom: 16 },
  questionOptionsCol: { gap: 8 },
  questionOptionBtn: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  questionOptionBtnSelected: { borderColor: '#FF318C', backgroundColor: 'rgba(255,49,140,0.10)' },
  questionOptionText: { fontSize: 14, fontWeight: '500', color: '#19191C' },

  inputBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end' },
  inputIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputText: {
    flex: 1,
    marginHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#19191C',
    fontSize: 14,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sendBtnBaseBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.04)' },
  sendBtnGradWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sendBtnGrad: { width: '100%', height: '100%' },
  sendBtnPressable: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },

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
  modalContent: { backgroundColor: JB.bg0, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  projectsModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 16 },
  projectsModalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F7', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#19191C' },
  projectsScroll: { flex: 1, backgroundColor: '#FAFAFA' },
});
