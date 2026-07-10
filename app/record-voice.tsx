import { router } from 'expo-router';
import VoiceRecorder from '../src/components/VoiceRecorder';

export default function RecordVoiceScreen() {
  return (
    <VoiceRecorder
      onSaved={() => router.back()}
      onCancel={() => router.back()}
    />
  );
}
