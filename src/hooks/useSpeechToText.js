import { useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

/**
 * Hook that encapsulates speech-to-text with real-time partial transcription.
 *
 * @param {object} opts
 * @param {string} [opts.lang='es-ES'] — BCP-47 language tag
 * @returns {{ isListening, transcript, start, stop, cancel }}
 */
export function useSpeechToText({ lang = 'es-ES' } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const accumulatedRef = useRef('');

  // ── Event listeners ───────────────────────────────────────────────────

  useSpeechRecognitionEvent('result', (ev) => {
    console.log('[Speech] result event:', ev.results[0]?.transcript, 'final:', ev.isFinal);
    if (!ev.results || ev.results.length === 0) return;
    
    // results[0] is the most confident alternative
    const bestMatch = ev.results[0];
    if (!bestMatch) return;

    const text = bestMatch.transcript ?? '';

    if (ev.isFinal) {
      accumulatedRef.current =
        (accumulatedRef.current ? accumulatedRef.current + ' ' : '') + text.trim();
      setTranscript(accumulatedRef.current);
    } else {
      const preview = accumulatedRef.current
        ? accumulatedRef.current + ' ' + text
        : text;
      setTranscript(preview);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent('error', (ev) => {
    console.log('[Speech] error event:', ev);
    setError(ev.error ?? 'Unknown speech error');
    setIsListening(false);
  });

  // ── Controls ──────────────────────────────────────────────────────────

  const start = useCallback(async () => {
    setError(null);
    console.log('[Speech] Starting speech recognition...');

    // Request permissions
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    console.log('[Speech] Permissions granted?', granted);
    if (!granted) {
      setError('Microphone permission denied');
      return;
    }

    // Reset state for a fresh session
    accumulatedRef.current = '';
    setTranscript('');
    setIsListening(true);

    try {
      ExpoSpeechRecognitionModule.start({
        lang,
        interimResults: true,
        continuous: true,
        iosTaskHint: 'dictation', // Add explicitly for iOS
        // Android-specific: prefer on-device recognizer when available
        ...(Platform.OS === 'android' ? { requiresOnDeviceRecognition: false } : {}),
      });
      console.log('[Speech] Started successfully');
    } catch (err) {
      console.log('[Speech] Error starting:', err);
      setError(err.message || 'Error starting speech module');
      setIsListening(false);
    }
  }, [lang]);

  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
    // isListening will be set to false by the 'end' event
  }, []);

  const cancel = useCallback(() => {
    ExpoSpeechRecognitionModule.abort();
    accumulatedRef.current = '';
    setTranscript('');
    setIsListening(false);
  }, []);

  return { isListening, transcript, error, start, stop, cancel };
}

export default useSpeechToText;
