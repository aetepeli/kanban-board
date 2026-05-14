// src/theme/useThemeColors.ts
import { useColorMode } from "../components/ui/color-mode";

export const useThemeColors = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === "dark";

  return {
    isDark,
    toggleTheme: toggleColorMode,

    mainBg: isDark ? "#0c0e11" : "#f8f9fa",
    textMain: isDark ? "white" : "#1a202c",
    textMuted: isDark ? "#a5abb6" : "#718096",

    borderCol: isDark ? "#42485120" : "#e2e8f0",
    inputBg: isDark ? "#1b2027" : "#f1f5f9",
    iconBoxBg: isDark ? "#0c0e11" : "#edf2f7",

    cardBg: isDark ? "#161a1f" : "#ffffff",
    cardHoverBg: isDark ? "#1b2027" : "#f8f9fa",
    emptyStateBg: isDark ? "#161a1f" : "#f1f5f9",

    colBg: isDark ? "#161a1f" : "#f1f5f9",
    taskBg: isDark ? "#1b2027" : "#ffffff",
    taskHover: isDark ? "#20262e" : "#f8f9fa",

    commentBg: isDark ? "#111418" : "#f8f9fa",
    avatarBg: isDark ? "#394763" : "#cbd5e1",
    avatarCol: isDark ? "white" : "#1a202c",

    modalOverlay: isDark ? "blackAlpha.800" : "blackAlpha.600",
  };
};
