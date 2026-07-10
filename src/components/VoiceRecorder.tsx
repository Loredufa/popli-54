import { Feather } from '@expo/vector-icons';
import * as React from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Audio } from 'expo-av';
import {
  saveNamedVoice,
  loadNamedVoices,
  voiceLabelExists,
  VoiceLimitError,
  MAX_NAMED_VOICES,
  type NamedVoiceData,
} from '../lib/voicePrefs';
import { THEME } from '../theme';

const MIN_DURATION_SEC = 20;
const MAX_DURATION_SEC = 60;

const READING_SCRIPT = `Había una vez un bosque mágico donde los árboles susurraban historias antes de dormir. Un ratoncito curioso, un zorro juguetón y una lechuza sabia se reunían cada noche bajo la luna para compartir sus aventuras. «¿Qué cuento nos regalarás hoy?», preguntaban todos con los ojos bien abiertos. La brisa movía las hojas mientras las estrellas parpadeaban, una por una, como si también quisieran escuchar. Y así, entre risas, ronroneos y un poquito de magia, comenzaba otra noche llena de sueños en Poplicuentos.`;

type Step = 'name' | 'ready' | 'recording' | 'review' | 'saving';

type Props = {
  onSaved?: (voice: NamedVoiceData) => void;
  onCancel?: () => void;
};

export default function VoiceRecorder({ onSaved, onCancel }: Props) {
  const [step, setStep] = React.useState<Step>('name');
  const [label, setLabel] = React.useState('');
  const [existingVoices, setExistingVoices] = React.useState<NamedVoiceData[]>([]);
  const [seconds, setSeconds] = React.useState(0);
  const [recordingUri, setRecordingUri] = React.useState<string | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const recordingRef = React.useRef<Audio.Recording | null>(null);
  const playbackRef = React.useRef<Audio.Sound | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    loadNamedVoices().then(setExistingVoices);
    return () => {
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      playbackRef.current?.unloadAsync().catch(() => {});
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const atCap = existingVoices.length >= MAX_NAMED_VOICES;
  const trimmedLabel = label.trim();
  const isDuplicate = trimmedLabel.length > 0 && voiceLabelExists(trimmedLabel, existingVoices);
  const canStartRecording = trimmedLabel.length > 0 && trimmedLabel.length <= 24 && !isDuplicate && !atCap;

  const stopRecording = React.useCallback(async () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const recording = recordingRef.current;
    if (!recording) return;
    await recording.stopAndUnloadAsync().catch(() => {});
    const uri = recording.getURI();
    recordingRef.current = null;
    setRecordingUri(uri);
    setStep('review');
  }, []);

  const startRecording = React.useCallback(async () => {
    const perm = await Audio.requestPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso al micrófono para grabar tu voz.');
      return;
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    recordingRef.current = recording;
    setSeconds(0);
    setStep('recording');
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        const next = s + 1;
        if (next >= MAX_DURATION_SEC) {
          stopRecording();
        }
        return next;
      });
    }, 1000);
  }, [stopRecording]);

  const playPreview = React.useCallback(async () => {
    if (!recordingUri) return;
    if (playbackRef.current) {
      await playbackRef.current.unloadAsync().catch(() => {});
      playbackRef.current = null;
    }
    const { sound } = await Audio.Sound.createAsync({ uri: recordingUri }, { shouldPlay: true });
    playbackRef.current = sound;
    setPlaying(true);
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) setPlaying(false);
    });
  }, [recordingUri]);

  const reRecord = React.useCallback(() => {
    setRecordingUri(null);
    setSeconds(0);
    setStep('ready');
  }, []);

  const confirmSave = React.useCallback(async () => {
    if (!recordingUri) return;
    setSaving(true);
    setStep('saving');
    try {
      const voice = await saveNamedVoice({ label: trimmedLabel, tempUri: recordingUri }); // cero red
      onSaved?.(voice);
    } catch (e: any) {
      if (e instanceof VoiceLimitError) {
        Alert.alert('Límite alcanzado', e.message);
      } else {
        Alert.alert('No se pudo guardar', e?.message || 'Intentalo de nuevo.');
      }
      setStep('review');
    } finally {
      setSaving(false);
    }
  }, [recordingUri, trimmedLabel, onSaved]);

  const withinRange = seconds >= MIN_DURATION_SEC && seconds <= MAX_DURATION_SEC;

  return (
    <View style={{ flex: 1, backgroundColor: THEME.bgTop, padding: 20 }}>
      <Text style={{ color: THEME.text, fontSize: 20, fontWeight: '700', marginBottom: 4 }}>
        Grabar mi voz
      </Text>
      <Text style={{ color: THEME.textDim, marginBottom: 16 }}>
        Grabá 20 a 60 segundos leyendo el texto de abajo. Vamos a usar tu voz para narrar cuentos, sin mandarla a ningún servicio de terceros — solo se guarda en tu teléfono.
      </Text>

      <TextInput
        placeholder="¿Cómo se llama esta voz? Ej: Mamá, Papá, Abuela"
        placeholderTextColor="#8fa0c2"
        value={label}
        onChangeText={setLabel}
        maxLength={24}
        editable={step === 'name' || step === 'ready'}
        style={{ color: THEME.text, borderColor: THEME.border, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 6 }}
      />
      {isDuplicate ? (
        <Text style={{ color: '#ffb4b4', fontSize: 12, marginBottom: 10 }}>Ya tenés una voz con ese nombre.</Text>
      ) : null}
      {atCap ? (
        <Text style={{ color: '#ffb4b4', fontSize: 12, marginBottom: 10 }}>
          Ya tenés {MAX_NAMED_VOICES} voces guardadas. Borrá una en "Mis voces" (Ajustes) para grabar otra.
        </Text>
      ) : null}

      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: THEME.border, padding: 14, marginBottom: 16 }}>
        <Text style={{ color: THEME.textDim, fontSize: 12, marginBottom: 6, fontWeight: '700' }}>LEÉ ESTO EN VOZ ALTA</Text>
        <ScrollView style={{ maxHeight: 180 }}>
          <Text style={{ color: THEME.text, fontSize: 15, lineHeight: 22 }}>{READING_SCRIPT}</Text>
        </ScrollView>
      </View>

      {step === 'name' || step === 'ready' ? (
        <Pressable
          disabled={!canStartRecording}
          onPress={startRecording}
          style={{ opacity: canStartRecording ? 1 : 0.4, alignSelf: 'center', width: 84, height: 84, borderRadius: 42, backgroundColor: THEME.primary, alignItems: 'center', justifyContent: 'center' }}
        >
          <Feather name="mic" size={32} color="#0b1226" />
        </Pressable>
      ) : null}

      {step === 'recording' ? (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: withinRange ? THEME.accent : THEME.textDim, fontSize: 28, fontWeight: '700', marginBottom: 12 }}>
            {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
          </Text>
          <Pressable onPress={stopRecording} style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: '#ff5a5a', alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="square" size={28} color="#fff" />
          </Pressable>
          {seconds < MIN_DURATION_SEC ? (
            <Text style={{ color: THEME.textDim, marginTop: 10 }}>Grabá al menos {MIN_DURATION_SEC} segundos.</Text>
          ) : null}
        </View>
      ) : null}

      {step === 'review' ? (
        <View>
          <Text style={{ color: THEME.textDim, textAlign: 'center', marginBottom: 12 }}>
            Grabaste {seconds}s. {withinRange ? '' : `Necesitás entre ${MIN_DURATION_SEC} y ${MAX_DURATION_SEC}s.`}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
            <Pressable onPress={playPreview} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name={playing ? 'volume-2' : 'play'} size={20} color={THEME.accent} />
              <Text style={{ color: THEME.accent, marginLeft: 6 }}>Escuchar</Text>
            </Pressable>
            <Pressable onPress={reRecord} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="rotate-ccw" size={20} color={THEME.textDim} />
              <Text style={{ color: THEME.textDim, marginLeft: 6 }}>Grabar de nuevo</Text>
            </Pressable>
          </View>
          <Pressable
            disabled={!withinRange || saving}
            onPress={confirmSave}
            style={{ opacity: withinRange && !saving ? 1 : 0.4, backgroundColor: THEME.primary, borderRadius: 12, padding: 14, alignItems: 'center' }}
          >
            <Text style={{ color: '#0b1226', fontWeight: '700' }}>{saving ? 'Guardando...' : 'Usar esta grabación'}</Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable onPress={onCancel} style={{ marginTop: 20, alignSelf: 'center' }}>
        <Text style={{ color: THEME.textDim }}>Cancelar</Text>
      </Pressable>
    </View>
  );
}
