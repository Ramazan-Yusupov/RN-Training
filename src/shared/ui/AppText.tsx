import type { ComponentProps } from "react";
import { Text } from "react-native";

import { theme } from "@/shared/config/theme";
import { useAppFontLoaded } from "@/shared/lib/fonts";

type AppTextProps = ComponentProps<typeof Text> & {
  weight?: keyof typeof theme.fonts;
};

export function AppText({ style, weight = "regular", ...props }: AppTextProps) {
  const fontLoaded = useAppFontLoaded();

  return (
    <Text
      {...props}
      style={[
        { color: theme.colors.text },
        fontLoaded ? { fontFamily: theme.fonts[weight] } : undefined,
        style,
      ]}
    />
  );
}
