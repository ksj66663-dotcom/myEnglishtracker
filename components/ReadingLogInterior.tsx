'use client';

import ReadingNotebook from '@/components/ReadingNotebook';
import type { GrammarNote, VocabWord } from '@/lib/db';

interface ReadingLogInteriorProps {
  onClose: () => void;
  dateStr: string;
  articlesCount: number;
  onTaskTick: (taskId: number) => void;
  onPassChange: (pass: number) => void;
  onVocabChange: (words: VocabWord[]) => void;
  onGrammarChange: (notes: GrammarNote[]) => void;
  onSyncComplete: () => void;
}

export default function ReadingLogInterior(props: ReadingLogInteriorProps) {
  return <ReadingNotebook {...props} />;
}
