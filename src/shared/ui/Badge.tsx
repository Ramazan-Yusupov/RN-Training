import { View } from "react-native";

import { AppText } from "./AppText";

export function Badge({ text, tone = "neutral" }: { text: string; tone?: "neutral" | "blue" | "green" }) {
  const tones = {
    neutral: "border-white/10 bg-white/5 text-gray-200",
    blue: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    green: "border-green-500/30 bg-green-500/10 text-green-400",
  } as const;

  return (
    <View className={`self-start rounded-full border px-2.5 py-1 ${tones[tone]}`}>
      <AppText className={tone === "blue" ? "text-blue-400" : tone === "green" ? "text-green-400" : "text-gray-200"} weight="medium" style={{ fontSize: 11 }}>
        {text}
      </AppText>
    </View>
  );
}
