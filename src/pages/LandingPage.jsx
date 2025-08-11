import React from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  alpha,
  Stack,
  Button,
  useTheme,
  Grid,
} from "@mui/material";
import ConnectLink from "../components/qubic/connect/ConnectLink";
import GroupIcon from "@mui/icons-material/Group";
import GavelIcon from "@mui/icons-material/Gavel";
import SecurityIcon from "@mui/icons-material/Security";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import logoLight from "../assets/logo/qubic_draw_logo_large_text.svg";
import logoDark from "../assets/logo/qubic_draw_logo_large_text.svg";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ElectricCircuit from "../components/layout/BackgroundCircuit";

const features = [
  {
    icon: <SecurityIcon sx={{ fontSize: 48 }} />,
    label: "Secure",
    description:
      "All bets are cryptographically secured with zero tampering risk.",
    badge: "SECURE",
  },
  {
    icon: <GroupIcon sx={{ fontSize: 48 }} />,
    label: "Auditable",
    description:
      "Complete transparency with on-chain verification for all participants.",
    badge: "ON-CHAIN",
  },
  {
    icon: <GavelIcon sx={{ fontSize: 48 }} />,
    label: "Zero Fees",
    description:
      "No hidden costs. 100% of the prize pool goes directly to winners.",
    badge: "ZERO FEES",
  },
];

export default function LandingPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background:
          theme.palette.mode === "dark"
            ? `linear-gradient(135deg, ${
                theme.palette.background.default
              } 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`
            : `linear-gradient(135deg, ${
                theme.palette.background.default
              } 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 20,
          right: 30,
          zIndex: 10,
        }}
      >
        <ConnectLink />
      </Box>
      <ElectricCircuit />
      <Container maxWidth='lg' sx={{ py: 8, position: "relative", zIndex: 1 }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Box
            component='img'
            src={theme.palette.mode === "dark" ? logoDark : logoLight}
            alt='Qubic Draw Logo'
            sx={{
              width: { xs: "90%", sm: "60%", md: "44%" },
              maxWidth: 600,
              mb: 10,
              mx: "auto",
              display: "block",
              filter:
                theme.palette.mode === "dark" ? "none" : "brightness(0.9)",
            }}
          />
          <Typography
            variant='h4'
            component='h1'
            sx={{
              mb: 3,
              fontWeight: 700,
              color: theme.palette.text.primary,
              fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
            }}
          >
            One draw every hour.{" "}
            <Box
              component='span'
              sx={{
                color: "#fff23eff",
                fontWeight: 700,
              }}
            >
              100% to the winner.
            </Box>
          </Typography>

          <Typography
            variant='h6'
            sx={{
              color: theme.palette.text.secondary,
              maxWidth: 600,
              mx: "auto",
              fontSize: { xs: "1rem", sm: "1.7rem" },
              lineHeight: 1.6,
            }}
          >
            Enter. Win. All on-chain, all verifiable.
          </Typography>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={3}
            justifyContent='center'
            alignItems='center'
            mt={6}
            mb={12}
          >
            <Button
              size='large'
              variant='outlined'
              color='secondary'
              startIcon={<GroupIcon />}
              sx={{
                fontWeight: 600,
                fontFamily: "monospace",
                fontSize: "1rem",
                px: 5,
                py: 1.5,
                borderRadius: 0,
                letterSpacing: ".06em",
                borderWidth: 2,
                "&:hover": {
                  transform: "translateY(-1px)",
                },
              }}
              onClick={() => navigate("/")}
            >
              Enter draw
            </Button>
            <Button
              size='large'
              variant='contained'
              color='primary'
              startIcon={<RocketLaunchIcon />}
              sx={{
                fontWeight: 600,
                fontFamily: "monospace",
                fontSize: "1rem",
                px: 5,
                py: 1.5,
                borderRadius: 0,
                letterSpacing: ".06em",
                borderWidth: 2,
              }}
            >
              Get ticket
            </Button>
          </Stack>
        </Box>
        <Grid
          container
          spacing={{ xs: 3, md: 4 }}
          justifyContent='center'
          sx={{ mb: 8 }}
        >
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={feature.label}>
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.6,
                  delay: 0.08 * index,
                  type: "spring",
                }}
                viewport={{ once: true }}
                style={{ height: "100%" }}
              >
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    borderRadius: 1,
                    overflow: "visible",
                    mt: 4,
                    background:
                      theme.palette.mode === "dark"
                        ? `linear-gradient(120deg, ${alpha(
                            "#272d38",
                            0.94
                          )}, ${alpha(theme.palette.primary.main, 0.08)})`
                        : `linear-gradient(120deg, #fff, ${alpha(
                            theme.palette.primary.main,
                            0.04
                          )})`,
                    border: `1.5px solid ${alpha(
                      theme.palette.primary.main,
                      0.13
                    )}`,
                    // boxShadow:
                    //   theme.palette.mode === "dark"
                    //     ? `0 2px 24px 0 ${alpha(
                    //         theme.palette.primary.main,
                    //         0.1
                    //       )}, 0 0 0 1px ${alpha(
                    //         theme.palette.primary.main,
                    //         0.05
                    //       )}`
                    //     : `0 2px 24px 0 ${alpha(
                    //         theme.palette.primary.main,
                    //         0.08
                    //       )}`,
                    // backdropFilter: "blur(8px)",
                    // WebkitBackdropFilter: "blur(8px)",
                    position: "relative",
                    transition: "all 0.34s cubic-bezier(.56,.02,.25,1)",
                  }}
                >
                  <CardContent
                    sx={{
                      textAlign: "center",
                      p: { xs: 3, sm: 4 },
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Box
                      sx={{
                        mb: 2.5,
                        color: theme.palette.primary.main,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 100,
                        height: 100,
                        borderRadius: "50%",
                        border: `2px solid ${theme.palette.primary.main}`,
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography
                      variant='h6'
                      component='h3'
                      sx={{
                        fontWeight: 1000,
                        mb: 1.5,
                        letterSpacing: ".015em",
                        fontSize: "1.23rem",
                        color: theme.palette.text.primary,
                        textTransform: "uppercase",
                        fontFamily: "monospace",
                      }}
                    >
                      {feature.label}
                    </Typography>
                    <Typography
                      variant='body2'
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.7,
                        fontSize: "1.07rem",
                        textAlign: "center",
                        minHeight: "60px",
                        letterSpacing: ".005em",
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
