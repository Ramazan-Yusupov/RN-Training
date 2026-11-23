import { SafeAreaView } from "react-native-safe-area-context";
import { View } from "react-native";

import { AppText, Card } from "@/shared/ui";

export function ComingSoonPage({ title, description }: { title: string; description: string }) {
  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0a]" edges={["top"]}>
      <View className="flex-1 gap-6 p-4 pt-6">
        <View className="gap-1">
          <AppText weight="bold" style={{ fontSize: 24 }}>{title}</AppText>
          <AppText className="text-gray-400" style={{ fontSize: 13 }}>Раздел мобильного Planer</AppText>
        </View>
        <Card title="В разработке">
          <AppText className="text-gray-300" style={{ fontSize: 14, lineHeight: 22 }}>{description}</AppText>
        </Card>
      </View>
    </SafeAreaView>
  );
}
