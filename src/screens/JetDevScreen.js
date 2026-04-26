import React, { useState, useEffect, useRef, createElement } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Animated as RNAnimated, Easing, Modal, Linking, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import MaskedView from '@react-native-masked-view/masked-view';
import { WebView } from 'react-native-webview';
import { useToast } from '../components/Toast';
import { JB, Type, Colors } from '../constants/theme';
import { quickPrompts } from '../constants/data';
import { createTask, pollTask, acceptTask } from '../api/jetdev';
import { API_BASE } from '../api/config';
import { useSpeechToText } from '../hooks/useSpeechToText';
import Svg, { Path } from 'react-native-svg';
import {
  Zap, Terminal, GitBranch, CheckCircle,
  TriangleAlert, Clock, Copy,
  ChevronRight, History, Layers,
  CircleCheck, Sparkles, X,
  Trash2, Lock, Mail, BellOff, Bell, FileCode,
  FolderOpen, Server, Code2, ExternalLink,
  Plus, Mic, ArrowUp, Square, ArrowRight
} from 'lucide-react-native';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MONO_FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';
const AnimatedTouchable = RNAnimated.createAnimatedComponent(TouchableOpacity);

const historyProjects = [
  { id: 1, name: 'Restaurant Booking API', stack: 'Node.js', time: '3 days ago', url: 'github.com/JetDev-Team/rest-api', status: 'live' },
  { id: 2, name: 'Weather CLI Tool', stack: 'Python', time: '1 week ago', url: 'github.com/JetDev-Team/weather', status: 'offline' },
  { id: 3, name: 'Portfolio Site', stack: 'React', time: '2 weeks ago', url: 'github.com/JetDev-Team/portfolio', status: 'live' },
  { id: 4, name: 'Auth Service', stack: 'Node.js', time: '1 month ago', url: 'github.com/JetDev-Team/auth-service', status: 'offline' },
];

const previewNextSteps = [
  { label: 'Add authentication (JWT)' },
  { label: 'Connect database' },
  { label: 'Add validation' },
];

// raw backend logs are shown in Preview → Logs tab

const previewFiles = [
  { path: 'src/index.js', status: 'created' },
  { path: 'src/routes/bookings.js', status: 'created' },
  { path: 'src/routes/users.js', status: 'created' },
  { path: 'prisma/schema.prisma', status: 'modified' },
  { path: 'package.json', status: 'modified' },
];

const deployedUrl = 'https://restaurant-api.jetdev.app';

/** WebView solo existe en iOS/Android; en Expo Web hay que usar <iframe>. */
function PreviewEmbed({ uri, renderLoading }) {
  if (!uri) {
    return <View style={{ flex: 1 }} />;
  }
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, minHeight: 1 }}>
        {createElement('iframe', {
          title: 'JetDev preview',
          src: uri,
          allow: 'fullscreen',
          style: { border: 'none', width: '100%', height: '100%', display: 'block' },
        })}
      </View>
    );
  }
  return (
    <WebView
      source={{ uri }}
      style={{ flex: 1 }}
      scrollEnabled
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      startInLoadingState
      renderLoading={renderLoading}
    />
  );
}

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

const ActivityRow = ({ label, subtitle, status, doneValue, doneColor = '#FFFFFF' }) => {
  const entryOpacity = useRef(new RNAnimated.Value(0)).current;
  const entryX = useRef(new RNAnimated.Value(18)).current;

  const labelOpacity = useRef(new RNAnimated.Value(1)).current;
  const searchingOpacity = useRef(new RNAnimated.Value(1)).current;
  const valueOpacity = useRef(new RNAnimated.Value(0)).current;

  const [currentSubtitle, setCurrentSubtitle] = useState(subtitle);
  const subtitleOpacity = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    if (subtitle && subtitle !== currentSubtitle) {
      RNAnimated.timing(subtitleOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setCurrentSubtitle(subtitle);
        RNAnimated.timing(subtitleOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      });
    } else if (subtitle && !currentSubtitle) {
      setCurrentSubtitle(subtitle);
    }
  }, [subtitle, currentSubtitle, subtitleOpacity]);

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(entryOpacity, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      RNAnimated.timing(entryX, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [entryOpacity, entryX]);

  useEffect(() => {
    if (status === 'done') {
      RNAnimated.timing(labelOpacity, { toValue: 0.32, duration: 300, useNativeDriver: true }).start();
      RNAnimated.timing(searchingOpacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
        RNAnimated.timing(valueOpacity, { toValue: 1, duration: 280, delay: 100, useNativeDriver: true }).start();
      });
    } else {
      searchingOpacity.setValue(1);
      valueOpacity.setValue(0);
      labelOpacity.setValue(1);
    }
  }, [status, labelOpacity, searchingOpacity, valueOpacity]);

  const isNeutralValue = doneValue === 'Node.js';
  const isSuccessValue = !isNeutralValue;
  const isSearching = status !== 'done';

  return (
    <RNAnimated.View style={[styles.activityRowWrap, { opacity: entryOpacity, transform: [{ translateX: entryX }] }]}>
      <View style={styles.activityRow}>
        <View style={styles.activityLeftCol}>
          <RNAnimated.Text style={[styles.activityLabel, { opacity: labelOpacity }, status === 'done' ? styles.activityLabelDone : styles.activityLabelActive]}>
            {label}
          </RNAnimated.Text>
          {currentSubtitle ? (
            <RNAnimated.Text style={[styles.activitySubtitle, { opacity: subtitleOpacity }]} numberOfLines={1}>
              {currentSubtitle}
            </RNAnimated.Text>
          ) : null}
        </View>

        <View style={styles.activityRight}>
          {status === 'done' && isSuccessValue ? (
            <RNAnimated.View style={{ opacity: valueOpacity }}>
              <MaskedView
                maskElement={
                  <Text style={styles.activityValueGradientMask} numberOfLines={1}>
                    {doneValue}
                  </Text>
                }
              >
                <LinearGradient
                  colors={['#FF318C', '#7B52FF']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ height: 20, minWidth: 80 }}
                />
              </MaskedView>
            </RNAnimated.View>
          ) : status === 'done' && isNeutralValue ? (
            <RNAnimated.View style={{ opacity: valueOpacity }}>
              <Text style={styles.activityValueNeutral} numberOfLines={1}>
                {doneValue}
              </Text>
            </RNAnimated.View>
          ) : isSearching ? (
            <RNAnimated.View style={[styles.activitySearchingWrap, { opacity: searchingOpacity }]}>
              <Text style={styles.activitySearchingText}>Searching</Text>
              <SearchingDots />
            </RNAnimated.View>
          ) : null}
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
    <Text style={styles.junieLabelText}>JUNIE</Text>
  </View>
);

const RecordingWaveform = () => {
  const bars = [
    useRef(new RNAnimated.Value(0.3)).current,
    useRef(new RNAnimated.Value(0.8)).current,
    useRef(new RNAnimated.Value(0.5)).current,
    useRef(new RNAnimated.Value(0.9)).current,
    useRef(new RNAnimated.Value(0.4)).current,
    useRef(new RNAnimated.Value(0.7)).current,
  ];

  useEffect(() => {
    const anims = bars.map((val, i) => {
      return RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(val, { toValue: 1, duration: 250 + (i * 50), easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          RNAnimated.timing(val, { toValue: 0.2, duration: 250 + (i * 50), easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ])
      );
    });
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={styles.waveformContainer}>
      {bars.map((val, i) => (
        <RNAnimated.View
          key={i}
          style={[styles.waveBar, {
            height: val.interpolate({ inputRange: [0, 1], outputRange: [6, 20] })
          }]}
        >
          <LinearGradient colors={['#FF318C', '#7B52FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        </RNAnimated.View>
      ))}
    </View>
  );
};

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

      <RNAnimated.View style={[styles.junieBubble, styles.thinkingBubble, { opacity: thinkingOpacity }]}>
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
    <RNAnimated.View style={[styles.userBubbleOuter, { opacity, transform: [{ translateY: y }] }]}>
      <LinearGradient colors={['#FF318C', '#7B52FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.userBubbleGradFill} />
      <View style={styles.userBubbleInner}>
        <Text style={styles.userText}>{text}</Text>
      </View>
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
        <LinearGradient colors={['#FF318C', '#7B52FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.qBorderGrad} />
        <View style={styles.qInnerCard}>
          <View style={styles.qHeaderRow}>
            <Svg width={10} height={14} viewBox="0 0 10 14">
              <Path d="M6 0L0 8h4.5L4 14l6-8H5.5L6 0z" fill="#FF318C" />
            </Svg>
            <Text style={styles.qHeaderText}>Junie</Text>
          </View>

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
                    <Icon size={16} color={isSelected ? '#FF318C' : '#ABABAB'} />
                    <Text style={[styles.questionOptionText, isSelected && styles.questionOptionTextSelected]}>{opt.text}</Text>
                  </TouchableOpacity>
                </RNAnimated.View>
              );
            })}
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
  const [genModalTab, setGenModalTab] = useState('Preview');

  const [task, setTask] = useState(null);
  const [taskError, setTaskError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [rawLogs, setRawLogs] = useState([]);
  const cancelPollRef = useRef(null);
  const seenLogsRef = useRef(new Set());
  const seenStatusesRef = useRef(new Set());

  const { isListening, transcript, error: speechError, start: startListening, stop: stopListening, cancel: cancelListening } = useSpeechToText({ lang: 'en-US' });
  const [basePrompt, setBasePrompt] = useState('');

  const genScrollRef = useRef(null);
  const genProgress = useRef(new RNAnimated.Value(0)).current;
  const genTimers = useRef([]);
  const makeId = useStableId('gen');

  const sendBg = useRef(new RNAnimated.Value(0)).current;
  const sendScale = useRef(new RNAnimated.Value(1)).current;
  const shimmerAnim = useRef(new RNAnimated.Value(0)).current;
  const shimmerWidthRef = useRef(0);

  const livePulseScale = useRef(new RNAnimated.Value(1)).current;
  const livePulseOpacity = useRef(new RNAnimated.Value(0)).current;
  
  const showToast = useToast();
  const stateRef = useRef(state);
  const inputRef = useRef(null);
  const scrollViewRef = useRef(null);
  
  const shakeAnim = useRef(new RNAnimated.Value(0)).current;
  const recordingTransition = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    if (speechError) {
      showToast(`Mic error: ${speechError}`);
    }
  }, [speechError]);

  useEffect(() => {
    RNAnimated.timing(recordingTransition, {
      toValue: isListening ? 1 : 0,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [isListening, recordingTransition]);

  useEffect(() => {
    if (isListening) {
      setPrompt((basePrompt ? basePrompt + ' ' : '') + transcript);
    }
  }, [transcript, isListening, basePrompt]);

  const handleStartListening = () => {
    setBasePrompt(prompt);
    startListening();
  };

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
    setGenModalTab('Preview');

    genProgress.stopAnimation();
    genProgress.setValue(0);
    RNAnimated.timing(genProgress, {
      toValue: 0.92,
      duration: 60000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

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
    if (!isExpanded || currentStep !== 3) return;

    livePulseScale.setValue(1);
    livePulseOpacity.setValue(0.45);
    const loop = RNAnimated.loop(
      RNAnimated.parallel([
        RNAnimated.timing(livePulseScale, { toValue: 1.8, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        RNAnimated.timing(livePulseOpacity, { toValue: 0, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
      livePulseScale.stopAnimation();
      livePulseOpacity.stopAnimation();
      livePulseScale.setValue(1);
      livePulseOpacity.setValue(0);
    };
  }, [currentStep, isExpanded, livePulseOpacity, livePulseScale]);

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

  const CANONICAL = Object.freeze({
    understanding: { key: 'understanding', label: 'Understanding request', doneValue: 'OK', doneColor: '#8A8A8A' },
    generating: { key: 'generating', label: 'Generating code', doneValue: 'OK', doneColor: '#8A8A8A' },
    building: { key: 'building', label: 'Building project', doneValue: 'OK', doneColor: '#8A8A8A' },
    deploying: { key: 'deploying', label: 'Deploying preview', doneValue: 'OK', doneColor: '#8A8A8A' },
    ready: { key: 'ready', label: 'Ready for preview', doneValue: 'OK', doneColor: '#8A8A8A' },
  });

  const LOG_TO_CANONICAL = [
    { re: /^understanding request$/i, step: CANONICAL.understanding },
    { re: /^generating code$/i, step: CANONICAL.generating },
    { re: /^building project$/i, step: CANONICAL.building },
    { re: /^deploying preview$/i, step: CANONICAL.deploying },
    { re: /^ready for acceptance$/i, step: CANONICAL.ready },
  ];

  const upsertFeedStep = (step, nextStatus, extra = {}) => {
    setGenFeed(prev => {
      const id = `step-${step.key}`;
      const existingIdx = prev.findIndex(p => p.id === id);
      const nextItem = { id, kind: 'activity', label: step.label, doneValue: step.doneValue, doneColor: step.doneColor, ...extra };
      if (nextStatus) nextItem.status = nextStatus;
      if (existingIdx === -1) return [...prev, nextItem, { id: `${id}__spacer__${Date.now()}`, kind: 'spacer', h: 6 }];
      const copy = [...prev];
      copy[existingIdx] = { ...copy[existingIdx], ...nextItem };
      return copy;
    });
  };

  const ingestTaskUpdate = (incoming) => {
    setTask(incoming);

    if (typeof STATUS_TO_STEP[incoming.status] === 'number') {
      setCurrentStep(STATUS_TO_STEP[incoming.status]);
    }

    if (Array.isArray(incoming.logs)) {
      setRawLogs(incoming.logs);
      setGenFeed(prev => {
        const out = [...prev];
        incoming.logs.forEach((line, idx) => {
          const key = `${idx}::${line}`;
          if (seenLogsRef.current.has(key)) return;
          seenLogsRef.current.add(key);
          if (typeof line !== 'string') return;
          const trimmed = line.trim();
          if (trimmed.toLowerCase().startsWith('error')) {
            // Keep errors user-friendly; raw details stay for Preview → Logs
            out.push({ id: `err-${idx}-${Date.now()}`, kind: 'junie', thinkingMs: 200, text: 'Something went wrong while building your project.' });
            return;
          }

          if (trimmed.startsWith('FEED|')) {
            // Format: FEED|key|phase|label|value
            const parts = trimmed.split('|');
            const keyPart = parts[1] || `feed-${idx}`;
            const phase = (parts[2] || '').toLowerCase();
            const label = parts[3] || 'Working...';
            const value = parts.slice(4).join('|') || '';
            // Map FEED keys → canonical step keys so we upsert existing rows
            // instead of creating duplicate entries.
            const FEED_KEY_TO_CANONICAL = {
              parse: 'understanding',
              design: 'understanding',
              code: 'generating',
              deps: 'generating',
              build: 'building',
              deploy: 'deploying',
              health: 'ready',
            };
            // Human, premium: show title + short description, fewer items.
            const FEED_UI = {
              parse: { title: 'Parsing your prompt', desc: 'Extracting the requirements and stack.' },
              design: { title: 'Designing architecture', desc: 'Planning routes, data model, and structure.' },
              code: { title: 'Generating code', desc: 'Writing files and wiring everything together.' },
              deps: { title: 'Installing dependencies', desc: 'Setting up packages and tooling.' },
              build: { title: 'Building project', desc: 'Compiling and verifying output.' },
              deploy: { title: 'Deploying preview', desc: 'Publishing a live preview URL.' },
              health: { title: 'Running health check', desc: 'Verifying the app responds correctly.' },
            };
            const canonicalKey = FEED_KEY_TO_CANONICAL[keyPart] || keyPart;
            const ui = FEED_UI[keyPart] || { title: label, desc: '' };
            // Slow down bursts slightly for a calmer, premium feel
            const delayed = phase === 'start' ? 0 : 220;
            setTimeout(() => {
              upsertFeedStep(
                { key: canonicalKey, label: ui.title, doneValue: value || 'OK', doneColor: '#8A8A8A' },
                phase === 'start' ? 'searching' : 'done',
                { subtitle: ui.desc }
              );
            }, delayed);
            return;
          }

          // Curate: map known log lines to canonical steps; do NOT display raw text.
          const match = LOG_TO_CANONICAL.find(m => m.re.test(trimmed));
          if (match) {
            // mark step done when its log arrives
            // (searching rows are created via status changes below)
            // doneValue is a small accent; details remain non-technical
            // eslint-disable-next-line no-unused-expressions
            null;
          }
        });
        return out;
      });

      // apply canonical step completions outside the setState(prev=>...) to avoid stale closures
      incoming.logs.forEach((chunk) => {
        if (typeof chunk !== 'string') return;
        
        const lines = chunk.split('\n');
        lines.forEach(line => {
          const noAnsi = line.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
          const trimmed = noAnsi.trim();
          if (!trimmed) return;
          if (trimmed.startsWith('FEED|')) return;
          
          const match = LOG_TO_CANONICAL.find(m => m.re.test(trimmed));
          if (match) {
            upsertFeedStep(match.step, 'done');
          }
        });
      });
    }

    if (incoming.status && !seenStatusesRef.current.has(incoming.status)) {
      seenStatusesRef.current.add(incoming.status);
      const label = STATUS_TO_LABEL[incoming.status];
      if (label) {
        if (incoming.status === 'generating') {
          upsertFeedStep(CANONICAL.understanding, 'searching');
          upsertFeedStep(CANONICAL.generating, 'searching');
        }
        if (incoming.status === 'building') upsertFeedStep(CANONICAL.building, 'searching');
        if (incoming.status === 'deploying') upsertFeedStep(CANONICAL.deploying, 'searching');
        if (incoming.status === 'pushing') upsertFeedStep({ key: 'pushing', label: 'Pushing to GitHub', doneValue: 'OK', doneColor: '#8A8A8A' }, 'searching');
      }

      // Junie milestone bubbles (curated)
      if (incoming.status === 'generating') {
        setGenFeed(prev => {
          const id = 'junie-intro';
          if (prev.some(p => p.id === id)) return prev;
          return [...prev, { id, kind: 'junie', thinkingMs: 1200, text: "Got it. I'm building a REST API\nwith JWT auth and a PostgreSQL database." }];
        });
      }
      if (incoming.status === 'deploying') {
        setGenFeed(prev => {
          const id = 'junie-almost';
          if (prev.some(p => p.id === id)) return prev;
          return [...prev, { id, kind: 'junie', thinkingMs: 1000, text: 'Almost there — one last thing.' }];
        });
      }
    }

    if (incoming.status === 'deployed') {
      setCurrentStep(3);
      genProgress.stopAnimation();
      RNAnimated.timing(genProgress, { toValue: 1, duration: 600, useNativeDriver: false }).start();
      upsertFeedStep(CANONICAL.deploying, 'done');
      upsertFeedStep(CANONICAL.ready, 'done');
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
      showToast('Please provide more details to generate.');
      return;
    }

    setTask(null);
    setTaskError('');
    setRawLogs([]);
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
      setTaskError(err?.message ? `${err.message} (${API_BASE})` : `Cannot reach backend at ${API_BASE}`);
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
      setIsExpanded(false);
      setTimeout(() => setState('success'), 250);
    } catch (err) {
      setTaskError(err?.message ? `${err.message} (${API_BASE})` : `Failed to push to GitHub (${API_BASE})`);
      setIsExpanded(false);
      setTimeout(() => setState('error'), 300);
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

  // Premium Hardcoded AI Generator Sequence
  useEffect(() => {
    if (task?.status === 'generating') {
      const steps = [
        "Analyzing architecture...",
        "Scaffolding React components...",
        "Writing business logic...",
        "Wiring interactive elements...",
        "Refining responsive layout...",
        "Finalizing UI polish..."
      ];
      let stepIdx = 0;
      const interval = setInterval(() => {
        if (stepIdx < steps.length) {
          upsertFeedStep(CANONICAL.generating, null, { subtitle: steps[stepIdx] });
          stepIdx++;
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [task?.status]);

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
            <Text style={styles.heroSubtitle} numberOfLines={1} adjustsFontSizeToFit>
              Describe what you want. <Text style={{ fontWeight: '600', color: '#FFFFFF' }}>Junie builds it in the cloud.</Text>
            </Text>
            <RNAnimated.View style={{ transform: [{ translateX: shakeAnim }], width: '100%' }}>
              <View style={styles.heroInputWrapper}>
                <TextInput
                  ref={inputRef}
                  value={prompt}
                  onChangeText={setPrompt}
                  placeholder="Describe your app idea..."
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  multiline
                  style={styles.heroTextarea}
                />
                <View style={[styles.heroActionRow, { position: 'relative', height: 40 }]} pointerEvents="box-none">
                  
                  {/* RECORDING UI (Left aligned) */}
                  <RNAnimated.View style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    opacity: recordingTransition,
                    pointerEvents: isListening ? 'auto' : 'none',
                    transform: [{ translateX: recordingTransition.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }]
                  }}>
                    <View style={styles.recordingDotWrap}>
                      <View style={styles.recordingDot} />
                    </View>
                    <RecordingWaveform />
                    <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '400', letterSpacing: -0.1 }}>
                      Listening...<Text style={{ color: '#FF318C', fontWeight: '300' }}>|</Text>
                    </Text>
                  </RNAnimated.View>

                  {/* MIC / STOP BUTTON */}
                  <RNAnimated.View style={{ 
                    transform: [{ translateX: recordingTransition.interpolate({ inputRange: [0, 1], outputRange: [-126, 0] }) }],
                    zIndex: 20
                  }}>
                    <AnimatedTouchable 
                      style={[
                        styles.heroMicBtn, 
                        { 
                          backgroundColor: recordingTransition.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.1)', '#FF318C'] }),
                          borderColor: recordingTransition.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.15)', '#FF318C'] }),
                          borderTopColor: recordingTransition.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.3)', '#FF318C'] }),
                          shadowColor: '#FF318C',
                          shadowOpacity: recordingTransition.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] }),
                          shadowRadius: 12,
                          shadowOffset: { width: 0, height: 4 },
                          elevation: recordingTransition.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }),
                        }
                      ]} 
                      activeOpacity={0.85} 
                      onPress={isListening ? stopListening : handleStartListening}
                    >
                      <RNAnimated.View style={{ position: 'absolute', opacity: recordingTransition.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }}>
                        <Mic size={18} color="#FFF" />
                      </RNAnimated.View>
                      <RNAnimated.View style={{ position: 'absolute', opacity: recordingTransition }}>
                        <Square size={14} color="#FFF" fill="#FFF" />
                      </RNAnimated.View>
                    </AnimatedTouchable>
                  </RNAnimated.View>

                  {/* GENERATE BUTTON */}
                  <RNAnimated.View style={{ 
                    position: 'absolute',
                    right: 0,
                    opacity: recordingTransition.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                    transform: [{ translateY: recordingTransition.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }) }],
                    pointerEvents: isListening ? 'none' : 'auto'
                  }}>
                    <TouchableOpacity 
                      onPress={handleGenerate} 
                      style={[styles.heroInnerBtn, prompt.trim().length === 0 && { opacity: 0.6 }]} 
                      activeOpacity={0.8}
                    >
                      <Zap size={13} color="#19191C" strokeWidth={2.5} fill="none" />
                      <Text style={styles.heroInnerBtnText}>Generate</Text>
                    </TouchableOpacity>
                  </RNAnimated.View>
                </View>
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
            <Text style={[styles.genProjectName, { flex: 1, textAlign: 'center', marginHorizontal: 12 }]} numberOfLines={1}>
              {basePrompt || 'New Project'}
            </Text>
            <View style={{ width: 32 }} />
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
                      <View style={styles.stepCircleDone}>
                        <LinearGradient colors={['#FF318C', '#7B52FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                        <CircleCheck size={14} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    ) : isActive ? (
                      <View style={styles.stepCircleActive}>
                        <View style={styles.stepCircleActiveDot} />
                      </View>
                    ) : (
                      <View style={styles.stepCirclePending} />
                    )}
                    {idx < stepperSteps.length - 1 && (
                      isPast ? (
                        <LinearGradient
                          colors={['#FF318C', '#7B52FF']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.stepLineDone}
                        />
                      ) : (
                        <View style={styles.stepLinePending} />
                      )
                    )}
                  </View>
                  <Text style={[styles.genStepText, isDone && styles.genStepTextDone, isActive && !isDone && styles.genStepTextActive]}>{step}</Text>
                </View>
              );
            })}
          </View>

          {currentStep === 3 ? (
            <>
              {/* STATUS BAR */}
              <View style={styles.genStatusBar}>
                <View style={styles.genLiveRow}>
                  <View style={styles.genLiveDotWrap}>
                    <LinearGradient colors={['#FF318C', '#7B52FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
                    <RNAnimated.View
                      pointerEvents="none"
                      style={[
                        styles.genLivePulseRing,
                        {
                          opacity: livePulseOpacity,
                          transform: [{ scale: livePulseScale }],
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.genLiveText}>Live on AWS</Text>
                </View>
              </View>

              {/* TABS */}
              <View style={styles.genTabs}>
                {['Preview', 'Logs', 'Files'].map((tab) => {
                  const active = genModalTab === tab;
                  return (
                    <TouchableOpacity key={tab} onPress={() => setGenModalTab(tab)} style={styles.genTabBtn} activeOpacity={0.85}>
                      <Text style={[styles.genTabText, active && styles.genTabTextActive]}>{tab}</Text>
                      {active ? (
                        <LinearGradient colors={['#FF318C', '#7B52FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.genTabUnderline} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* TAB CONTENT */}
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: insets.bottom + 28 + 110 }}
                showsVerticalScrollIndicator={false}
              >
                {genModalTab === 'Preview' ? (
                  <>
                    <View style={styles.webViewCard}>
                      <View style={styles.webChrome}>
                        <View style={styles.chromeDot1} />
                        <View style={styles.chromeDot2} />
                        <View style={styles.chromeDot3} />

                        <TouchableOpacity 
                          style={styles.urlBar}
                          activeOpacity={0.6}
                          onPress={() => {
                            const url = task?.previewUrl || deployedUrl;
                            if (url) {
                              const target = url.startsWith('http') ? url : `http://${url}`;
                              Linking.openURL(target);
                            }
                          }}
                        >
                          <Text style={[styles.urlText, { color: '#19191C', fontWeight: '500' }]} numberOfLines={1}>
                            View Website
                          </Text>
                          <ArrowRight size={12} color="#19191C" strokeWidth={2.6} />
                        </TouchableOpacity>
                      </View>

                      {!!(task?.previewUrl || deployedUrl) ? (
                        <PreviewEmbed
                          uri={task?.previewUrl || deployedUrl}
                          renderLoading={() => (
                            <View style={styles.webLoading}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <SearchingDots />
                              </View>
                            </View>
                          )}
                        />
                      ) : (
                        <View style={styles.webLoading} />
                      )}
                    </View>

                    <View style={styles.nextStepsWrap}>
                      <View style={styles.nextStepsHeader}>
                        <Sparkles size={12} color="#7B52FF" />
                        <Text style={styles.nextStepsTitle}>Next Steps</Text>
                      </View>

                      {previewNextSteps.map((s, i) => (
                        <TouchableOpacity key={i} style={styles.nextStepRow} activeOpacity={0.85}>
                          <View style={styles.nextStepAccent}>
                            <LinearGradient colors={['#FF318C', '#7B52FF']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }} />
                          </View>
                          <Text style={styles.nextStepLabel}>{s.label}</Text>
                          <ChevronRight size={14} color="#D0D0D0" strokeWidth={2.5} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                ) : genModalTab === 'Logs' ? (
                  <View style={styles.logsCard}>
                    {rawLogs
                      .filter((message) => typeof message !== 'string' || !message.trim().startsWith('FEED|'))
                      .map((message, i) => (
                      <View key={i} style={styles.logRow}>
                        <Text style={styles.logTime}>{String(i + 1).padStart(2, '0')}</Text>
                        <Text
                          style={[
                            styles.logMsg,
                            typeof message === 'string' && message.toLowerCase().startsWith('error')
                              ? { color: '#FF6B6B' }
                              : typeof message === 'string' && /ready|deployed|accepted/i.test(message)
                              ? { color: '#4ADE80' }
                              : null,
                          ]}
                        >
                          {String(message)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={{ paddingTop: 6 }}>
                    {previewFiles.map((file, i) => (
                      <View key={i} style={styles.fileRow}>
                        <View style={styles.fileLeft}>
                          <FileCode size={14} color="#ABABAB" />
                          <Text style={styles.filePath} numberOfLines={1}>
                            {file.path}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.fileBadge,
                            file.status === 'created'
                              ? { backgroundColor: 'rgba(123,82,255,0.10)' }
                              : file.status === 'modified'
                              ? { backgroundColor: 'rgba(255,49,140,0.08)' }
                              : { backgroundColor: 'rgba(0,0,0,0.05)' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.fileBadgeText,
                              file.status === 'created'
                                ? { color: '#7B52FF' }
                                : file.status === 'modified'
                                ? { color: '#FF318C' }
                                : { color: '#ABABAB' },
                            ]}
                          >
                            {file.status}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>

              {/* BOTTOM ACTION BAR */}
              <View style={[styles.previewActionBar, { paddingBottom: insets.bottom + 28 }]}>
                <TouchableOpacity style={styles.previewPrimaryBtn} activeOpacity={0.92} onPress={handleAccept}>
                  <LinearGradient colors={['#FF318C', '#7B52FF']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.previewPrimaryGrad}>
                    <GitBranch size={16} color="#FFFFFF" strokeWidth={2.2} />
                    <Text style={styles.previewPrimaryText}>Accept & Commit to Git</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 4 }} activeOpacity={0.7} onPress={handleDiscard}>
                  <Text style={styles.previewDiscardText}>Discard environment</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
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
                {genFeed.filter(i => i.kind !== 'junie').map((item, idx, filteredArr) => {
                  const prev = filteredArr[idx - 1];
                  const shouldInsertDivider =
                    item.kind !== 'activity' && (idx === 0 || prev?.kind === 'activity');

                  if (item.kind === 'activity') {
                    return (
                      <ActivityRow
                        key={item.id}
                        label={item.label}
                        subtitle={item.subtitle}
                        status={item.status}
                        doneValue={item.doneValue}
                        doneColor={item.doneColor}
                      />
                    );
                  }

                  if (item.kind === 'user') {
                    return (
                      <View key={item.id}>
                        {shouldInsertDivider ? <View style={styles.feedSectionDivider} /> : null}
                        <UserMessage text={item.text} />
                      </View>
                    );
                  }
                  if (item.kind === 'question') {
                    return (
                      <View key={item.id}>
                        {shouldInsertDivider ? <View style={styles.feedSectionDivider} /> : null}
                        <QuestionCard
                          question={item.question}
                          options={item.options}
                          onAnswer={(answerText) => handleQuestionAnswer(item.id, answerText)}
                        />
                      </View>
                    );
                  }
                  return null;
                })}
              </ScrollView>

              {/* INPUT BAR */}
              <View style={[styles.inputBar, { paddingBottom: insets.bottom + 12 }]}>
                <View style={styles.inputBarGradientBorder}>
                  <LinearGradient colors={['rgba(255,49,140,0.4)', 'rgba(123,82,255,0.4)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                </View>
                <View style={styles.inputRow}>
                  <TouchableOpacity style={styles.inputIconBtn} activeOpacity={0.85}>
                    <Plus size={20} color="rgba(25,25,28,0.55)" />
                  </TouchableOpacity>

                  <View style={styles.inputFieldWrap}>
                    <TextInput
                      value={genInput}
                      onChangeText={setGenInput}
                      placeholder="Ask Junie anything..."
                      placeholderTextColor="rgba(25,25,28,0.45)"
                      style={styles.inputText}
                      multiline
                      maxHeight={120}
                    />
                    <TouchableOpacity style={styles.inputInnerMic} activeOpacity={0.85} onPress={() => showToast('Coming soon')}>
                      <Mic size={20} color="rgba(25,25,28,0.55)" />
                    </TouchableOpacity>
                  </View>

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
                      onPress={hasSendText ? handleSend : () => showToast('Coming soon')}
                    >
                      {hasSendText ? (
                        <ArrowUp size={20} color="#FFFFFF" />
                      ) : (
                        <Zap size={20} color="rgba(25,25,28,0.45)" />
                      )}
                    </TouchableOpacity>
                  </RNAnimated.View>
                </View>
              </View>
            </>
          )}
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
  emptyState: { paddingTop: 16 },
  heroContainer: { borderRadius: 28, overflow: 'hidden', marginHorizontal: 16, marginBottom: 24, minHeight: 260, position: 'relative' },
  heroContainerFullscreen: { marginHorizontal: 0, marginTop: 0, marginBottom: 0, borderRadius: 0, flex: 1 },
  heroContent: { padding: 24, zIndex: 10, flex: 1, justifyContent: 'center' },
  heroContentFullscreen: { flex: 1, padding: 0 },
  heroSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 13.5, marginBottom: 16, textAlign: 'center', fontWeight: '400', letterSpacing: -0.2 },
  
  heroInputWrapper: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderTopColor: 'rgba(255,255,255,0.25)',
    borderLeftColor: 'rgba(255,255,255,0.18)',
    padding: 24,
    paddingTop: 28,
    minHeight: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
  },
  heroTextarea: {
    color: '#FFFFFF',
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    padding: 0,
    marginBottom: 24,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  heroActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 'auto',
  },
  heroMicBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  heroInnerBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    height: 40,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  heroInnerBtnText: { color: '#19191C', fontSize: 14, fontWeight: '700' },

  heroRecordingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroRecordingTranscript: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  heroRecordingCursor: { color: '#FF318C', fontWeight: '300', fontSize: 15 },
  heroMicBtnActive: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF318C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF318C',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  quickRow: { paddingHorizontal: 16, marginBottom: 24, marginTop: 8 },
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
  genHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  genCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F7', alignItems: 'center', justifyContent: 'center' },
  genProjectName: { color: '#19191C', fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  genStackTag: { backgroundColor: '#F5F5F7', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  genStackTagText: { color: '#8A8A8A', fontSize: 12, fontWeight: '500' },

  genWhiteBase: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF' },
  genTintOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  genStepper: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16, marginTop: 0, marginBottom: 0 },
  genStepItem: { alignItems: 'center', flex: 1 },
  genStepCircleRow: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center', marginBottom: 5 },
  genStepIconWrap: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', zIndex: 2, backgroundColor: 'transparent' },
  genActiveCircle: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#19191C', position: 'absolute' },
  pulsingRing: { position: 'absolute', width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0, 96, 255, 0.4)', zIndex: 1 },
  genStepPending: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: '#D5D5D5', backgroundColor: 'transparent', zIndex: 2 },
  genStepLine: { position: 'absolute', left: '50%', right: '-50%', height: 2, backgroundColor: '#EBEBEB', zIndex: 1 },
  genStepLineDone: { backgroundColor: '#EBEBEB' },
  genStepText: { fontSize: 11, color: '#C0C0C0', fontWeight: '400', marginTop: 5, letterSpacing: 0.1 },
  genStepTextDone: { color: '#FF318C', fontWeight: '500' },
  genStepTextActive: { color: '#19191C', fontWeight: '500' },

  stepCircleDone: { width: 26, height: 26, borderRadius: 13, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  stepCircleActive: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#19191C', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  stepCircleActiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  stepCirclePending: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: '#D5D5D5', backgroundColor: 'transparent', zIndex: 2 },
  stepLineDone: { position: 'absolute', left: '50%', right: '-50%', height: 1.5 },
  stepLinePending: { position: 'absolute', left: '50%', right: '-50%', height: 1.5, backgroundColor: '#EBEBEB' },

  genProgressTrack: { width: '100%', height: 1.5, backgroundColor: '#F0F0F0', overflow: 'hidden' },
  genProgressFillWrap: { height: '100%' },
  genProgressFill: { width: '100%', height: '100%' },

  genStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  genLiveRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  genLiveDotWrap: { width: 8, height: 8, borderRadius: 4, overflow: 'hidden', position: 'relative' },
  genLivePulseRing: { position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, borderRadius: 999, borderWidth: 1.5, borderColor: 'rgba(255,49,140,0.25)' },
  genLiveText: { fontSize: 13, fontWeight: '600', color: '#19191C', letterSpacing: -0.1 },
  genStatusStackPill: { backgroundColor: '#F5F5F7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  genStatusStackText: { fontSize: 11, fontWeight: '500', color: '#8A8A8A' },

  genTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
    gap: 4,
  },
  genTabBtn: { paddingHorizontal: 4, paddingTop: 6, paddingBottom: 10, marginRight: 16, position: 'relative' },
  genTabText: { fontSize: 13, fontWeight: '400', color: '#ABABAB', letterSpacing: -0.1 },
  genTabTextActive: { fontWeight: '600', color: '#19191C' },
  genTabUnderline: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, borderRadius: 1 },

  // (removed) old dark JSON card styles

  nextStepsWrap: { marginHorizontal: 16, marginTop: 20 },
  nextStepsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  nextStepsTitle: { fontSize: 10, fontWeight: '800', color: '#7B52FF', letterSpacing: 1.4, textTransform: 'uppercase' },
  nextStepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0' },
  nextStepAccent: { width: 2, height: 18, borderRadius: 1, overflow: 'hidden', marginRight: 12 },
  nextStepLabel: { flex: 1, fontSize: 14, fontWeight: '400', color: '#19191C', letterSpacing: -0.1 },

  logsCard: { margin: 16, backgroundColor: '#141417', borderRadius: 14, padding: 14, minHeight: 200 },
  logRow: { flexDirection: 'row', gap: 10, marginBottom: 3 },
  logTime: { fontSize: 11, fontFamily: MONO_FONT, color: 'rgba(255,255,255,0.25)', width: 52 },
  logMsg: { flex: 1, fontSize: 11, fontFamily: MONO_FONT, color: 'rgba(255,255,255,0.65)', lineHeight: 17 },

  fileRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0' },
  fileLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 12 },
  filePath: { flex: 1, fontSize: 13, fontFamily: MONO_FONT, color: '#19191C', letterSpacing: -0.1 },
  fileBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  fileBadgeText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },

  previewActionBar: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#F0F0F0', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: 12, position: 'absolute', left: 0, right: 0, bottom: 0 },
  previewPrimaryBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 10 },
  previewPrimaryGrad: { paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  previewPrimaryText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.2 },
  previewDiscardText: { fontSize: 13, fontWeight: '400', color: '#ABABAB', letterSpacing: -0.1 },

  webViewCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
    height: 260,
    backgroundColor: '#F5F5F7',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  webChrome: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F0F0F3',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    gap: 6,
  },
  chromeDot1: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.15)' },
  chromeDot2: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.10)' },
  chromeDot3: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.08)' },
  urlBar: { flex: 1, marginLeft: 8, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 5 },
  urlText: { fontSize: 11, color: '#6B6B6B', fontWeight: '400', letterSpacing: -0.1, flex: 1 },
  webLoading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#F5F5F7', justifyContent: 'center', alignItems: 'center' },

  genFeed: { flex: 1, backgroundColor: 'transparent' },
  genFeedContent: { paddingTop: 8, paddingHorizontal: 0 },
  feedSectionDivider: { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 20, marginVertical: 8 },

  activityRowWrap: { width: '100%' },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 13,
    minHeight: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  activityLeftCol: { flex: 1, paddingRight: 10 },
  activityLabel: { flex: 1, fontSize: 15, color: '#19191C', letterSpacing: -0.1 },
  activityLabelActive: { fontWeight: '500' },
  activityLabelDone: { fontWeight: '400' },
  activitySubtitle: { marginTop: 2, fontSize: 12, color: 'rgba(25,25,28,0.42)', letterSpacing: -0.05 },
  activityRight: { flexShrink: 0, marginLeft: 12, alignItems: 'flex-end' },
  activitySearchingWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activitySearchingText: { fontSize: 12, color: '#C0C0C0', fontStyle: 'italic', letterSpacing: 0.2 },
  activityDotsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  activityDotWrap: { width: 5, height: 5, borderRadius: 2.5, overflow: 'hidden' },
  activityDotGrad: { width: '100%', height: '100%' },
  activityValue: { fontSize: 13, fontWeight: '600', letterSpacing: 0.1, color: '#19191C' },
  activityValueNeutral: { fontSize: 13, fontWeight: '500', letterSpacing: 0.1, color: '#8A8A8A' },
  activityValueGradientMask: { fontSize: 13, fontWeight: '600', letterSpacing: 0.1, textAlign: 'right', backgroundColor: 'transparent' },

  junieBlock: { width: '100%', marginTop: 4 },
  junieLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 20, marginBottom: 2, marginTop: 4 },
  junieLabelText: { fontSize: 11, fontWeight: '700', color: '#FF318C', letterSpacing: 0.8, textTransform: 'uppercase' },
  junieBubble: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    backgroundColor: '#EBEBF0',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginLeft: 20,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  junieText: { fontSize: 14, lineHeight: 21, color: '#19191C', fontWeight: '400' },
  thinkingBubble: { minWidth: 60, paddingHorizontal: 16, paddingVertical: 12 },
  thinkingRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 4 },
  thinkingDotWrap: { width: 8, height: 8, borderRadius: 4, overflow: 'hidden' },
  thinkingDotGrad: { width: '100%', height: '100%' },

  userBubbleOuter: { alignSelf: 'flex-end', marginRight: 20, maxWidth: '80%', padding: 1.5, borderRadius: 21, overflow: 'hidden', marginBottom: 4 },
  userBubbleGradFill: { ...StyleSheet.absoluteFillObject, borderRadius: 21 },
  userBubbleInner: { backgroundColor: '#FFFFFF', borderRadius: 19.5, paddingHorizontal: 14, paddingVertical: 11 },
  userText: { fontSize: 14, lineHeight: 21, color: '#19191C', fontWeight: '400' },

  questionWrap: { width: '100%' },
  qBorderWrap: { marginHorizontal: 16, marginVertical: 8, padding: 1, borderRadius: 20, overflow: 'hidden' },
  qBorderGrad: { ...StyleSheet.absoluteFillObject, borderRadius: 20 },
  qInnerCard: { backgroundColor: '#FEFEFE', borderRadius: 19, padding: 18 },
  qHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  qHeaderText: { fontSize: 10, fontWeight: '800', color: '#FF318C', letterSpacing: 1.8, textTransform: 'uppercase' },
  questionText: { fontSize: 16, fontWeight: '700', color: '#19191C', lineHeight: 23, letterSpacing: -0.3, marginBottom: 16 },
  questionOptionsCol: { gap: 8 },
  questionOptionBtn: {
    backgroundColor: '#F8F8FA',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  questionOptionBtnSelected: { borderColor: '#FF318C', backgroundColor: '#FFF0F7' },
  questionOptionText: { fontSize: 14, fontWeight: '500', color: '#19191C' },
  questionOptionTextSelected: { color: '#FF318C' },

  inputBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
  },
  inputBarGradientBorder: {
    height: 1.5,
    position: 'absolute', top: 0, left: 0, right: 0,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  inputIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F7',
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputFieldWrap: {
    flex: 1,
    backgroundColor: 'rgba(245,245,247,0.8)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    paddingLeft: 16,
    paddingRight: 44,
    paddingVertical: 4,
    minHeight: 52,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inputText: {
    marginHorizontal: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 24,
    paddingVertical: 11,
    paddingHorizontal: 0,
    color: '#19191C',
    fontSize: 15,
  },
  inputInnerMic: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputInnerMicActive: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF318C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF318C',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 32,
    gap: 8,
  },
  recordingDotWrap: { width: 10, height: 10, alignItems: 'center', justifyContent: 'center' },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },
  waveformContainer: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 28 },
  waveBar: { width: 3, borderRadius: 1.5 },
  recordingTranscript: { flex: 1, fontSize: 15, color: '#19191C', fontWeight: '400' },
  recordingCursor: { color: '#FF318C', fontWeight: '300', fontSize: 15 },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sendBtnBaseBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#F5F5F7' },
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
