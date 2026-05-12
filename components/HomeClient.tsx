'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getTodayStr,
  getDayNumber,
  getDateStrFromDayNumber,
  isValidDay,
  TOTAL_DAYS,
} from '@/lib/dateUtils';
import type { DailyRecord, GrammarNote, VocabWord } from '@/lib/db';
import DeskView from '@/components/DeskView';
import ReadingLogInterior from '@/components/ReadingLogInterior';
import SettingsModal from '@/components/SettingsModal';
import TaskLogInterior from '@/components/TaskLogInterior';
import VocabularyLogInterior from '@/components/VocabularyLogInterior';

export type NotebookId = 'tasks' | 'reading' | 'vocabulary';
export type NotebookState = 'closed' | 'opening' | 'open' | 'closing';

export default function HomeClient() {
  const [mounted, setMounted] = useState(false);
  const [activeCard, setActiveCard] = useState<NotebookId>('tasks');
  const [openNotebook, setOpenNotebook] = useState<NotebookId | null>(null);
  const [notebookState, setNotebookState] = useState<NotebookState>('closed');
  const [liftingCard, setLiftingCard] = useState<NotebookId | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [todayStr, setTodayStr] = useState('');
  const [todayDayNumber, setTodayDayNumber] = useState(1);
  const [currentDayNumber, setCurrentDayNumber] = useState(1);
  const [currentDateStr, setCurrentDateStr] = useState('');

  const [tasksDone, setTasksDone] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [allRecords, setAllRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [readingPass, setReadingPass] = useState(0);
  const [readingVocabWords, setReadingVocabWords] = useState<VocabWord[]>([]);
  const [readingGrammarNotes, setReadingGrammarNotes] = useState<GrammarNote[]>([]);
  const [readingSynced, setReadingSynced] = useState(false);

  const notesTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const tasksDoneRef = useRef<number[]>([]);
  const notesRef = useRef('');
  tasksDoneRef.current = tasksDone;
  notesRef.current = notes;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const str = getTodayStr();
    const raw = getDayNumber(str);
    const clamped = Math.max(1, Math.min(raw, TOTAL_DAYS));
    setTodayStr(str);
    setTodayDayNumber(clamped);
    setCurrentDayNumber(clamped);
    setCurrentDateStr(getDateStrFromDayNumber(clamped));
  }, []);

  const fetchAllRecords = useCallback(async () => {
    const res = await fetch('/api/records?all=true');
    if (res.ok) setAllRecords((await res.json()) as DailyRecord[]);
  }, []);

  const applyRecord = (record: DailyRecord | null) => {
    if (!record) {
      setTasksDone([]);
      setNotes('');
      setReadingPass(0);
      setReadingVocabWords([]);
      setReadingGrammarNotes([]);
      setReadingSynced(false);
      return;
    }

    setTasksDone(record.tasks_done ?? []);
    setNotes(record.notes ?? '');
    setReadingPass(record.reading_pass ?? 0);
    setReadingVocabWords(record.vocab_words ?? []);
    setReadingGrammarNotes(record.grammar_notes ?? []);
    setReadingSynced((record.reading_pass ?? 0) >= 9);
  };

  const fetchDayRecord = useCallback(async (dateStr: string) => {
    if (!dateStr) return;
    setLoading(true);
    const res = await fetch(`/api/records?date=${dateStr}`);
    if (res.ok) applyRecord((await res.json()) as DailyRecord | null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAllRecords();
  }, [fetchAllRecords]);

  useEffect(() => {
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    fetchDayRecord(currentDateStr);
  }, [currentDateStr, fetchDayRecord]);

  const refreshCurrentData = useCallback(() => {
    fetchAllRecords();
    if (currentDateStr) fetchDayRecord(currentDateStr);
  }, [currentDateStr, fetchAllRecords, fetchDayRecord]);

  const handleNavigate = (dayNumber: number) => {
    if (!isValidDay(dayNumber)) return;
    setCurrentDayNumber(dayNumber);
    setCurrentDateStr(getDateStrFromDayNumber(dayNumber));
  };

  const saveRecord = async (dateStr: string, newTasksDone: number[], newNotes: string) => {
    setSaving(true);
    await fetch('/api/records', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateStr, tasksDone: newTasksDone, notes: newNotes }),
    });
    setSaving(false);
    fetchAllRecords();
  };

  const handleTaskToggle = async (taskId: number) => {
    const next = tasksDone.includes(taskId)
      ? tasksDone.filter((id) => id !== taskId)
      : [...tasksDone, taskId];
    setTasksDone(next);
    await saveRecord(currentDateStr, next, notes);
  };

  const autoTickTask = useCallback(async (taskId: number) => {
    const current = tasksDoneRef.current;
    if (current.includes(taskId)) return;
    const next = [...current, taskId];
    setTasksDone(next);
    await fetch('/api/records', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateStr: currentDateStr, tasksDone: next, notes: notesRef.current }),
    });
    fetchAllRecords();
  }, [currentDateStr, fetchAllRecords]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    notesTimerRef.current = setTimeout(() => saveRecord(currentDateStr, tasksDoneRef.current, value), 800);
  };

  const bringToFront = (id: NotebookId) => setActiveCard(id);
  const openNotebookById = (id: NotebookId) => {
    setActiveCard(id);
    setLiftingCard(id);
    setTimeout(() => {
      setLiftingCard(null);
      setOpenNotebook(id);
      setNotebookState('opening');
      setTimeout(() => setNotebookState('open'), 550);
    }, 200);
  };
  const closeNotebook = () => {
    setNotebookState('closing');
    setTimeout(() => {
      setNotebookState('closed');
      setOpenNotebook(null);
      refreshCurrentData();
    }, 400);
  };

  const completedDays = new Set(
    allRecords
      .filter((record) => (record.tasks_done ?? []).length === 9)
      .map((record) => record.day_number),
  );
  const articleCount = allRecords.filter((record) => (record.reading_pass ?? 0) >= 7).length;
  const totalVocab = allRecords.reduce((sum, record) => sum + (record.vocab_words?.length ?? 0), 0);
  const currentPass = Math.min(readingPass, 7);
  const syncStatus = readingSynced || readingPass >= 9 ? 'Synced' : 'Pending';

  if (!mounted) {
    return <div style={{ width: '100vw', height: '100vh', background: 'var(--color-paper)' }} />;
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#F4F1EA] dark:bg-[#232019] text-[#1F1F1F] dark:text-[#EAE3D5] relative">
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="wavy">
            <feTurbulence x="0" y="0" baseFrequency="0.02" numOctaves="5" seed="2" />
            <feDisplacementMap in="SourceGraphic" scale="2" />
          </filter>
        </defs>
      </svg>

      <DeskView
        activeCard={activeCard}
        loading={loading}
        liftingCard={liftingCard}
        todayDayNumber={todayDayNumber}
        completedDaysCount={completedDays.size}
        tasksDoneCount={tasksDone.length}
        currentPass={currentPass}
        articleCount={articleCount}
        vocabCount={readingVocabWords.length}
        totalVocab={totalVocab}
        syncStatus={syncStatus}
        onBringToFront={bringToFront}
        onOpenNotebook={openNotebookById}
        onSettingsOpen={() => setSettingsOpen(true)}
      />

      {openNotebook !== null && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-6 lg:p-12 bg-[#F4F1EA]/80 dark:bg-[#232019]/85 backdrop-blur-[2px]${
            notebookState === 'opening' ? ' animate-notebook-open' :
            notebookState === 'closing' ? ' animate-notebook-close' :
            ''
          }`}
        >
          {openNotebook === 'tasks' && (
            <TaskLogInterior
              onClose={closeNotebook}
              currentDayNumber={currentDayNumber}
              currentDateStr={currentDateStr}
              todayDayNumber={todayDayNumber}
              tasksDone={tasksDone}
              notes={notes}
              loading={loading}
              saving={saving}
              completedDays={completedDays}
              allRecordsCount={allRecords.length}
              onTaskToggle={handleTaskToggle}
              onNotesChange={handleNotesChange}
              onNavigate={handleNavigate}
            />
          )}

          {openNotebook === 'reading' && (
            <ReadingLogInterior
              onClose={closeNotebook}
              dateStr={currentDateStr}
              articlesCount={articleCount}
              onTaskTick={autoTickTask}
              onPassChange={(pass) => {
                setReadingPass(pass);
                if (pass >= 9) setReadingSynced(true);
                fetchAllRecords();
              }}
              onVocabChange={setReadingVocabWords}
              onGrammarChange={setReadingGrammarNotes}
              onSyncComplete={() => {
                setReadingSynced(true);
                fetchAllRecords();
              }}
            />
          )}

          {openNotebook === 'vocabulary' && (
            <VocabularyLogInterior
              onClose={closeNotebook}
              vocabWords={readingVocabWords}
              grammarNotes={readingGrammarNotes}
              synced={readingSynced || readingPass >= 9}
              articlesCount={articleCount}
              currentDateStr={currentDateStr}
            />
          )}
        </div>
      )}

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
