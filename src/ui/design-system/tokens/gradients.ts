export const GRADIENTS = {
    primary: "from-purple-500 via-pink-500 to-rose-500",
    primaryDouble: "from-purple-500 to-pink-500", // Used for smaller elements like icons
    primaryTriple: "from-purple-500 via-purple-600 to-pink-500", // Used in OvertimePanel
    accent: "from-teal-500 to-cyan-500", // Teal
    secondary: "from-pink-500 to-rose-500", // Pink/Rose
    warning: "from-amber-400 to-orange-400", // Yellow/Amber
    primaryButton: "from-purple-600 to-pink-600",
    primaryButtonHover: "from-purple-700 to-pink-700",
    primaryLight: "from-purple-50 to-pink-50",
    secondaryLight: "from-pink-50 to-rose-50",
    accentLight: "from-teal-50 to-cyan-50",
    infoLight: "from-blue-50 to-indigo-50",
    accentButton: "from-teal-600 to-cyan-600",
    accentButtonHover: "from-teal-700 to-cyan-700",
    success: "from-emerald-500 to-teal-500",
    info: "from-blue-500 to-indigo-500",
} as const;

export const SHADOWS = {
    primary: "shadow-purple-200",
    accent: "shadow-teal-200",
    secondary: "shadow-pink-200",
    warning: "shadow-amber-200",
    success: "shadow-emerald-200",
    info: "shadow-blue-200",
} as const;
