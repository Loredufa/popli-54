// src/story/plan.ts
import type { IllustrationPlan, IllustrationSlot } from './types';

export const ILLUSTRATION_CAPTIONS: Record<IllustrationSlot, string> = {
  intro: 'Presentacion de los personajes',
  conflict: 'Conflicto en desarrollo',
  resolution: 'Resolucion del cuento',
};

export function splitStoryParagraphs(story: string): string[] {
  return story
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function buildIllustrationPlan(story: string): IllustrationPlan[] {
  const paragraphs = splitStoryParagraphs(story);
  const fallbackExcerpt = story.trim() || 'Cuento sin texto';
  if (!paragraphs.length) {
    return [
      { slot: 'intro', label: ILLUSTRATION_CAPTIONS.intro, paragraphIndex: 0, placement: 'after', excerpt: fallbackExcerpt },
      { slot: 'conflict', label: ILLUSTRATION_CAPTIONS.conflict, paragraphIndex: 0, placement: 'after', excerpt: fallbackExcerpt },
      { slot: 'resolution', label: ILLUSTRATION_CAPTIONS.resolution, paragraphIndex: 0, placement: 'before', excerpt: fallbackExcerpt },
    ];
  }

  const firstIndex = 0;
  const lastIndex = Math.max(paragraphs.length - 1, 0);
  const middleIndex = paragraphs.length === 1
    ? 0
    : paragraphs.length === 2
      ? 1
      : Math.max(1, Math.floor(paragraphs.length / 2));

  return [
    {
      slot: 'intro',
      label: ILLUSTRATION_CAPTIONS.intro,
      paragraphIndex: firstIndex,
      placement: 'after',
      excerpt: paragraphs[firstIndex] ?? fallbackExcerpt,
    },
    {
      slot: 'conflict',
      label: ILLUSTRATION_CAPTIONS.conflict,
      paragraphIndex: middleIndex,
      placement: 'after',
      excerpt: paragraphs[middleIndex] ?? paragraphs[lastIndex] ?? fallbackExcerpt,
    },
    {
      slot: 'resolution',
      label: ILLUSTRATION_CAPTIONS.resolution,
      paragraphIndex: lastIndex,
      placement: paragraphs.length === 1 ? 'after' : 'before',
      excerpt: paragraphs[lastIndex] ?? fallbackExcerpt,
    },
  ];
}
