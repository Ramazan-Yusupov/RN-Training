import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "@/shared/config/supabase";
import { AppText } from "@/shared/ui";

export default function AuthCallbackRoute() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [message, setMessage] = useState(() =>
    supabase && code
      ? "Подтверждаем аккаунт…"
      : "Ссылка подтверждения недействительна.",
  );
  useEffect(() => {
    if (!supabase || !code) return;
    void supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) { setMessage("Не удалось подтвердить аккаунт."); return; }
      router.replace("/(tabs)/settings");
    });
  }, [code]);
  return <SafeAreaView className="flex-1 bg-[#0a0a0a]" edges={["top"]}><View className="flex-1 items-center justify-center p-6"><AppText className="text-center text-gray-300" style={{ fontSize: 13 }}>{message}</AppText></View></SafeAreaView>;
}
