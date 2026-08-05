import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as React from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import {
  loadNamedVoices,
  MAX_NAMED_VOICES,
  saveNamedVoice,
  voiceLabelExists,
  VoiceLimitError,
  type NamedVoiceData,
} from '../lib/voicePrefs';
import { THEME } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { feedback } from '../ui/feedback';

const MIN_DURATION_SEC = 20;
const MAX_DURATION_SEC = 60;

// La ventana [5s, 20s] es la que el worker recorta para condicionar el clon (ver mas abajo).
// Si JUSTO ese tramo salio bajito, la voz clonada sale peor y no hay forma de saberlo
// escuchando el resto de la grabacion, asi que se mide aparte.
const REFERENCE_WINDOW_START_MS = 5_000;
const REFERENCE_WINDOW_END_MS = 20_000;

// dBFS: 0 es el maximo y los valores son negativos. Debajo de esto la muestra esta tan floja
// que el ASR transcribe mal y el clon sale sordo. Es un aviso, no un bloqueo: el umbral es
// aproximado y depende del microfono.
const LOW_LEVEL_DBFS = -35;

const METERING_INTERVAL_MS = 250;

// El worker condiciona el clon con una ventana de 15s que arranca en el segundo 5
// (ver DEFAULT_REFERENCE_SKIP/MAX_SECONDS en poplicuentos-chatterbox-runpod/src/handler.py).
// O sea: de todo lo que se grabe, la voz clonada sale de los caracteres ~50 a ~300.
//
// El guion viejo era neutro justo ahi: en ese tramo no habia ni una "ll" ni una "y"
// consonantica, que es el rasgo que mas identifica al acento rioplatense. La unica palabra
// que lo llevaba ("estrellas") caia recien en el segundo 30, fuera de la ventana. Por eso
// el clon salia hablando neutro: nunca escucho el acento.
//
// Los marcadores que caen dentro del tramo util son "lluvia", "ya", "orilla del arroyo" y
// "Alla arriba": 3 leyendo lento, 6 leyendo rapido. Es a proposito que no sean mas. Un texto
// sobrecargado de "ll" se lee con voz de trabalenguas, y esa voz forzada es justo la que
// termina clonada. Ojo con el "Llego" del principio: cae en el caracter 0, fuera de la
// ventana, asi que no cuenta — no sirve para cumplir la cuota.
//
// El acento tampoco vive solo aca. La entonacion y el ritmo rioplatense salen en todo lo
// que se hable; estos marcadores son el piso audible, no la unica señal. Si se cambia el
// guion, que no vuelva a quedar en CERO entre los caracteres 50 y 300, que era el bug.
const READING_SCRIPT = `Llegó la noche en el bosque mágico, donde los árboles susurraban historias antes de dormir. Bajo la lluvia, un ratoncito curioso, un zorro juguetón y una lechuza sabia ya se reunían en la orilla del arroyo para contarse sus aventuras. Allá arriba, las estrellas parpadeaban una por una, como si también quisieran escuchar. «¿Qué cuento nos vas a contar hoy?», preguntaban todos llenos de emoción y con los ojos bien abiertos. Y así, entre risas, ronroneos y un poquito de magia, comenzaba otra noche llena de sueños en Poplicuentos.`;

type Step = 'name' | 'ready' | 'recording' | 'review' | 'saving';

type Props = {
  onSaved?: (voice: NamedVoiceData) => void;
  onCancel?: () => void;
};

export default function VoiceRecorder({ onSaved, onCancel }: Props) {
  const { t } = useLanguage();
  const [step, setStep] = React.useState<Step>('name');
  const [label, setLabel] = React.useState('');
  const [existingVoices, setExistingVoices] = React.useState<NamedVoiceData[]>([]);
  const [seconds, setSeconds] = React.useState(0);
  const [recordingUri, setRecordingUri] = React.useState<string | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [level, setLevel] = React.useState(0); // 0..1, solo para la barra en vivo
  const [lowLevel, setLowLevel] = React.useState(false);
  const meterSamplesRef = React.useRef<Array<{ ms: number; db: number }>>([]);
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

    const inWindow = meterSamplesRef.current.filter(
      (s) => s.ms >= REFERENCE_WINDOW_START_MS && s.ms <= REFERENCE_WINDOW_END_MS
    );
    // Sin muestras no se avisa nada: el metering no esta garantizado en todas las
    // plataformas y un falso aviso es peor que ninguno.
    const avg = inWindow.length
      ? inWindow.reduce((acc, s) => acc + s.db, 0) / inWindow.length
      : null;
    setLowLevel(avg !== null && avg < LOW_LEVEL_DBFS);

    setRecordingUri(uri);
    setStep('review');
  }, []);

  const startRecording = React.useCallback(async () => {
    const perm = await Audio.requestPermissionsAsync();
    if (perm.status !== 'granted') {
      feedback.warning(t.msg_mic_permission_title, t.msg_mic_permission_msg);
      return;
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    meterSamplesRef.current = [];
    setLevel(0);
    setLowLevel(false);
    const { recording } = await Audio.Recording.createAsync(
      { ...Audio.RecordingOptionsPresets.HIGH_QUALITY, isMeteringEnabled: true },
      (status) => {
        if (!status.isRecording || typeof status.metering !== 'number') return;
        meterSamplesRef.current.push({ ms: status.durationMillis, db: status.metering });
        // -60 dBFS ya es silencio a efectos practicos: sirve como piso de la barra.
        setLevel(Math.max(0, Math.min(1, (status.metering + 60) / 60)));
      },
      METERING_INTERVAL_MS
    );
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
  }, [stopRecording, t]);

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
    setLowLevel(false);
    setLevel(0);
    meterSamplesRef.current = [];
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
        feedback.warning(t.msg_voice_limit_title, e.message);
      } else {
        feedback.error(t.msg_voice_save_failed_title, e?.message || t.msg_retry_hint);
      }
      setStep('review');
    } finally {
      setSaving(false);
    }
  }, [recordingUri, trimmedLabel, onSaved, t]);

  const withinRange = seconds >= MIN_DURATION_SEC && seconds <= MAX_DURATION_SEC;

  return (
    <View style={{ flex: 1, backgroundColor: THEME.bgTop, padding: 20 }}>
      <Text style={{ color: THEME.text, fontSize: 20, fontWeight: '700', marginBottom: 4 }}>
        Grabar mi voz
      </Text>
      <Text style={{ color: THEME.textDim, marginBottom: 16 }}>
        Grabá 20 a 60 segundos contando el cuento de abajo. Vamos a usar tu voz para narrar cuentos, sin mandarla a ningún servicio de terceros — solo se guarda en tu teléfono.
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
        <Text style={{ color: THEME.error, fontSize: 12, marginBottom: 10 }}>Ya tenés una voz con ese nombre.</Text>
      ) : null}
      {atCap ? (
        <Text style={{ color: THEME.error, fontSize: 12, marginBottom: 10 }}>
          Ya tenés {MAX_NAMED_VOICES} voces guardadas. Borrá una en "Mis voces" (Ajustes) para grabar otra.
        </Text>
      ) : null}

      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: THEME.border, padding: 14, marginBottom: 16 }}>
        <Text style={{ color: THEME.textDim, fontSize: 12, marginBottom: 6, fontWeight: '700' }}>CONTÁ ESTO EN VOZ ALTA</Text>
        <Text style={{ color: THEME.textDim, fontSize: 12, marginBottom: 10, lineHeight: 17 }}>
          Leelo como si leyeras un cuento. 
        </Text>
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
          <View style={{ width: 200, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)', marginBottom: 14, overflow: 'hidden' }}>
            <View style={{ width: `${Math.round(level * 100)}%`, height: '100%', backgroundColor: THEME.accent }} />
          </View>
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
          {lowLevel ? (
            <Text style={{ color: THEME.warning, fontSize: 12, textAlign: 'center', marginBottom: 12 }}>
              Se te escucha bajito. Acercate al teléfono y grabá de nuevo: la voz clonada sale
              del principio de la grabación, así que si ahí suena flojo el cuento sale peor.
            </Text>
          ) : null}
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
