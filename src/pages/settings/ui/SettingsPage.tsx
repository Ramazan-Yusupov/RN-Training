import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "@/shared/ui";

const statuses = [
  ["#3b82f6", "Текущий день", "День, который идёт сейчас"],
  ["#22c55e", "Выполнен", "Все обязательные задачи завершены"],
  ["#eab308", "Частично", "Выполнена часть обязательных задач"],
  ["#ef4444", "Пропущен", "Прошедший день без полного выполнения"],
  ["#475569", "Будущий", "День ещё не наступил"],
] as const;

export function SettingsPage() {
  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0a]" edges={["top"]}>
      <ScrollView contentContainerStyle={{ gap: 20, padding: 16, paddingBottom: 32 }}>
        <View className="gap-1"><AppText weight="bold" style={{ fontSize: 24 }}>Настройки</AppText><AppText className="text-gray-400" style={{ fontSize: 12 }}>Параметры мобильного Планера</AppText></View>
        <View className="gap-4 rounded-2xl border border-slate-800 p-4">
          <AppText className="text-blue-400" weight="bold" style={{ fontSize: 14 }}>Статусы календаря</AppText>
          {statuses.map(([color, title, description]) => (
            <View key={title} className="flex-row items-center gap-3">
              <View style={{ backgroundColor: color }} className="h-3 w-3 rounded-full" />
              <View className="min-w-0 flex-1 gap-0.5"><AppText weight="semibold" style={{ fontSize: 12 }}>{title}</AppText><AppText className="text-gray-500" style={{ fontSize: 9 }}>{description}</AppText></View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
