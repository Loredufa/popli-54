// src/story/types.ts
export type IllustrationSlot = 'intro' | 'conflict' | 'resolution';
export type IllustrationPlacement = 'before' | 'after';

export type IllustrationPlan = {
  slot: IllustrationSlot;
  label: string;
  paragraphIndex: number;
  placement: IllustrationPlacement;
  excerpt: string;
};

export type IllustrationResult = IllustrationPlan & {
  uri?: string | null;
};

export type IllustrationApiScene = 'intro' | 'middle' | 'end';

export type IllustrationApiPlan = {
  characters: Array<{ name: string; description: string }>;
  setting: string;
  palette: string;
  style: string;
  scenes: { intro: string; middle: string; end: string };
};

export function sceneKeyForSlot(slot: IllustrationSlot): IllustrationApiScene {
  return slot === 'intro' ? 'intro' : slot === 'conflict' ? 'middle' : 'end';
}
