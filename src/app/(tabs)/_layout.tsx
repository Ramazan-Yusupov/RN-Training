import { Tabs } from "expo-router";
import { ChartNoAxesCombined, ListChecks, Settings } from "lucide-react-native";

import { theme } from "@/shared/config/theme";
import { useAppFontLoaded } from "@/shared/lib/fonts";

export default function TabsLayout() {
  const fontLoaded = useAppFontLoaded();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.background },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          ...(fontLoaded ? { fontFamily: theme.fonts.medium } : {}),
          fontSize: 11,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.navigation,
          borderTopColor: theme.colors.borderSoft,
          height: 66,
          paddingTop: 6,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Сегодня",
          tabBarIcon: ({ color }) => <ListChecks color={color} size={21} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Прогресс",
          tabBarIcon: ({ color }) => (
            <ChartNoAxesCombined color={color} size={21} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Настройки",
          tabBarIcon: ({ color }) => <Settings color={color} size={21} strokeWidth={2.2} />,
        }}
      />
    </Tabs>
  );
}
