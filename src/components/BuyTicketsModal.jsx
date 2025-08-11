import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
  IconButton,
  TextField,
  Slider,
  Chip,
  alpha,
  useTheme,
  Dialog,
  DialogContent,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

const DEFAULTS = {
  MAX_TICKETS: 1023,
  MIN_TICKETS: 1,
  PRICE_PER_TICKET: 1_000_000,
  TITLE: "Buy Tickets",
};

const formatQubic = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function BuyTicketsModal({
  variant = "dialog",
  title = DEFAULTS.TITLE,
  open = false,
  onClose,
  onConfirm,
  isProcessing = false,
  balanceQubic,
  defaultQuantity = 0, // <-- démarrage à 0
  pricePerTicket = DEFAULTS.PRICE_PER_TICKET,
  minTickets = DEFAULTS.MIN_TICKETS,
  maxTickets = DEFAULTS.MAX_TICKETS,
}) {
  const theme = useTheme();

  const clampUI = (n, max) => clamp(n, 0, max);

  const [qty, setQty] = useState(0);

  const maxAffordable = useMemo(() => {
    if (typeof balanceQubic !== "number") return maxTickets;
    const byWallet = Math.floor(balanceQubic / pricePerTicket);
    return clamp(byWallet, 0, maxTickets);
  }, [balanceQubic, pricePerTicket, maxTickets]);

  const effectiveMax = maxAffordable; // on borne toute l’UI là-dessus

  useEffect(() => {
    if (variant === "dialog" && open) {
      setQty(clampUI(defaultQuantity, effectiveMax));
    }
  }, [variant, open, defaultQuantity, effectiveMax]);

  // Si le solde/paramètres changent, on reclampe la quantité courante
  useEffect(() => {
    setQty((q) => clampUI(q, effectiveMax));
  }, [effectiveMax]);

  const total = useMemo(() => qty * pricePerTicket, [qty, pricePerTicket]);

  const insufficient =
    typeof balanceQubic === "number" ? total > balanceQubic : false;

  const meetsMinimum = qty >= minTickets;
  const canBuy =
    !isProcessing && meetsMinimum && qty <= effectiveMax && !insufficient;

  const handleInputChange = (e) => {
    const raw = `${e.target.value}`.replace(/\D/g, "");
    if (raw === "") {
      setQty(0);
      return;
    }
    const next = parseInt(raw, 10);
    setQty(clampUI(next, effectiveMax));
  };

  const inc = (step = 1) => setQty((q) => clampUI(q + step, effectiveMax));
  const dec = (step = 1) => setQty((q) => clampUI(q - step, effectiveMax));
  const setMax = () => setQty(effectiveMax);

  const handleConfirm = () => {
    if (!canBuy) return;
    onConfirm?.(qty);
    if (variant === "dialog") onClose?.();
  };

  const Header = (
    <Stack
      direction='row'
      alignItems='center'
      justifyContent='space-between'
      mb={3}
    >
      <Stack direction='row' alignItems='center' spacing={1.5}>
        <ConfirmationNumberOutlinedIcon
          sx={{ color: theme.palette.primary.main }}
        />
        <Typography
          variant='h6'
          sx={{
            fontFamily: "monospace",
            fontWeight: 900,
            letterSpacing: ".08em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </Typography>
      </Stack>

      <Stack direction='row' spacing={1}>
        <Chip
          label={`Price: ${formatQubic(pricePerTicket)} QUBIC / ticket`}
          sx={{
            fontFamily: "monospace",
            fontWeight: 700,
            borderRadius: 1,
            bgcolor:
              theme.palette.mode === "dark"
                ? alpha(theme.palette.primary.main, 0.12)
                : alpha(theme.palette.primary.main, 0.08),
            color: theme.palette.primary.main,
          }}
          variant='filled'
        />
        {typeof balanceQubic === "number" && (
          <Chip
            label={`Balance: ${formatQubic(balanceQubic)} QUBIC`}
            sx={{
              fontFamily: "monospace",
              fontWeight: 700,
              borderRadius: 1,
              bgcolor:
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.primary.main, 0.12)
                  : alpha(theme.palette.primary.main, 0.08),
              color: theme.palette.primary.main,
            }}
            variant='filled'
          />
        )}
      </Stack>
    </Stack>
  );

  const Body = (
    <Stack spacing={2.5}>
      <Stack direction='row' alignItems='center' spacing={1.5}>
        <IconButton
          aria-label='remove one'
          onClick={() => dec(1)}
          disabled={qty <= 0 || isProcessing}
          size='small'
        >
          <RemoveIcon />
        </IconButton>

        <TextField
          value={qty}
          onChange={handleInputChange}
          onBlur={() =>
            setQty((q) => clampUI(Number.isNaN(q) ? 0 : q, effectiveMax))
          }
          inputProps={{
            inputMode: "numeric",
            pattern: "[0-9]*",
            min: 0,
            max: effectiveMax,
            style: {
              textAlign: "center",
              fontFamily: "monospace",
              fontWeight: 700,
            },
            "aria-label": "Quantity",
          }}
          sx={{ width: 160 }}
          label='Quantity'
          helperText={
            !meetsMinimum && qty > 0
              ? `Minimum ${minTickets} tickets to buy`
              : " "
          }
          disabled={isProcessing}
        />

        <IconButton
          aria-label='add one'
          onClick={() => inc(1)}
          disabled={qty >= effectiveMax || isProcessing}
          size='small'
        >
          <AddIcon />
        </IconButton>

        <Stack direction='row' spacing={1} sx={{ ml: 1 }}>
          <Button
            variant='outlined'
            size='small'
            onClick={() => inc(10)}
            disabled={isProcessing || qty >= effectiveMax}
          >
            +10
          </Button>
          <Button
            variant='outlined'
            size='small'
            onClick={() => inc(100)}
            disabled={isProcessing || qty >= effectiveMax}
          >
            +100
          </Button>
          <Button
            variant='outlined'
            size='small'
            onClick={setMax}
            disabled={isProcessing || qty === effectiveMax}
          >
            Max
          </Button>
        </Stack>
      </Stack>

      <Slider
        value={qty}
        onChange={(_, v) => setQty(clampUI(Number(v), effectiveMax))}
        min={0}
        max={effectiveMax}
        step={1}
        valueLabelDisplay='auto'
        disabled={isProcessing}
        aria-label='Quantity slider'
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr auto" },
          alignItems: "center",
          gap: 2,
          p: 2,
          borderRadius: 1,
          border: `1px dashed ${alpha(theme.palette.primary.main, 0.35)}`,
          bgcolor:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.primary.main, 0.06)
              : alpha(theme.palette.primary.main, 0.04),
        }}
      >
        <Stack direction='row' spacing={3} alignItems='center'>
          <Stack direction='row' spacing={1} alignItems='center'>
            <ConfirmationNumberOutlinedIcon fontSize='small' color='primary' />
            <Box>
              <Typography
                variant='body2'
                sx={{ color: theme.palette.text.secondary }}
              >
                Tickets
              </Typography>
              <Typography sx={{ fontFamily: "monospace", fontWeight: 800 }}>
                {qty}
              </Typography>
            </Box>
          </Stack>

          <Stack>
            <Typography
              variant='body2'
              sx={{ color: theme.palette.text.secondary }}
            >
              Price / ticket
            </Typography>
            <Typography sx={{ fontFamily: "monospace", fontWeight: 800 }}>
              {formatQubic(pricePerTicket)} QUBIC
            </Typography>
          </Stack>

          <Stack>
            <Typography
              variant='body2'
              sx={{ color: theme.palette.text.secondary }}
            >
              Total
            </Typography>
            <Typography
              sx={{
                fontFamily: "monospace",
                fontWeight: 900,
                letterSpacing: ".04em",
                color: insufficient
                  ? theme.palette.error.main
                  : theme.palette.primary.main,
              }}
            >
              {formatQubic(total)} QUBIC
            </Typography>
          </Stack>
        </Stack>

        <Stack
          direction='row'
          spacing={1}
          alignItems='center'
          justifyContent='flex-end'
        >
          {!meetsMinimum && qty > 0 && (
            <Typography
              variant='caption'
              sx={{ color: theme.palette.warning.main, mr: 1 }}
            >
              Need at least {minTickets}
            </Typography>
          )}
          {insufficient && (
            <Typography
              variant='caption'
              sx={{ color: theme.palette.error.main, mr: 1 }}
            >
              Insufficient balance
            </Typography>
          )}
          <Button
            variant='contained'
            size='large'
            onClick={handleConfirm}
            disabled={!canBuy}
            startIcon={<RocketLaunchIcon />}
            sx={{
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: ".08em",
              borderRadius: 0,
              px: 4,
            }}
          >
            {isProcessing ? "Processing..." : "Buy Tickets"}
          </Button>
        </Stack>
      </Box>
    </Stack>
  );

  const FooterConstraints = (
    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
      <Typography
        variant='caption'
        sx={{ color: theme.palette.text.secondary }}
      >
        Min {minTickets} • Max {maxTickets}
        {typeof balanceQubic === "number"
          ? ` • Max affordable ${maxAffordable}`
          : ""}
      </Typography>
    </Box>
  );

  /** Rendu */
  if (variant === "dialog") {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth='md'
        PaperProps={{
          sx: {
            borderRadius: 1,
            overflow: "hidden",
            border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
            background:
              theme.palette.mode === "dark"
                ? `linear-gradient(120deg, ${alpha("#272d38", 0.96)}, ${alpha(
                    theme.palette.primary.main,
                    0.16
                  )})`
                : `linear-gradient(120deg, #fff, ${alpha(
                    theme.palette.primary.main,
                    0.12
                  )})`,
            backdropFilter: "blur(16px)",
          },
        }}
      >
        <Box
          sx={{
            p: { xs: 2.5, sm: 3 },
            pl: { xs: 2.5, sm: 3 },
            pr: { xs: 1, sm: 1 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${alpha(
              theme.palette.primary.main,
              0.12
            )}`,
          }}
        >
          <Stack direction='row' alignItems='center' spacing={1.5}>
            <ConfirmationNumberOutlinedIcon
              sx={{ color: theme.palette.primary.main }}
            />
            <Typography
              variant='h6'
              sx={{
                fontFamily: "monospace",
                fontWeight: 900,
                letterSpacing: ".08em",
                textTransform: "uppercase",
              }}
            >
              {title}
            </Typography>
          </Stack>

          <Stack direction='row' spacing={1.25} alignItems='center'>
            {typeof balanceQubic === "number" && (
              <Chip
                size='small'
                label={`Balance: ${formatQubic(balanceQubic)} QUBIC`}
                sx={{
                  fontFamily: "monospace",
                  fontWeight: 700,
                  borderRadius: 1,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? alpha(theme.palette.primary.main, 0.12)
                      : alpha(theme.palette.primary.main, 0.08),
                  color: theme.palette.primary.main,
                }}
              />
            )}
            <IconButton
              onClick={onClose}
              sx={{
                color: theme.palette.text.secondary,
                "&:hover": {
                  bgcolor: alpha(theme.palette.text.secondary, 0.08),
                },
              }}
              aria-label='Close'
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>

        <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          {Body}
          {FooterConstraints}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{ width: "100%" }}
    >
      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
          background:
            theme.palette.mode === "dark"
              ? `linear-gradient(120deg, ${alpha("#272d38", 0.96)}, ${alpha(
                  theme.palette.primary.main,
                  0.16
                )})`
              : `linear-gradient(120deg, #fff, ${alpha(
                  theme.palette.primary.main,
                  0.12
                )})`,
          backdropFilter: "blur(12px)",
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {Header}
          {Body}
          {typeof balanceQubic === "number" && (
            <Typography
              variant='caption'
              sx={{
                color: theme.palette.text.secondary,
                textAlign: "right",
                display: "block",
                mt: 1,
              }}
            >
              Balance: {formatQubic(balanceQubic)} QUBIC • Max affordable:{" "}
              {maxAffordable}
            </Typography>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

BuyTicketsModal.propTypes = {
  variant: PropTypes.oneOf(["dialog", "inline"]),
  title: PropTypes.string,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onConfirm: PropTypes.func.isRequired,
  isProcessing: PropTypes.bool,
  balanceQubic: PropTypes.number,
  defaultQuantity: PropTypes.number,
  pricePerTicket: PropTypes.number,
  minTickets: PropTypes.number,
  maxTickets: PropTypes.number,
};

export default BuyTicketsModal;
