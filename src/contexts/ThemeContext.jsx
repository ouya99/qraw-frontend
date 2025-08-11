import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { darkTheme } from '../Theme';

export const ThemeContextProvider = ({ children }) => (
  <ThemeProvider theme={darkTheme}>
    <CssBaseline />
    {children}
  </ThemeProvider>
);
