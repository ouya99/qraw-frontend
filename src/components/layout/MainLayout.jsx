// src/components/layout/MainLayout.js
import { Box } from '@mui/material';
import React from 'react';

import Footer from './Footer';
import Header from './Header';

export default function MainLayout({ children }) {
  return (
    <>
      <Header />
      <Box component="main">{children}</Box>
      <Footer />
    </>
  );
}
