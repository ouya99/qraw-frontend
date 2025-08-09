// src/components/layout/MainLayout.js
import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import { Box } from "@mui/material";

export default function MainLayout({ children }) {
  return (
    <>
      <Header />
      <Box component="main">{children}</Box>
      <Footer />
    </>
  );
}