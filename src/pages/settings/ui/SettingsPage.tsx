import { useState, type ReactNode } from "react";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usePlanStore } from "@/entities/plan";
import { useProgressStore } from "@/entities/progress";
import { useSettingsStore } from "@/entities/settings";
import { AuthSheet, isAccountSnapshot, restoreAccountSnapshot, takeAccountSnapshot, useAccount } from "@/features/account";
import { supabase } from "@/shared/config/supabase";
import { theme } from "@/shared/config/theme";
import { AppText } from "@/shared/ui";

const statuses = [["#3b82f6", "Текущий день", "День, который идёт сейчас"], ["#22c55e", "Выполнен", "Все обязательные задачи завершены"], ["#eab308", "Частично", "Выполнена часть обязательных задач"], ["#ef4444", "Пропущен", "Прошедший день без полного выполнения"], ["#475569", "Будущий", "День ещё не наступил"]] as const;
const rewardLevels = [["bronze", "Бронза", "500 XP"], ["silver", "Серебро", "1 200 XP"], ["gold", "Золото", "1 800 XP"], ["boss", "Финальный босс", "После финального испытания"]] as const;

function Section({ title, children, danger = false }: { title: string; children: ReactNode; danger?: boolean }) {
  return <View style={danger ? { borderColor: "rgba(239,68,68,0.4)" } : undefined} className="gap-4 rounded-2xl border border-slate-800 p-4"><AppText className={danger ? "text-red-400" : "text-blue-400"} weight="bold" style={{ fontSize: 14 }}>{title}</AppText>{children}</View>;
}
function Field({ value, onChangeText, placeholder, multiline = false }: { value: string; onChangeText: (value: string) => void; placeholder: string; multiline?: boolean }) {
  return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#64748b" multiline={multiline} style={[styles.input, multiline && { minHeight: 76, textAlignVertical: "top" }]} />;
}

export function SettingsPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [message, setMessage] = useState("");
  const template = usePlanStore((state) => state.template);
  const updatePlanInfo = usePlanStore((state) => state.updatePlanInfo);
  const resetProgress = useProgressStore((state) => state.reset);
  const rewards = useSettingsStore((state) => state.rewards);
  const setReward = useSettingsStore((state) => state.setReward);
  const [planTitle, setPlanTitle] = useState(template.title);
  const [planDescription, setPlanDescription] = useState(template.description);
  const user = useAccount();

  const exportBackup = async () => {
    try {
      const file = new File(Paths.cache, `planer-backup-${new Date().toISOString().slice(0, 10)}-${Date.now()}.json`);
      file.create();
      await file.write(JSON.stringify(takeAccountSnapshot(), null, 2));
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: "application/json", dialogTitle: "Сохранить резервную копию Планера" });
      setMessage("Резервная копия создана.");
    } catch { setMessage("Не удалось создать резервную копию."); }
  };
  const importBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/json", copyToCacheDirectory: true, multiple: false });
      if (result.canceled) return;
      const parsed: unknown = JSON.parse(await new File(result.assets[0].uri).text());
      if (!isAccountSnapshot(parsed)) { setMessage("Файл не является резервной копией Планера."); return; }
      restoreAccountSnapshot(parsed);
      setPlanTitle(parsed.plan.template.title);
      setPlanDescription(parsed.plan.template.description);
      setMessage("Резервная копия восстановлена.");
    } catch { setMessage("Не удалось прочитать резервную копию."); }
  };

  return <SafeAreaView className="flex-1 bg-[#0a0a0a]" edges={["top"]}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: 36 }}>
      <View className="gap-1"><AppText weight="bold" style={{ fontSize: 24 }}>Настройки</AppText><AppText className="text-gray-400" style={{ fontSize: 11 }}>План, награды, данные и аккаунт</AppText></View>
      <Section title="План">
        <View className="gap-2"><AppText className="text-gray-400" style={{ fontSize: 10 }}>Название</AppText><Field value={planTitle} onChangeText={setPlanTitle} placeholder="Мой план" /></View>
        <View className="gap-2"><AppText className="text-gray-400" style={{ fontSize: 10 }}>Описание</AppText><Field value={planDescription} onChangeText={setPlanDescription} placeholder="Мои задачи и цели" multiline /></View>
        <Pressable onPress={() => { if (!planTitle.trim()) { setMessage("Название плана не может быть пустым."); return; } updatePlanInfo(planTitle, planDescription); setMessage("Информация о плане сохранена."); }} className="min-h-11 items-center justify-center rounded-xl bg-blue-500"><AppText weight="bold" style={{ fontSize: 11 }}>Сохранить план</AppText></Pressable>
      </Section>
      <Section title="Награды за уровни">
        <AppText className="text-gray-500" style={{ fontSize: 9 }}>Придумай награду за достижение каждого этапа.</AppText>
        {rewardLevels.map(([id, title, hint]) => <View key={id} className="gap-1.5"><View className="flex-row justify-between"><AppText weight="semibold" style={{ fontSize: 11 }}>{title}</AppText><AppText className="text-gray-600" style={{ fontSize: 8 }}>{hint}</AppText></View><Field value={rewards[id] ?? ""} onChangeText={(value) => setReward(id, value)} placeholder="Например: купить что-нибудь приятное" /></View>)}
      </Section>
      <Section title="Резервная копия">
        <AppText className="text-gray-500" style={{ fontSize: 9 }}>JSON содержит план, задачи, заметки, прогресс, награды, таймер и микро-паузы.</AppText>
        <Pressable onPress={() => void exportBackup()} className="min-h-11 items-center justify-center rounded-xl bg-blue-500"><AppText weight="bold" style={{ fontSize: 11 }}>Экспортировать данные</AppText></Pressable>
        <Pressable onPress={() => void importBackup()} className="min-h-11 items-center justify-center rounded-xl border border-slate-600"><AppText weight="bold" style={{ fontSize: 11 }}>Импортировать JSON</AppText></Pressable>
        <AppText className="text-amber-500" style={{ fontSize: 8 }}>Импорт полностью заменит текущий план и прогресс.</AppText>
      </Section>
      <Section title="Аккаунт и синхронизация">
        {!supabase ? <AppText className="text-amber-400" style={{ fontSize: 10 }}>Supabase не настроен.</AppText> : user === undefined ? <AppText className="text-gray-500" style={{ fontSize: 10 }}>Проверяем сессию…</AppText> : user ? <><AppText className="text-gray-300" style={{ fontSize: 11 }}>{user.email}</AppText><Pressable onPress={() => void supabase?.auth.signOut({ scope: "local" })} className="min-h-11 items-center justify-center rounded-xl border border-red-500"><AppText className="text-red-400" weight="bold" style={{ fontSize: 11 }}>Выйти в гостевой режим</AppText></Pressable></> : <><AppText className="text-gray-500" style={{ fontSize: 9 }}>Войди, чтобы использовать один план в web и приложении.</AppText><Pressable onPress={() => setAuthOpen(true)} className="min-h-11 items-center justify-center rounded-xl bg-blue-500"><AppText weight="bold" style={{ fontSize: 11 }}>Войти или зарегистрироваться</AppText></Pressable></>}
      </Section>
      <Section title="Статусы календаря">{statuses.map(([color, title, description]) => <View key={title} className="flex-row items-center gap-3"><View style={{ backgroundColor: color }} className="h-3 w-3 rounded-full" /><View className="min-w-0 flex-1 gap-0.5"><AppText weight="semibold" style={{ fontSize: 11 }}>{title}</AppText><AppText className="text-gray-500" style={{ fontSize: 8 }}>{description}</AppText></View></View>)}</Section>
      <Section title="Сброс данных" danger><AppText className="text-gray-500" style={{ fontSize: 9 }}>Удаляет выполнение задач и XP. План и награды сохранятся.</AppText><Pressable onPress={() => setResetOpen(true)} className="min-h-11 items-center justify-center rounded-xl bg-red-600"><AppText weight="bold" style={{ fontSize: 11 }}>Сбросить прогресс</AppText></Pressable></Section>
      {message ? <AppText className="text-center text-blue-300" style={{ fontSize: 9 }}>{message}</AppText> : null}
    </ScrollView>
    <AuthSheet open={authOpen} onClose={() => setAuthOpen(false)} />
    <Modal visible={resetOpen} transparent animationType="fade" onRequestClose={() => setResetOpen(false)}><View style={styles.overlay}><View className="mx-5 gap-4 rounded-3xl border border-red-500/40 bg-[#0a0a0a] p-5"><AppText weight="bold" style={{ fontSize: 17 }}>Сбросить прогресс?</AppText><AppText className="text-gray-400" style={{ fontSize: 10 }}>История выполнения задач и XP будут удалены. Это действие нельзя отменить.</AppText><Pressable onPress={() => { resetProgress(); setResetOpen(false); setMessage("Прогресс сброшен."); }} className="min-h-12 items-center justify-center rounded-xl bg-red-600"><AppText weight="bold" style={{ fontSize: 11 }}>Подтвердить сброс</AppText></Pressable><Pressable onPress={() => setResetOpen(false)} className="min-h-11 items-center justify-center rounded-xl border border-slate-700"><AppText style={{ fontSize: 11 }}>Отмена</AppText></Pressable></View></View></Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ input: { minHeight: 44, borderWidth: 1, borderColor: "#334155", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: "#ffffff", backgroundColor: "#09090b", fontFamily: theme.fonts.regular, fontSize: 11 }, overlay: { flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.88)" } });
