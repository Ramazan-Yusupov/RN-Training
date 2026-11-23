import { useState } from "react";
import NativeTimePicker from "@expo/ui/community/datetime-picker";
import { BarChart3, Clock3, Coffee, FileText, FolderPlus, ListPlus, Plus, SkipForward, X } from "lucide-react-native";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";

import type { EditScope, PlanGroup, PlanTask, PlanWidgetType } from "@/entities/plan";
import { usePlanStore } from "@/entities/plan";
import { theme } from "@/shared/config/theme";
import { AppText } from "@/shared/ui";

type SheetScreen = "menu" | "group" | "task";

type AddContentSheetProps = {
  day: number;
  groups: PlanGroup[];
  initialGroupId?: string | null;
  open: boolean;
  onClose: () => void;
  editingTask?: PlanTask | null;
  editingGroup?: PlanGroup | null;
};

function ScopeSelector({ value, onChange }: { value: EditScope; onChange: (scope: EditScope) => void }) {
  return (
    <View className="gap-2">
      <AppText className="text-gray-400" style={{ fontSize: 11 }}>Где добавить</AppText>
      <View className="flex-row gap-2">
        {([
          ["day", "Только этот день"],
          ["all", "Во все дни"],
        ] as const).map(([scope, label]) => (
          <Pressable
            key={scope}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === scope }}
            onPress={() => onChange(scope)}
            className={value === scope ? "min-h-11 flex-1 items-center justify-center rounded-xl border-2 border-blue-500 bg-blue-500/10 px-2" : "min-h-11 flex-1 items-center justify-center rounded-xl border border-white/10 px-2"}
          >
            <AppText className={value === scope ? "text-blue-300" : "text-gray-400"} weight="medium" style={{ fontSize: 10 }}>
              {label}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType = "default" }: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "number-pad";
}) {
  return (
    <View className="gap-2">
      <AppText className="text-gray-400" style={{ fontSize: 11 }}>{label}</AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6b7280"
        keyboardType={keyboardType}
        underlineColorAndroid="transparent"
        style={{
          minHeight: 48,
          borderWidth: 1,
          borderColor: "#334155",
          borderRadius: 12,
          paddingHorizontal: 14,
          color: "#ffffff",
          backgroundColor: "#0a0a0a",
          fontFamily: theme.fonts.regular,
          fontSize: 13,
        }}
      />
    </View>
  );
}

export function AddContentSheet({ day, groups, initialGroupId, open, onClose, editingTask, editingGroup }: AddContentSheetProps) {
  const addGroup = usePlanStore((state) => state.addGroup);
  const addTask = usePlanStore((state) => state.addTask);
  const addWidget = usePlanStore((state) => state.addWidget);
  const updateTask = usePlanStore((state) => state.updateTask);
  const updateGroup = usePlanStore((state) => state.updateGroup);
  const [screen, setScreen] = useState<SheetScreen>(
    editingGroup ? "group" : editingTask || initialGroupId !== undefined ? "task" : "menu",
  );
  const [scope, setScope] = useState<EditScope>("day");
  const [title, setTitle] = useState(editingTask?.title ?? editingGroup?.title ?? "");
  const [groupId, setGroupId] = useState<string | null>(editingTask?.groupId ?? initialGroupId ?? null);
  const [time, setTime] = useState(editingTask?.scheduledTime ?? "");
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [duration, setDuration] = useState(String(editingTask?.durationMin ?? 5));
  const [xp, setXp] = useState(String(editingTask?.xp ?? 5));
  const [required, setRequired] = useState(editingTask?.required ?? true);
  const [error, setError] = useState("");

  const pickerTime = (() => {
    const [hours = 9, minutes = 0] = time.split(":").map(Number);
    const value = new Date();
    value.setHours(hours, minutes, 0, 0);
    return value;
  })();

  const chooseTime = (date: Date) => {
    setTime(
      `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
    );
    if (Platform.OS === "android") setTimePickerOpen(false);
  };

  const close = () => {
    setError("");
    onClose();
  };

  const submitGroup = () => {
    if (!title.trim()) {
      setError("Укажи название группы");
      return;
    }
    if (editingGroup) updateGroup(day, editingGroup.id, title, scope);
    else addGroup(day, title, scope);
    close();
  };

  const submitTask = () => {
    const durationMin = Number(duration);
    const taskXp = Number(xp);
    if (!title.trim()) {
      setError("Укажи название задачи");
      return;
    }
    if (!Number.isSafeInteger(durationMin) || durationMin < 0) {
      setError("Длительность должна быть целым числом от 0");
      return;
    }
    if (!Number.isSafeInteger(taskXp) || taskXp < 0) {
      setError("XP должен быть целым числом от 0");
      return;
    }
    if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      setError("Время должно быть в формате 09:30");
      return;
    }
    const input = {
      title,
      groupId,
      durationMin,
      xp: taskXp,
      required,
      scheduledTime: time || undefined,
    };
    if (editingTask) {
      updateTask(day, editingTask.id, input, scope);
      close();
      return;
    }
    const created = addTask(day, groupId, input, scope);
    if (!created) {
      setError("Не удалось добавить задачу. Проверь лимит группы.");
      return;
    }
    close();
  };

  const submitWidget = (type: PlanWidgetType) => {
    addWidget(day, type, scope);
    close();
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Закрыть окно"
            style={styles.backdrop}
            onPress={close}
          />
          <View style={styles.sheet}>
            <View className="mb-3 h-1 w-10 self-center rounded-full bg-gray-600" />
            <View className="mb-4 flex-row items-center justify-between gap-3">
              <AppText weight="bold" style={{ fontSize: 18 }}>
                {screen === "menu" ? "Добавить" : screen === "group" ? editingGroup ? "Редактировать группу" : "Новая группа" : editingTask ? "Редактировать задачу" : "Новая задача"}
              </AppText>
              <Pressable accessibilityRole="button" accessibilityLabel="Закрыть" onPress={close} className="h-11 w-11 items-center justify-center rounded-xl border border-white/10">
                <X color="#ffffff" size={20} />
              </Pressable>
            </View>

            {screen === "menu" ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 8 }}>
                <Pressable onPress={() => setScreen("group")} className="min-h-16 flex-row items-center gap-3 rounded-2xl border border-slate-700 p-4">
                  <FolderPlus color="#60a5fa" size={23} />
                  <View className="min-w-0 flex-1 gap-1">
                    <AppText weight="semibold" style={{ fontSize: 14 }}>Группа задач</AppText>
                    <AppText className="text-gray-500" style={{ fontSize: 10 }}>Карточка с задачами, как «Утро»</AppText>
                  </View>
                </Pressable>
                <Pressable onPress={() => setScreen("task")} className="min-h-16 flex-row items-center gap-3 rounded-2xl border border-slate-700 p-4">
                  <ListPlus color="#22c55e" size={23} />
                  <View className="min-w-0 flex-1 gap-1">
                    <AppText weight="semibold" style={{ fontSize: 14 }}>Задача</AppText>
                    <AppText className="text-gray-500" style={{ fontSize: 10 }}>Отдельно или внутри выбранной группы</AppText>
                  </View>
                </Pressable>
                <AppText className="mt-1 text-gray-500" weight="semibold" style={{ fontSize: 10 }}>ВИДЖЕТЫ</AppText>
                {([
                  ["xp-by-days", "XP по дням", "График набранного опыта", BarChart3],
                  ["next-task", "Следующая задача", "Ближайшая незавершённая задача", SkipForward],
                  ["micro-breaks", "Микро-паузы", "Счётчик коротких перерывов", Coffee],
                  ["day-notes", "Заметки дня", "Мысли, планы и итоги", FileText],
                ] as const).map(([type, label, description, Icon]) => (
                  <Pressable key={type} onPress={() => submitWidget(type)} className="min-h-14 flex-row items-center gap-3 rounded-2xl border border-amber-600/70 p-3">
                    <Icon color="#60a5fa" size={21} />
                    <View className="min-w-0 flex-1 gap-0.5">
                      <AppText className="text-blue-300" weight="semibold" style={{ fontSize: 12 }}>{label}</AppText>
                      <AppText className="text-gray-500" style={{ fontSize: 9 }}>{description}</AppText>
                    </View>
                  </Pressable>
                ))}
                <ScopeSelector value={scope} onChange={setScope} />
              </ScrollView>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 8 }}>
                <Field label={screen === "group" ? "Название группы" : "Название задачи"} value={title} onChangeText={setTitle} placeholder={screen === "group" ? "Например: Учёба" : "Что нужно сделать?"} />

                {screen === "task" ? (
                  <>
                    <View className="gap-2">
                      <AppText className="text-gray-400" style={{ fontSize: 11 }}>Расположение</AppText>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        <Pressable onPress={() => setGroupId(null)} className={groupId === null ? "min-h-10 justify-center rounded-xl border-2 border-blue-500 bg-blue-500/10 px-3" : "min-h-10 justify-center rounded-xl border border-white/10 px-3"}>
                          <AppText style={{ fontSize: 10 }}>Отдельная задача</AppText>
                        </Pressable>
                        {groups.map((group) => (
                          <Pressable key={group.id} onPress={() => setGroupId(group.id)} className={groupId === group.id ? "min-h-10 justify-center rounded-xl border-2 border-blue-500 bg-blue-500/10 px-3" : "min-h-10 justify-center rounded-xl border border-white/10 px-3"}>
                            <AppText style={{ fontSize: 10 }}>{group.title}</AppText>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                    <View className="flex-row gap-3">
                      <View className="flex-1 gap-2">
                        <AppText className="text-gray-400" style={{ fontSize: 11 }}>Время</AppText>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={time ? `Изменить время, сейчас ${time}` : "Выбрать время"}
                          onPress={() => setTimePickerOpen(true)}
                          className="min-h-12 flex-row items-center justify-center gap-2 rounded-xl border border-slate-700 bg-[#0a0a0a] px-3"
                        >
                          <Clock3 color="#60a5fa" size={19} strokeWidth={2.2} />
                          <AppText className={time ? "text-white" : "text-gray-500"} weight="medium" style={{ fontSize: 12 }}>
                            {time || "Выбрать"}
                          </AppText>
                        </Pressable>
                      </View>
                      <View className="flex-1"><Field label="Минуты" value={duration} onChangeText={setDuration} keyboardType="number-pad" /></View>
                      <View className="flex-1"><Field label="XP" value={xp} onChangeText={setXp} keyboardType="number-pad" /></View>
                    </View>
                    {timePickerOpen ? (
                      <View className="gap-2 rounded-2xl border border-slate-700 bg-[#0a0a0a] p-2">
                        <NativeTimePicker
                          value={pickerTime}
                          mode="time"
                          presentation="dialog"
                          display={Platform.OS === "android" ? "clock" : "spinner"}
                          is24Hour
                          themeVariant="dark"
                          accentColor="#3b82f6"
                          positiveButton={{ label: "Готово" }}
                          negativeButton={{ label: "Отмена" }}
                          onValueChange={(_event, date) => chooseTime(date)}
                          onDismiss={() => setTimePickerOpen(false)}
                        />
                        {Platform.OS === "ios" ? (
                          <Pressable onPress={() => setTimePickerOpen(false)} className="min-h-10 items-center justify-center rounded-xl bg-blue-500">
                            <AppText weight="bold" style={{ fontSize: 12 }}>Готово</AppText>
                          </Pressable>
                        ) : null}
                      </View>
                    ) : null}
                    <View className="min-h-12 flex-row items-center justify-between gap-3 rounded-xl border border-white/10 px-3">
                      <AppText weight="medium" style={{ fontSize: 12 }}>Обязательная задача</AppText>
                      <Switch value={required} onValueChange={setRequired} trackColor={{ false: "#374151", true: "#2563eb" }} thumbColor="#ffffff" />
                    </View>
                  </>
                ) : null}

                <ScopeSelector value={scope} onChange={setScope} />
                {error ? <AppText className="text-red-400" style={{ fontSize: 11, textAlign: "center" }}>{error}</AppText> : null}
                <View className="flex-row gap-3">
                  <Pressable onPress={editingTask || editingGroup ? close : () => setScreen("menu")} className="min-h-12 flex-1 items-center justify-center rounded-xl border border-white/20">
                    <AppText weight="semibold" style={{ fontSize: 12 }}>{editingTask || editingGroup ? "Отмена" : "Назад"}</AppText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={screen === "group" ? "Добавить группу" : "Добавить задачу"}
                    onPress={screen === "group" ? submitGroup : submitTask}
                    className="h-12 w-14 items-center justify-center rounded-xl bg-blue-500"
                  >
                    <Plus color="#ffffff" size={24} strokeWidth={2.6} />
                  </Pressable>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardArea: {
    flex: 1,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  backdrop: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.86)",
  },
  sheet: {
    maxHeight: "88%",
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "#0a0a0a",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.8,
    shadowRadius: 28,
    elevation: 24,
  },
});
