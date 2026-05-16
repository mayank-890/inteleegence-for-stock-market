import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#7C3AED" },
    secondary: { main: "#A855F7" },
    background: { default: "#05010F", paper: "rgba(255,255,255,0.04)" },
    text: { primary: "#F8FAFC", secondary: "#94A3B8" },
    success: { main: "#10B981" },
    error: { main: "#EF4444" },
  },
  typography: {
    fontFamily: "Inter, sans-serif",
    h1: { fontWeight: 800, letterSpacing: "-0.03em" },
    h2: { fontWeight: 800, letterSpacing: "-0.02em" },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#05010F",
          color: "#F8FAFC",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(124,58,237,0.2)",
          borderRadius: 16,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 8,
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #7C3AED, #A855F7)",
          boxShadow: "0 0 30px rgba(124,58,237,0.3)",
          "&:hover": {
            background: "linear-gradient(135deg, #6D28D9, #9333EA)",
            boxShadow: "0 0 40px rgba(124,58,237,0.5)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            background: "rgba(255,255,255,0.04)",
            borderRadius: 8,
            "& fieldset": { borderColor: "rgba(124,58,237,0.2)" },
            "&:hover fieldset": { borderColor: "rgba(168,85,247,0.4)" },
            "&.Mui-focused fieldset": {
              borderColor: "#7C3AED",
              boxShadow: "0 0 0 3px rgba(124,58,237,0.1)",
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: "rgba(11,6,24,0.95)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(124,58,237,0.2)",
          borderRadius: 16,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
        },
      },
    },
  },
});

export default theme;
