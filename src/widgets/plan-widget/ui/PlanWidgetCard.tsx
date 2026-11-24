import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Check, Dices, Minus, Plus, Save, Settings2, Trash2, X } from "lucide-react-native";
import { Modal, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from "react-native";

import type { PlanDay, PlanWidget } from "@/entities/plan";
import { usePlanStore } from "@/entities/plan";
import { useMicroBreakStore } from "@/entities/micro-break";
import { dayXp, useProgressStore } from "@/entities/progress";
import { useFocusTimerStore } from "@/features/focus-timer";
import { theme } from "@/shared/config/theme";
import { AppText, ProgressBar } from "@/shared/ui";

type Props = { day: PlanDay; days: PlanDay[]; widget: PlanWidget; dragHandle?: ReactNode };

const titles = {
  "xp-by-days": "XP по дням",
  "next-task": "Следующая задача",
  "micro-breaks": "Микро-паузы",
  "day-notes": "Заметки дня",
} as const;

export function PlanWidgetCard({ day, days, widget, dragHandle }: Props) {
  const completed = useProgressStore((state) => state.completed);
  const microBreaks = useProgressStore((state) => state.microBreaks);
  const setMicroBreaks = useProgressStore((state) => state.setMicroBreaks);
  const updateNotes = usePlanStore((state) => state.updateWidgetNotes);
  const startTask = useFocusTimerStore((state) => state.startTask);
  const [notesOpen, setNotesOpen] = useState(false);
  const [draft, setDraft] = useState(widget.notes);
  const [breakIdea, setBreakIdea] = useState<string | null>(null);
  const [breakEditorOpen, setBreakEditorOpen] = useState(false);
  const [editingBreakId, setEditingBreakId] = useState<string | null>(null);
  const [breakDraft, setBreakDraft] = useState("");
  const [breakMinutes, setBreakMinutes] = useState(2);
  const breakItems = useMicroBreakStore((state) => state.items);
  const dailyBreakLimit = useMicroBreakStore((state) => state.dailyLimit);
  const setDailyBreakLimit = useMicroBreakStore((state) => state.setDailyLimit);
  const saveBreak = useMicroBreakStore((state) => state.save);
  const removeBreak = useMicroBreakStore((state) => state.remove);
  const toggleBreak = useMicroBreakStore((state) => state.toggle);
  const moveBreak = useMicroBreakStore((state) => state.move);
  const snapshot = useMemo(() => ({ completed, microBreaks }), [completed, microBreaks]);

  const scheduled = day.tasks
    .filter((task) => !completed[task.id])
    .sort((a, b) => (a.scheduledTime ?? "99:99").localeCompare(b.scheduledTime ?? "99:99"));
  const nextTask = scheduled[0];
  const recentDays = days.slice(Math.max(0, day.day - 7), day.day);
  const values = recentDays.map((item) => dayXp(item, snapshot));
  const maxXp = Math.max(1, ...values);
  const breakCount = microBreaks[day.day] ?? 0;
  const breakIdeas = breakItems.filter((item) => item.enabled);
  const changeDailyLimit = (nextLimit: number) => {
    const limit = Math.max(1, Math.min(50, nextLimit));
    setDailyBreakLimit(limit);
    Object.entries(useProgressStore.getState().microBreaks).forEach(([dayNumber, count]) => {
      if (count > limit) setMicroBreaks(Number(dayNumber), limit);
    });
  };

  return (
    <View style={styles.card} className="gap-3 bg-[#0a0a0a] p-4">
      <View className="flex-row items-center gap-3">
        {dragHandle ?? <AppText className="text-slate-500" weight="bold" style={{ fontSize: 16 }}>⠿</AppText>}
        <AppText className="min-w-0 flex-1 text-blue-400" weight="bold" style={{ fontSize: 13 }}>
          {titles[widget.type]}
        </AppText>
        {widget.type === "micro-breaks" ? <Pressable onPress={() => setBreakEditorOpen(true)} className="h-9 w-9 items-center justify-center rounded-lg border border-white/10"><Settings2 color="#cbd5e1" size={17} /></Pressable> : null}
      </View>

      {widget.type === "xp-by-days" ? (
        <View className="h-32 flex-row items-end gap-2 border-b border-white/10 px-1 pb-1">
          {recentDays.map((item, index) => (
            <View key={item.day} className="flex-1 items-center justify-end gap-1">
              <AppText className="text-gray-500" style={{ fontSize: 8 }}>{values[index]}</AppText>
              <View className="w-full rounded-t bg-blue-500" style={{ height: Math.max(4, (values[index]! / maxXp) * 82) }} />
              <AppText className="text-gray-500" style={{ fontSize: 8 }}>д{item.day}</AppText>
            </View>
          ))}
        </View>
      ) : null}

      {widget.type === "next-task" ? (
        nextTask ? (
          <View className="gap-2">
            <AppText weight="bold" style={{ fontSize: 13 }}>{nextTask.title}</AppText>
            <AppText className="text-blue-300" style={{ fontSize: 10 }}>
              {[nextTask.scheduledTime, `${nextTask.durationMin} мин`].filter(Boolean).join("  |  ")}
            </AppText>
            <Pressable onPress={() => startTask(nextTask.durationMin * 60, nextTask.title)} className="min-h-10 items-center justify-center rounded-xl border-2 border-white">
              <AppText weight="bold" style={{ fontSize: 11 }}>Начать фокус</AppText>
            </Pressable>
          </View>
        ) : <AppText className="text-gray-500" style={{ fontSize: 11 }}>Все задачи дня выполнены</AppText>
      ) : null}

      {widget.type === "micro-breaks" ? (
        <View className="gap-3">
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => setMicroBreaks(day.day, breakCount - 1)} className="h-10 w-10 items-center justify-center rounded-full bg-slate-900"><Minus color="#94a3b8" size={18} /></Pressable>
            <View className="flex-1 gap-2">
              <AppText className="text-right text-blue-300" style={{ fontSize: 10 }}>{breakCount} из {dailyBreakLimit}</AppText>
              <ProgressBar value={breakCount} max={dailyBreakLimit} />
            </View>
            <Pressable onPress={() => setMicroBreaks(day.day, breakCount + 1)} className="h-10 w-10 items-center justify-center rounded-full bg-blue-500"><Plus color="#ffffff" size={19} /></Pressable>
          </View>
          <View className="items-center gap-3 rounded-xl border border-white/10 p-3">
            {!breakIdea ? (
              <Pressable disabled={breakIdeas.length === 0} onPress={() => setBreakIdea(breakIdeas[Math.floor(Math.random() * breakIdeas.length)]?.text ?? null)} className="min-h-10 flex-row items-center justify-center gap-2 rounded-xl bg-blue-500 px-4">
                <Dices color="#fff" size={18} /><AppText weight="bold" style={{ fontSize: 11 }}>Бросить кубик</AppText>
              </Pressable>
            ) : (
              <>
                <AppText className="text-center text-blue-300" style={{ fontSize: 11 }}>{breakIdea}</AppText>
                <Pressable onPress={() => { setMicroBreaks(day.day, breakCount + 1); setBreakIdea(null); }} className="min-h-10 flex-row items-center justify-center gap-2 rounded-xl border border-green-500 px-4">
                  <Check color="#22c55e" size={18} /><AppText className="text-green-400" weight="bold" style={{ fontSize: 11 }}>Сделал</AppText>
                </Pressable>
              </>
            )}
          </View>
        </View>
      ) : null}

      {widget.type === "day-notes" ? (
        <Pressable onPress={() => { setDraft(widget.notes); setNotesOpen(true); }} className="min-h-16 justify-center rounded-xl border border-white/10 px-3">
          <AppText className={widget.notes ? "text-slate-300" : "text-gray-500"} style={{ fontSize: 11 }}>
            {widget.notes || "Пока нет заметок. Нажми, чтобы добавить текст."}
          </AppText>
        </Pressable>
      ) : null}

      <Modal visible={notesOpen} transparent animationType="fade" onRequestClose={() => setNotesOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.notesSheet} className="gap-4">
            <AppText weight="bold" style={{ fontSize: 17 }}>Заметки дня</AppText>
            <TextInput value={draft} onChangeText={setDraft} multiline autoFocus placeholder="Запиши важные мысли..." placeholderTextColor="#6b7280" style={styles.input} />
            <Pressable onPress={() => { updateNotes(day.day, widget.id, draft); setNotesOpen(false); }} className="min-h-12 flex-row items-center justify-center gap-2 rounded-xl bg-blue-500">
              <Save color="#ffffff" size={18} /><AppText weight="bold" style={{ fontSize: 12 }}>Сохранить</AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal visible={breakEditorOpen} transparent animationType="slide" onRequestClose={() => setBreakEditorOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.editorSheet} className="gap-4">
            <View className="flex-row items-center justify-between"><AppText weight="bold" style={{ fontSize: 17 }}>Микро-паузы</AppText><Pressable onPress={() => setBreakEditorOpen(false)} className="h-10 w-10 items-center justify-center rounded-xl border border-white/10"><X color="#fff" size={19} /></Pressable></View>
            <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={{ gap: 8 }}>
              {breakItems.map((item, index) => <Pressable key={item.id} onLongPress={() => { setEditingBreakId(item.id); setBreakDraft(item.text); setBreakMinutes(item.durationMinutes); }} className="flex-row items-center gap-2 rounded-xl border border-white/10 p-2">
                <Switch value={item.enabled} onValueChange={() => toggleBreak(item.id)} trackColor={{ false: "#374151", true: "#2563eb" }} />
                <View className="min-w-0 flex-1"><AppText className={item.enabled ? "text-white" : "text-gray-600"} style={{ fontSize: 10 }} numberOfLines={2}>{item.text}</AppText><AppText className="text-gray-500" style={{ fontSize: 8 }}>{item.durationMinutes} мин</AppText></View>
                <Pressable disabled={index === 0} onPress={() => moveBreak(item.id, -1)}><ArrowUp color={index === 0 ? "#334155" : "#94a3b8"} size={16} /></Pressable><Pressable disabled={index === breakItems.length - 1} onPress={() => moveBreak(item.id, 1)}><ArrowDown color={index === breakItems.length - 1 ? "#334155" : "#94a3b8"} size={16} /></Pressable><Pressable onPress={() => removeBreak(item.id)}><Trash2 color="#ef4444" size={16} /></Pressable>
              </Pressable>)}
            </ScrollView>
            <TextInput value={breakDraft} onChangeText={setBreakDraft} placeholder="Описание новой паузы" placeholderTextColor="#6b7280" style={styles.input} />
            <View className="gap-2">
              <AppText className="text-gray-400" style={{ fontSize: 9 }}>Количество микро-пауз в день</AppText>
              <View className="flex-row items-center justify-between rounded-xl border border-slate-700 p-2"><Pressable onPress={() => changeDailyLimit(dailyBreakLimit + 1)} className="h-10 w-10 items-center justify-center rounded-lg bg-blue-500"><Plus color="#fff" size={18} /></Pressable><AppText weight="bold" style={{ fontSize: 13 }}>{dailyBreakLimit} кол. пауз</AppText><Pressable disabled={dailyBreakLimit <= 1} onPress={() => changeDailyLimit(dailyBreakLimit - 1)} className="h-10 w-10 items-center justify-center rounded-lg bg-slate-900"><Minus color={dailyBreakLimit <= 1 ? "#475569" : "#fff"} size={18} /></Pressable></View>
            </View>
            <View className="gap-2">
              <AppText className="text-gray-400" style={{ fontSize: 9 }}>Длительность выбранной паузы</AppText>
              <View className="flex-row items-center justify-between rounded-xl border border-slate-700 p-2"><Pressable onPress={() => setBreakMinutes(Math.min(60, breakMinutes + 1))} className="h-10 w-10 items-center justify-center rounded-lg bg-blue-500"><Plus color="#fff" size={18} /></Pressable><AppText weight="bold" style={{ fontSize: 14 }}>{breakMinutes} мин</AppText><Pressable disabled={breakMinutes <= 1} onPress={() => setBreakMinutes(Math.max(1, breakMinutes - 1))} className="h-10 w-10 items-center justify-center rounded-lg bg-slate-900"><Minus color={breakMinutes <= 1 ? "#475569" : "#fff"} size={18} /></Pressable></View>
            </View>
            <Pressable onPress={() => { if (!breakDraft.trim()) return; saveBreak({ id: editingBreakId ?? `break-${Date.now()}`, text: breakDraft.trim(), durationMinutes: breakMinutes, enabled: true }); setEditingBreakId(null); setBreakDraft(""); setBreakMinutes(2); }} className="min-h-11 items-center justify-center rounded-xl bg-blue-500"><AppText weight="bold" style={{ fontSize: 11 }}>{editingBreakId ? "Сохранить изменения" : "Добавить паузу"}</AppText></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 2, borderColor: "#d97706", borderStyle: "dashed", borderRadius: 20 },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.86)" },
  notesSheet: { padding: 20, paddingBottom: 28, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: "#334155", backgroundColor: "#0a0a0a" },
  editorSheet: { padding: 18, paddingBottom: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: "#334155", backgroundColor: "#0a0a0a" },
  input: { minHeight: 160, borderWidth: 1, borderColor: "#334155", borderRadius: 14, padding: 14, color: "#fff", backgroundColor: "#09090b", fontFamily: theme.fonts.regular, fontSize: 12, textAlignVertical: "top" },
});
