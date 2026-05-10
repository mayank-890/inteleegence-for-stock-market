import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#F4B942"
    },
    secondary: {
      main: "#3AAED8"
    },
    background: {
      default: "#0A1628",
      paper: "#101D33"
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#B6C2D9"
    }
  },
  shape: {
    borderRadius: 8
  },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    h1: {
      fontWeight: 700
    },
    h2: {
      fontWeight: 700
    },
    h3: {
      fontWeight: 700
    },
    h4: {
      fontWeight: 700
    },
    h5: {
      fontWeight: 700
    },
    h6: {
      fontWeight: 700
    }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(244, 185, 66, 0.10)"
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none"
        }
      }
    }
  }
});

export default theme;

