'use client';

import VocabNotebook from '@/components/VocabNotebook';
import type { GrammarNote, VocabWord } from '@/lib/db';

interface VocabularyLogInteriorProps {
  onClose: () => void;
  vocabWords: VocabWord[];
  grammarNotes: GrammarNote[];
  synced: boolean;
  articlesCount: number;
  currentDateStr: string;
}

export default function VocabularyLogInterior(props: VocabularyLogInteriorProps) {
  return <VocabNotebook {...props} />;
}
