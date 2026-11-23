import { useEffect } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

export function ProgressBar({ value, max = 100, color = "blue" }: { value: number; max?: number; color?: "blue" | "green" }) {
  const progress = Math.min(1, Math.max(0, value / Math.max(1, max)));
  const animatedProgress = useSharedValue(0);
  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 450 });
  }, [animatedProgress, progress]);
  const animatedStyle = useAnimatedStyle(() => ({ width: `${animatedProgress.value * 100}%` }));
  return (
    <View className="h-2 overflow-hidden rounded-full bg-slate-800">
      <Animated.View className={color === "green" ? "h-full rounded-full bg-green-500" : "h-full rounded-full bg-blue-500"} style={animatedStyle} />
    </View>
  );
}
