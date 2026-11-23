import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Check, Minus, Pause, Play, Plus, RotateCcw, Settings2, SkipForward, X } from "lucide-react-native";

import { useFocusTimerStore } from "@/features/focus-timer";
import { AppText } from "@/shared/ui";
import { theme } from "@/shared/config/theme";

export function CompactFocusTimer() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const mode = useFocusTimerStore((state) => state.mode);
  const remaining = useFocusTimerStore((state) => state.remaining);
  const running = useFocusTimerStore((state) => state.running);
  const taskTitle = useFocusTimerStore((state) => state.taskTitle);
  const timerLabel = useFocusTimerStore((state) => state.label);
  const workDuration = useFocusTimerStore((state) => state.workDuration);
  const breakDuration = useFocusTimerStore((state) => state.breakDuration);
  const start = useFocusTimerStore((state) => state.start);
  const pause = useFocusTimerStore((state) => state.pause);
  const reset = useFocusTimerStore((state) => state.reset);
  const skip = useFocusTimerStore((state) => state.skip);
  const sync = useFocusTimerStore((state) => state.sync);
  const configure = useFocusTimerStore((state) => state.configure);
  const [labelDraft, setLabelDraft] = useState(timerLabel);
  const [workMinutes, setWorkMinutes] = useState(workDuration / 60);
  const [breakMinutes, setBreakMinutes] = useState(breakDuration / 60);
  useEffect(() => {
    sync();
    const timer = setInterval(sync, 250);
    return () => clearInterval(timer);
  }, [sync]);
  const time = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  const label = mode === "work" ? timerLabel : "ПЕРЕРЫВ";
  const openSettings = () => {
    setLabelDraft(timerLabel);
    setWorkMinutes(workDuration / 60);
    setBreakMinutes(breakDuration / 60);
    setSettingsOpen(true);
  };

  return (
    <View className="mx-4 flex-row items-center gap-3 rounded-2xl border border-slate-800 bg-[#0a0a0a] p-4">
      <View className="min-w-0 flex-1 gap-0.5">
        <View className="self-start rounded-lg border-2 border-blue-500 px-2.5 py-1">
          <AppText className="text-blue-400" weight="semibold" style={{ fontSize: 11 }}>{label}</AppText>
        </View>
        <AppText weight="bold" style={{ fontSize: 30, lineHeight: 40 }}>{time}</AppText>
        {taskTitle ? <AppText className="text-gray-500" style={{ fontSize: 9 }} numberOfLines={1}>{taskTitle}</AppText> : null}
      </View>
      <View className="flex-row items-center gap-2">
      <Pressable onPress={running ? pause : start} accessibilityRole="button" accessibilityLabel={running ? "Поставить таймер на паузу" : "Запустить таймер"} className="h-11 w-11 items-center justify-center rounded-lg bg-blue-500">
        {running ? <Pause color="#ffffff" fill="#ffffff" size={20} /> : <Play color="#ffffff" fill="#ffffff" size={20} />}
      </Pressable>
      <Pressable onPress={reset} accessibilityRole="button" accessibilityLabel="Сбросить таймер" className="h-10 w-10 items-center justify-center rounded-lg border border-white/30">
        <RotateCcw color="#ffffff" size={17} />
      </Pressable>
      <Pressable onPress={skip} accessibilityRole="button" accessibilityLabel="Переключить этап" className="h-10 w-10 items-center justify-center rounded-lg border border-white/30"><SkipForward color="#ffffff" size={17} /></Pressable>
      <Pressable onPress={openSettings} accessibilityRole="button" accessibilityLabel="Настройки таймера" className="h-10 w-10 items-center justify-center rounded-lg border border-white"><Settings2 color="#ffffff" size={17} /></Pressable>
      </View>
      <Modal visible={settingsOpen} transparent animationType="slide" onRequestClose={() => setSettingsOpen(false)}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSettingsOpen(false)} />
          <View style={styles.sheet} className="gap-5">
            <View className="flex-row items-center justify-between">
              <AppText weight="bold" style={{ fontSize: 18 }}>Настройки таймера</AppText>
              <Pressable onPress={() => setSettingsOpen(false)} className="h-10 w-10 items-center justify-center rounded-xl border border-white/10"><X color="#fff" size={20} /></Pressable>
            </View>
            <View className="gap-2">
              <AppText className="text-gray-400" style={{ fontSize: 11 }}>Название</AppText>
              <TextInput value={labelDraft} onChangeText={setLabelDraft} maxLength={18} placeholder="РАБОТА" placeholderTextColor="#6b7280" style={styles.titleInput} />
            </View>
            <DurationPicker label="Работа" value={workMinutes} min={1} max={180} presets={[25, 45, 50, 60]} onChange={setWorkMinutes} />
            <DurationPicker label="Перерыв" value={breakMinutes} min={1} max={60} presets={[5, 10, 15, 20]} onChange={setBreakMinutes} />
            <Pressable onPress={() => { configure({ label: labelDraft, workMinutes, breakMinutes }); setSettingsOpen(false); }} className="min-h-12 flex-row items-center justify-center gap-2 rounded-xl bg-blue-500">
              <Check color="#fff" size={19} /><AppText weight="bold" style={{ fontSize: 12 }}>Сохранить</AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DurationPicker({ label, value, min, max, presets, onChange }: { label: string; value: number; min: number; max: number; presets: number[]; onChange: (value: number) => void }) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between"><AppText className="text-gray-400" style={{ fontSize: 11 }}>{label}</AppText><AppText className="text-blue-300" weight="bold" style={{ fontSize: 12 }}>{value} мин</AppText></View>
      <View className="flex-row items-center justify-between rounded-2xl border border-slate-700 p-2">
        <Pressable onPress={() => onChange(Math.max(min, value - 1))} className="h-11 w-11 items-center justify-center rounded-xl bg-slate-900"><Minus color="#fff" size={20} /></Pressable>
        <AppText weight="bold" style={{ fontSize: 28 }}>{String(value).padStart(2, "0")}:00</AppText>
        <Pressable onPress={() => onChange(Math.min(max, value + 1))} className="h-11 w-11 items-center justify-center rounded-xl bg-blue-500"><Plus color="#fff" size={20} /></Pressable>
      </View>
      <View className="flex-row gap-2">{presets.map((preset) => <Pressable key={preset} onPress={() => onChange(preset)} className={value === preset ? "min-h-9 flex-1 items-center justify-center rounded-lg border border-blue-500 bg-blue-500/10" : "min-h-9 flex-1 items-center justify-center rounded-lg border border-white/10"}><AppText className={value === preset ? "text-blue-300" : "text-gray-500"} style={{ fontSize: 10 }}>{preset}</AppText></Pressable>)}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.86)" },
  sheet: { padding: 20, paddingBottom: 28, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: "#334155", backgroundColor: "#0a0a0a" },
  titleInput: { minHeight: 48, borderWidth: 1, borderColor: "#334155", borderRadius: 12, paddingHorizontal: 14, color: "#fff", backgroundColor: "#09090b", fontFamily: theme.fonts.regular, fontSize: 13 },
});
