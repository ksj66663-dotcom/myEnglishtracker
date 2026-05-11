'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getTodayStr, getDayNumber, getDateStrFromDayNumber,
  isValidDay, TOTAL_DAYS,
} from '@/lib/dateUtils';
import type { VocabWord, GrammarNote } from '@/lib/db';
import DeskView from '@/components/DeskView';
import TaskNotebook from '@/components/TaskNotebook';
import ReadingNotebook from '@/components/ReadingNotebook';
import VocabNotebook from '@/components/VocabNotebook';
import SettingsModal from '@/components/SettingsModal';

export type NotebookId = 'task' | 'reading' | 'vocab';

interface DailyRecord {
  id: number;
  day_number: number;
  date_str: string;
  tasks_done: number[];
  notes: string;
}

export default function HomeClient() {
  const [mounted, setMounted] = useState(false);

  // Desk navigation state
  const [openNotebook, setOpenNotebook] = useState<NotebookId | null>(null);
  const [stackOrder, setStackOrder] = useState<NotebookId[]>(['task', 'reading', 'vocab']);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Date / clock
  const [todayStr, setTodayStr] = useState('');
  const [todayDayNumber, setTodayDayNumber] = useState(1);
  const [currentDayNumber, setCurrentDayNumber] = useState(1);
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [clock, setClock] = useState('');

  // Daily record state
  const [tasksDone, setTasksDone] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [allRecords, setAllRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Reading state lifted for notebook covers
  const [readingPass, setReadingPass] = useState(0);
  const [readingVocabWords, setReadingVocabWords] = useState<VocabWord[]>([]);
  const [readingGrammarNotes, setReadingGrammarNotes] = useState<GrammarNote[]>([]);
  const [readingSynced, setReadingSynced] = useState(false);

  const notesTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const tasksDoneRef = useRef<number[]>([]);
  const notesRef = useRef('');
  tasksDoneRef.current = tasksDone;
  notesRef.current = notes;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const str = getTodayStr();
    const raw = getDayNumber(str);
    const clamped = Math.max(1, Math.min(raw, TOTAL_DAYS));
    setTodayStr(str);
    setTodayDayNumber(clamped);
    setCurrentDayNumber(clamped);
    setCurrentDateStr(getDateStrFromDayNumber(clamped));
  }, []);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const fetchAllRecords = useCallback(async () => {
    const res = await fetch('/api/records?all=true');
    if (res.ok) setAllRecords((await res.json()) as DailyRecord[]);
  }, []);

  const fetchDayRecord = useCallback(async (dateStr: string) => {
    if (!dateStr) return;
    setLoading(true);
    const res = await fetch(`/api/records?date=${dateStr}`);
    if (res.ok) {
      const data = (await res.json()) as DailyRecord | null;
      if (data) { setTasksDone(data.tasks_done ?? []); setNotes(data.notes ?? ''); }
      else { setTasksDone([]); setNotes(''); }
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAllRecords(); }, [fetchAllRecords]);
  useEffect(() => {
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    fetchDayRecord(currentDateStr);
  }, [currentDateStr, fetchDayRecord]);

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

  // Notebook desk interactions
  const bringToFront = (id: NotebookId) => {
    setStackOrder((prev) => [id, ...prev.filter((n) => n !== id)]);
  };

  const openNotebookById = (id: NotebookId) => {
    setOpenNotebook(id);
  };

  const closeNotebook = () => {
    setOpenNotebook(null);
  };

  const completedDays = new Set(allRecords.filter((r) => r.tasks_done.length === 9).map((r) => r.day_number));
  const articlesCount = allRecords.filter((r) => r.tasks_done.includes(9)).length;

  if (!mounted) return (
    <div style={{ width: '100vw', height: '100vh', background: 'var(--color-paper)' }} />
  );

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: 'var(--color-paper)', position: 'relative' }}>

      {/* SVG Wavy Filter — defined once */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="wavy">
            <feTurbulence x="0" y="0" baseFrequency="0.02" numOctaves="5" seed="2"/>
            <feDisplacementMap in="SourceGraphic" scale="2"/>
          </filter>
        </defs>
      </svg>

      {/* ── Desk View ──────────────────────────────────────────────────── */}
      {openNotebook === null && (
        <DeskView
          stackOrder={stackOrder}
          clock={clock}
          todayStr={todayStr}
          todayDayNumber={todayDayNumber}
          tasksDone={tasksDone}
          readingPass={readingPass}
          readingVocabCount={readingVocabWords.length}
          readingSynced={readingSynced}
          articlesCount={articlesCount}
          onBringToFront={bringToFront}
          onOpenNotebook={openNotebookById}
          onSettingsOpen={() => setSettingsOpen(true)}
        />
      )}

      {/* ── Task Log Open ───────────────────────────────────────────────── */}
      {openNotebook === 'task' && (
        <TaskNotebook
          onClose={closeNotebook}
          currentDayNumber={currentDayNumber}
          currentDateStr={currentDateStr}
          todayDayNumber={todayDayNumber}
          todayStr={todayStr}
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

      {/* ── Reading Log Open ─────────────────────────────────────────────── */}
      {openNotebook === 'reading' && (
        <ReadingNotebook
          onClose={closeNotebook}
          dateStr={currentDateStr}
          articlesCount={articlesCount}
          onTaskTick={autoTickTask}
          onPassChange={setReadingPass}
          onVocabChange={setReadingVocabWords}
          onGrammarChange={setReadingGrammarNotes}
          onSyncComplete={() => setReadingSynced(true)}
        />
      )}

      {/* ── Vocabulary Log Open ──────────────────────────────────────────── */}
      {openNotebook === 'vocab' && (
        <VocabNotebook
          onClose={closeNotebook}
          vocabWords={readingVocabWords}
          grammarNotes={readingGrammarNotes}
          synced={readingSynced}
          articlesCount={articlesCount}
          currentDateStr={currentDateStr}
        />
      )}

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Grain overlay — always last */}
      <div className="grain-overlay" aria-hidden="true" />
    </div>
  );
}
