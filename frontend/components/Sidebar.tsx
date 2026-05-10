"use client";

import {
  Box,
  Chip,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";

import { CompanyListItem } from "@/lib/api";

type SidebarProps = {
  companies: CompanyListItem[];
  selectedSymbol?: string;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (symbol: string) => void;
};

export default function Sidebar({
  companies,
  selectedSymbol,
  search,
  onSearchChange,
  onSelect
}: SidebarProps) {
  return (
    <Paper
      sx={{
        width: { xs: "100%", md: 320 },
        minHeight: { xs: "auto", md: "calc(100vh - 32px)" },
        p: 2,
        position: { md: "sticky" },
        top: 16
      }}
    >
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6">Company Explorer</Typography>
          <Typography variant="body2" color="text.secondary">
            Scan the Nifty 100 universe and jump straight into a company workspace.
          </Typography>
        </Box>

        <TextField
          fullWidth
          label="Search companies"
          placeholder="Reliance, TCS, INFY..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />

        <Chip
          label={`${companies.length} companies`}
          color="primary"
          variant="outlined"
          sx={{ width: "fit-content" }}
        />

        <Divider />

        <List sx={{ maxHeight: { xs: 280, md: "70vh" }, overflowY: "auto", p: 0 }}>
          {companies.map((company) => (
            <ListItemButton
              key={company.company_id}
              selected={selectedSymbol === company.ticker_symbol}
              onClick={() => onSelect(company.ticker_symbol)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                alignItems: "flex-start"
              }}
            >
              <ListItemText
                primary={company.company_name}
                secondary={`${company.ticker_symbol} • ${company.sector_name}`}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItemButton>
          ))}
        </List>
      </Stack>
    </Paper>
  );
}

