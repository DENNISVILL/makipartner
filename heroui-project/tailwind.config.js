import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [
    heroui({
      layout: {
        dividerWeight: "1px", 
        disabledOpacity: 0.45, 
        fontSize: {
          tiny: "0.75rem",
          small: "0.875rem",
          medium: "0.9375rem",
          large: "1.125rem",
        },
        lineHeight: {
          tiny: "1rem", 
          small: "1.25rem", 
          medium: "1.5rem", 
          large: "1.75rem", 
        },
        radius: {
          small: "4px", 
          medium: "6px", 
          large: "8px", 
        },
        borderWidth: {
          small: "1px", 
          medium: "1px", 
          large: "2px", 
        },
      },
      themes: {
        light: {
          colors: {
            background: {
              DEFAULT: "#FFFFFF"
            },
            content1: {
              DEFAULT: "#FFFFFF",
              foreground: "#212529"
            },
            content2: {
              DEFAULT: "#f8f9fa",
              foreground: "#212529"
            },
            content3: {
              DEFAULT: "#e9ecef",
              foreground: "#212529"
            },
            content4: {
              DEFAULT: "#dee2e6",
              foreground: "#212529"
            },
            divider: {
              DEFAULT: "rgba(0, 0, 0, 0.1)"
            },
            focus: {
              DEFAULT: "#714B67"
            },
            foreground: {
              50: "#f8f9fa",
              100: "#e9ecef",
              200: "#dee2e6",
              300: "#ced4da",
              400: "#adb5bd",
              500: "#6c757d",
              600: "#495057",
              700: "#343a40",
              800: "#212529",
              900: "#121416",
              DEFAULT: "#212529"
            },
            overlay: {
              DEFAULT: "#000000"
            },
            primary: {
              50: "#f5f0f3",
              100: "#e6d9e1",
              200: "#d2bac9",
              300: "#b995ab",
              400: "#9c6d8a",
              500: "#714B67",
              600: "#5a3c52",
              700: "#442d3e",
              800: "#2d1e29",
              900: "#170f15",
              DEFAULT: "#714B67",
              foreground: "#ffffff"
            },
            default: {
              50: "#f8f9fa",
              100: "#e9ecef",
              200: "#dee2e6",
              300: "#ced4da",
              400: "#adb5bd",
              500: "#6c757d",
              600: "#495057",
              700: "#343a40",
              800: "#212529",
              900: "#121416",
              DEFAULT: "#ced4da",
              foreground: "#212529"
            },
            secondary: {
              50: "#f2f2f2",
              100: "#d9d9d9",
              200: "#bfbfbf",
              300: "#a6a6a6",
              400: "#8c8c8c",
              500: "#737373",
              600: "#595959",
              700: "#404040",
              800: "#262626",
              900: "#0d0d0d",
              DEFAULT: "#737373",
              foreground: "#ffffff"
            },
            success: {
              50: "#ecf8f0",
              100: "#d0ecd9",
              200: "#a2d9b3",
              300: "#74c68d",
              400: "#46b367",
              500: "#28a745",
              600: "#208537",
              700: "#186429",
              800: "#10421c",
              900: "#08210e",
              DEFAULT: "#28a745",
              foreground: "#ffffff"
            },
            warning: {
              50: "#fff9e6",
              100: "#ffefc0",
              200: "#ffe083",
              300: "#ffd147",
              400: "#ffc20a",
              500: "#ffc107",
              600: "#cc9a06",
              700: "#997404",
              800: "#664d03",
              900: "#332701",
              DEFAULT: "#ffc107",
              foreground: "#212529"
            },
            danger: {
              50: "#fcecee",
              100: "#f5ccd1",
              200: "#eb9aa4",
              300: "#e26877",
              400: "#d8364a",
              500: "#dc3545",
              600: "#b02a37",
              700: "#842029",
              800: "#58151c",
              900: "#2c0b0e",
              DEFAULT: "#dc3545",
              foreground: "#ffffff"
            }
          }
        },
        dark: {
          colors: {
            background: {
              DEFAULT: "#1e2124"
            },
            content1: {
              DEFAULT: "#282b30",
              foreground: "#e9ecef"
            },
            content2: {
              DEFAULT: "#36393e",
              foreground: "#e9ecef"
            },
            content3: {
              DEFAULT: "#424549",
              foreground: "#e9ecef"
            },
            content4: {
              DEFAULT: "#5c5f63",
              foreground: "#e9ecef"
            },
            divider: {
              DEFAULT: "rgba(255, 255, 255, 0.1)"
            },
            focus: {
              DEFAULT: "#9b6b8d"
            },
            foreground: {
              50: "#121416",
              100: "#212529",
              200: "#343a40",
              300: "#495057",
              400: "#6c757d",
              500: "#adb5bd",
              600: "#ced4da",
              700: "#dee2e6",
              800: "#e9ecef",
              900: "#f8f9fa",
              DEFAULT: "#e9ecef"
            },
            overlay: {
              DEFAULT: "#000000"
            },
            primary: {
              50: "#170f15",
              100: "#2d1e29",
              200: "#442d3e",
              300: "#5a3c52",
              400: "#714B67",
              500: "#9b6b8d",
              600: "#b995ab",
              700: "#d2bac9",
              800: "#e6d9e1",
              900: "#f5f0f3",
              DEFAULT: "#9b6b8d",
              foreground: "#ffffff"
            },
            default: {
              50: "#121416",
              100: "#212529",
              200: "#343a40",
              300: "#495057",
              400: "#6c757d",
              500: "#adb5bd",
              600: "#ced4da",
              700: "#dee2e6",
              800: "#e9ecef",
              900: "#f8f9fa",
              DEFAULT: "#495057",
              foreground: "#ffffff"
            },
            secondary: {
              50: "#0d0d0d",
              100: "#262626",
              200: "#404040",
              300: "#595959",
              400: "#737373",
              500: "#8c8c8c",
              600: "#a6a6a6",
              700: "#bfbfbf",
              800: "#d9d9d9",
              900: "#f2f2f2",
              DEFAULT: "#8c8c8c",
              foreground: "#ffffff"
            },
            success: {
              50: "#08210e",
              100: "#10421c",
              200: "#186429",
              300: "#208537",
              400: "#28a745",
              500: "#46b367",
              600: "#74c68d",
              700: "#a2d9b3",
              800: "#d0ecd9",
              900: "#ecf8f0",
              DEFAULT: "#46b367",
              foreground: "#ffffff"
            },
            warning: {
              50: "#332701",
              100: "#664d03",
              200: "#997404",
              300: "#cc9a06",
              400: "#ffc107",
              500: "#ffc20a",
              600: "#ffd147",
              700: "#ffe083",
              800: "#ffefc0",
              900: "#fff9e6",
              DEFAULT: "#ffc20a",
              foreground: "#212529"
            },
            danger: {
              50: "#2c0b0e",
              100: "#58151c",
              200: "#842029",
              300: "#b02a37",
              400: "#dc3545",
              500: "#d8364a",
              600: "#e26877",
              700: "#eb9aa4",
              800: "#f5ccd1",
              900: "#fcecee",
              DEFAULT: "#d8364a",
              foreground: "#ffffff"
            }
          }
        }
      }
    })
  ]
}
