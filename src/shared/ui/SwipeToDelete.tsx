import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, type SharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Trash2 } from "lucide-react-native";

import { AppText } from "./AppText";

export function SwipeToDelete({ children, onDelete, enabled = true }: { children: ReactNode; onDelete: () => void; enabled?: boolean | SharedValue<boolean> }) {
  const swipeableRef = useRef<SwipeableMethods>(null);
  const localEnabled = useSharedValue(typeof enabled === "boolean" ? enabled : true);
  const enabledValue = typeof enabled === "boolean" ? localEnabled : enabled;

  useEffect(() => {
    if (typeof enabled === "boolean") localEnabled.value = enabled;
  }, [enabled, localEnabled]);

  const closeSwipe = useCallback(() => swipeableRef.current?.close(), []);
  useAnimatedReaction(
    () => enabledValue.value,
    (current, previous) => {
      if (!current && previous !== false) scheduleOnRN(closeSwipe);
    },
    [closeSwipe],
  );

  const deleteActionStyle = useAnimatedStyle(() => ({
    opacity: enabledValue.value ? 1 : 0,
  }));

  useEffect(() => {
    if (typeof enabled === "boolean" && !enabled) swipeableRef.current?.close();
  }, [enabled]);

  return (
    <Swipeable
      ref={swipeableRef}
      enabled={enabled}
      friction={2}
      rightThreshold={44}
      overshootRight={false}
      containerStyle={{ borderRadius: 16, overflow: "hidden" }}
      renderRightActions={() => (
        <Animated.View style={deleteActionStyle}>
          <Pressable onPress={onDelete} accessibilityRole="button" accessibilityLabel="Удалить" className="h-full w-24 items-center justify-center gap-1 bg-red-600">
            <Trash2 color="#fff" size={21} /><AppText weight="bold" style={{ fontSize: 10 }}>Удалить</AppText>
          </Pressable>
        </Animated.View>
      )}
    >
      <View className="bg-[#0a0a0a]">{children}</View>
    </Swipeable>
  );
}
