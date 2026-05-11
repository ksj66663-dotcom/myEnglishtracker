export interface Task {
  id: number;
  title: string;
  timeLabel: string;
  duration: string;
  guide: string[];
  warning?: string;
  tip?: string;
}

export const TASKS: Task[] = [
  {
    id: 1,
    title: 'Vocabulary Review (150 words)',
    timeLabel: '06:00–06:30',
    duration: '30 min',
    guide: [
      'Open your flashcard app and complete today\'s review queue first',
      'Then begin new words: see the English → recall one meaning, 5–10 sec each',
      'Press "know" or "don\'t know" — do not hesitate, move on',
      'Target: 100 words in weeks 1–2, then increase to 150–200 from week 3',
    ],
    warning: 'Disable multiple-choice mode. Seeing wrong options plants false memories.',
  },
  {
    id: 2,
    title: 'Reading Pass 1: Read through and mark unknown words',
    timeLabel: '06:30–06:50',
    duration: '20 min',
    guide: [
      'Open today\'s Science Daily article and read from beginning to end',
      'Grasp the general meaning. When you meet an unknown word, underline it and keep reading — do not stop',
      'Do not open a dictionary during this pass',
      'When finished, prepare a blank sheet of paper for definitions',
    ],
    warning: 'No dictionary. Read the whole article first.',
  },
  {
    id: 3,
    title: 'Look up unknown words (one meaning per word, this context only)',
    timeLabel: 'After Pass 1',
    duration: '15 min',
    guide: [
      'Look up all underlined words at once',
      'For each word, find only the meaning that fits this article\'s context',
      'Write the definition on your blank paper in random order — not next to the word, not in article sequence',
      'The act of searching for the meaning later is itself a memory exercise',
    ],
    warning: 'One meaning only. Multiple definitions destroy contextual instinct.',
  },
  {
    id: 4,
    title: 'Reading Pass 2–3: Read with reference slip',
    timeLabel: '07:05–07:25',
    duration: '20 min',
    guide: [
      'Read through the article again (Pass 2)',
      'When you reach a word you looked up, try to recall its meaning first',
      'If you can\'t recall, search for it on your random-order reference slip',
      'The searching is the memorization — do not skip it',
      'Repeat for Pass 3',
    ],
  },
  {
    id: 5,
    title: 'Reading Pass 4: Resolve difficult sentences',
    timeLabel: '07:25–07:45',
    duration: '20 min',
    guide: [
      'Vocabulary should be resolved by now. Focus on sentences you can\'t parse',
      'Perform syntactic analysis: find the main verb first, then subject, then object',
      'Identify subordinate clause markers (that, which, who, when, because, etc.)',
      'Once you see the skeleton, the meaning usually follows',
    ],
    warning: 'Still stuck on a sentence? Mark it. Pass 5 is for grammar lookup.',
  },
  {
    id: 6,
    title: 'Reading Pass 5: Grammar lookup for remaining difficult sentences',
    timeLabel: '07:45–07:55',
    duration: '10 min',
    guide: [
      'For each marked sentence, look up the grammar phenomenon in a reference book',
      'Do not move on until you fully understand it — no skimming',
      'Write the grammar point and example sentence in your grammar notebook',
      'Add it to your flashcard app review queue alongside vocabulary',
    ],
  },
  {
    id: 7,
    title: 'Add today\'s new words to flashcard app',
    timeLabel: '07:55–08:00',
    duration: '5 min',
    guide: [
      'Add every new word from today\'s reading to your flashcard app word list',
      'Words from reading + words from active study reinforce each other',
      'Add grammar notes to the review queue as well',
    ],
  },
  {
    id: 8,
    title: 'Reading Pass 6: Read through smoothly',
    timeLabel: 'Before bed',
    duration: '10 min',
    guide: [
      'Read the article from beginning to end one more time — no dictionary',
      'By now, every word and sentence should be comprehensible',
      'Some stumbling is still normal and expected',
    ],
  },
  {
    id: 9,
    title: 'Reading Pass 7: Read for rhythm and flow',
    timeLabel: 'Before bed',
    duration: '10 min',
    guide: [
      'Read once more. This pass should feel smoother than Pass 6',
      'No translation in your head — read directly, let meaning arise',
      'The sensation of reading without translating is the sign of real progress',
    ],
    tip: 'After 100 articles, this sensation becomes a permanent ability.',
  },
];
