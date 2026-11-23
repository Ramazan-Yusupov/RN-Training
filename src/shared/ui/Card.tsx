import type { ReactNode } from "react";
import { View } from "react-native";

import { Badge } from "./Badge";

export function Card({ title, headerRight, children }: { title?: string; headerRight?: ReactNode; children: ReactNode }) {
  return (
    <View className="gap-4 rounded-2xl border border-slate-800 bg-[#0a0a0a] p-4">
      {title || headerRight ? (
        <View className="flex-row items-center justify-between gap-3">
          {title ? <Badge text={title} /> : <View />}
          {headerRight}
        </View>
      ) : null}
      {children}
    </View>
  );
}
