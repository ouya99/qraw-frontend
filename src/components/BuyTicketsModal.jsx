/* global BigInt */
import AddIcon from '@mui/icons-material/Add';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import RemoveIcon from '@mui/icons-material/Remove';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import {
  AppBar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Slider,
  Stack,
  TextField,
  Toolbar,
  Typography,
  alpha,
  useMediaQuery,
  Chip,
  useTheme,
} from '@mui/material';
import Slide from '@mui/material/Slide';
import PropTypes from 'prop-types';
import React, { useEffect, useMemo, useRef, useState, forwardRef } from 'react';

import { formatQubicAmount } from './qubic/util';

export const DEFAULTS = {
  MAX_TICKETS: 1023,
  MIN_TICKETS: 1,
  PRICE_PER_TICKET: 1_000_000,
  TITLE: 'Buy Tickets',
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const SlideUp = forwardRef(function SlideUp(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function BuyTicketsModal({
  title = DEFAULTS.TITLE,
  open = false,
  onClose,
  onConfirm,
  isProcessing = false,
  balanceQubic,
  defaultQuantity = 0,
  pricePerTicket = DEFAULTS.PRICE_PER_TICKET,
  minTickets = DEFAULTS.MIN_TICKETS,
  maxTickets = DEFAULTS.MAX_TICKETS,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const clampUI = (n, max) => clamp(n, 0, max);
  const inputRef = useRef(null);

  const [qty, setQty] = useState(0);

  const affordableFromBalance = useMemo(() => {
    if (balanceQubic == null) return maxTickets;
    try {
      if (typeof balanceQubic === 'bigint') {
        if (pricePerTicket <= 0) return maxTickets;
        const res = balanceQubic >= 0n ? balanceQubic / BigInt(pricePerTicket) : 0n;
        return Number(res);
      }
      const num = Number(balanceQubic);
      if (!Number.isFinite(num) || num < 0 || pricePerTicket <= 0) return maxTickets;
      return Math.floor(num / pricePerTicket);
    } catch {
      return maxTickets;
    }
  }, [balanceQubic, pricePerTicket, maxTickets]);

  const maxAffordable = clamp(affordableFromBalance, 0, maxTickets);
  const effectiveMax = maxAffordable;

  const balanceNumForUi = useMemo(() => {
    try {
      if (typeof balanceQubic === 'bigint') {
        const cap = BigInt(Number.MAX_SAFE_INTEGER);
        const safe = balanceQubic > cap ? cap : balanceQubic;
        return Number(safe);
      }
      const num = Number(balanceQubic ?? 0);
      return Number.isFinite(num) && num >= 0 ? num : 0;
    } catch {
      return 0;
    }
  }, [balanceQubic]);

  useEffect(() => {
    if (open) {
      setQty(clampUI(defaultQuantity, effectiveMax));
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, defaultQuantity, effectiveMax]);

  useEffect(() => {
    setQty((q) => clampUI(q, effectiveMax));
  }, [effectiveMax]);

  const total = useMemo(() => qty * pricePerTicket, [qty, pricePerTicket]);
  const insufficient = typeof balanceNumForUi === 'number' ? total > balanceNumForUi : false;
  const meetsMinimum = qty >= minTickets;
  const canBuy = !isProcessing && meetsMinimum && qty <= effectiveMax && !insufficient && qty > 0;

  const handleInputChange = (e) => {
    const raw = `${e.target.value}`.replace(/\D/g, '');
    if (raw === '') {
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
    onClose?.();
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
  };

  const header = (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <AddShoppingCartIcon />
      <Typography
        variant="h6"
        sx={{
          fontFamily: 'monospace',
          fontWeight: 700,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          display: { xs: 'none', sm: 'block' },
        }}
        id="buy-tickets-title"
      >
        {title}
      </Typography>
    </Stack>
  );

  const balanceDisplay = (
    <Chip
      label={`Balance: ${formatQubicAmount(balanceNumForUi)} QUBIC`}
      sx={{
        fontFamily: 'monospace',
        fontWeight: 500,
        borderRadius: 1,
        bgcolor: alpha(theme.palette.primary.main, 0.12),
        color: theme.palette.primary.main,
      }}
    />
  );

  const disabledAll = isProcessing || effectiveMax === 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={isMobile ? 'sm' : 'md'}
      fullScreen={isMobile}
      TransitionComponent={SlideUp}
      keepMounted
      aria-labelledby="buy-tickets-title"
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 1 },
          overflow: 'hidden',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
          background: theme.palette.background.default,
          height: { xs: '100dvh', sm: 'auto' },
          m: 0,
        },
      }}
    >
      {isMobile ? (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            bgcolor: alpha(theme.palette.background.paper, 0.7),
            backdropFilter: 'saturate(180%) blur(10px)',
            borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          }}
        >
          <Toolbar
            sx={{
              justifyContent: 'space-between',
              gap: 1,
              alignItems: 'center',
            }}
          >
            {header}
            <Stack direction="row" spacing={1.25} alignItems="center">
              {balanceDisplay}
              <IconButton
                onClick={onClose}
                aria-label="Close"
                edge="end"
                sx={{
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.text.secondary, 0.08),
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Stack>
          </Toolbar>
        </AppBar>
      ) : (
        <Box
          sx={{
            p: { xs: 2.5, sm: 3 },
            pr: { xs: 1, sm: 1 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          }}
        >
          {header}
          <Stack direction="row" spacing={1.25} alignItems="center">
            {balanceDisplay}
            <IconButton
              onClick={onClose}
              aria-label="Close"
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  bgcolor: alpha(theme.palette.text.secondary, 0.08),
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>
      )}

      <DialogContent
        sx={{
          p: { xs: 2, sm: 3.5 },
          pt: { xs: isMobile ? 10 : 3.5, sm: 3.5 },
          pb: { xs: 12, sm: 3.5 },
        }}
      >
        <Stack spacing={isMobile ? 2 : 2.5}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            spacing={isMobile ? 1.25 : 1.5}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={isMobile ? 1 : 1.5}
              sx={{ width: '100%' }}
            >
              <IconButton
                aria-label="remove one"
                onClick={() => dec(1)}
                disabled={qty <= 0 || disabledAll}
                size={isMobile ? 'medium' : 'small'}
                sx={
                  isMobile
                    ? {
                        border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                      }
                    : undefined
                }
              >
                <RemoveIcon />
              </IconButton>

              <TextField
                value={qty}
                inputRef={inputRef}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={() => setQty((q) => clampUI(Number.isNaN(q) ? 0 : q, effectiveMax))}
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  min: 0,
                  max: effectiveMax,
                  style: {
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    fontWeight: 500,
                  },
                  'aria-label': 'Quantity',
                }}
                sx={{ width: { xs: '100%', sm: 160 } }}
                label="Quantity"
                error={!disabledAll && qty > 0 && !meetsMinimum}
                helperText={
                  effectiveMax === 0
                    ? 'No tickets available or insufficient balance.'
                    : !meetsMinimum && qty > 0
                      ? `Minimum ${minTickets} tickets to buy`
                      : ' '
                }
                disabled={isProcessing}
              />

              <IconButton
                aria-label="add one"
                onClick={() => inc(1)}
                disabled={qty >= effectiveMax || disabledAll}
                size={isMobile ? 'medium' : 'small'}
                sx={
                  isMobile
                    ? {
                        border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                      }
                    : undefined
                }
              >
                <AddIcon />
              </IconButton>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              <Button
                variant="outlined"
                size={isMobile ? 'medium' : 'small'}
                onClick={() => inc(10)}
                disabled={disabledAll || qty >= effectiveMax}
                sx={{ borderRadius: 0, flex: { xs: 1, sm: 'unset' } }}
              >
                +10
              </Button>
              <Button
                variant="outlined"
                size={isMobile ? 'medium' : 'small'}
                onClick={() => inc(100)}
                disabled={disabledAll || qty >= effectiveMax}
                sx={{ borderRadius: 0, flex: { xs: 1, sm: 'unset' } }}
              >
                +100
              </Button>
              <Button
                variant="outlined"
                size={isMobile ? 'medium' : 'small'}
                onClick={setMax}
                disabled={disabledAll || qty === effectiveMax}
                sx={{ borderRadius: 0, flex: { xs: 1, sm: 'unset' } }}
              >
                Max
              </Button>
            </Stack>
          </Stack>

          <Slider
            value={qty}
            onChange={(_, v) => setQty(clampUI(Array.isArray(v) ? v[0] : v, effectiveMax))}
            min={0}
            max={effectiveMax}
            step={1}
            valueLabelDisplay={isMobile ? 'off' : 'auto'}
            disabled={disabledAll}
            aria-label="Quantity slider"
            marks={
              isMobile
                ? false
                : [
                    { value: 0, label: '0' },
                    { value: effectiveMax, label: String(effectiveMax) },
                  ]
            }
            style={{ marginBottom: isMobile ? 0.5 : 20 }}
          />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr auto' },
              alignItems: 'center',
              gap: 2,
              p: isMobile ? 1.5 : 2,
              borderRadius: 0,
              border: `1px dashed ${alpha(theme.palette.primary.main, 0.35)}`,
              bgcolor: alpha(theme.palette.primary.main, 0.06),
            }}
          >
            <Stack direction="row" spacing={3} alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <ConfirmationNumberOutlinedIcon fontSize="small" color="primary" />
                <Box>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Tickets
                  </Typography>
                  <Typography sx={{ fontFamily: 'monospace', fontWeight: 500 }}>{qty}</Typography>
                </Box>
              </Stack>

              <Stack>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Price / ticket
                </Typography>
                <Typography sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                  {formatQubicAmount(pricePerTicket)} QUBIC
                </Typography>
              </Stack>

              {!isMobile && (
                <Stack>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Total
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      letterSpacing: '.04em',
                      color: insufficient ? theme.palette.error.main : theme.palette.primary.main,
                    }}
                  >
                    {formatQubicAmount(total)} QUBIC
                  </Typography>
                </Stack>
              )}
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              {!meetsMinimum && qty > 0 && (
                <Typography variant="caption" sx={{ color: theme.palette.warning.main, mr: 1 }}>
                  Need at least {minTickets}
                </Typography>
              )}
              {insufficient && (
                <Typography variant="caption" sx={{ color: theme.palette.error.main, mr: 1 }}>
                  Insufficient balance
                </Typography>
              )}
              <Button
                variant="outlined"
                size="large"
                onClick={handleConfirm}
                disabled={!canBuy}
                startIcon={<RocketLaunchIcon />}
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 500,
                  letterSpacing: '.08em',
                  borderRadius: 0,
                  px: 4,
                }}
              >
                {isProcessing ? 'Processing...' : 'Buy Tickets'}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              Min {minTickets} • Max {maxTickets}
              {typeof effectiveMax === 'number' ? ` • Max affordable ${effectiveMax}` : ''}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          position: { xs: 'fixed', sm: 'static' },
          bottom: 0,
          left: 0,
          right: 0,
          p: { xs: 2, sm: 3 },
          borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          bgcolor: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'saturate(180%) blur(8px)',
          display: { xs: 'flex', sm: 'none' },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: '100%' }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              Total
            </Typography>
            <Typography
              sx={{
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.04em',
                color: insufficient ? theme.palette.error.main : theme.palette.primary.main,
              }}
            >
              {formatQubicAmount(total)} QUBIC
            </Typography>
            {!meetsMinimum && qty > 0 && (
              <Typography
                variant="caption"
                sx={{ color: theme.palette.warning.main, display: 'block' }}
              >
                Need at least {minTickets}
              </Typography>
            )}
            {insufficient && (
              <Typography
                variant="caption"
                sx={{ color: theme.palette.error.main, display: 'block' }}
              >
                Insufficient balance
              </Typography>
            )}
          </Box>

          <Button
            variant="outlined"
            size="large"
            onClick={handleConfirm}
            disabled={!canBuy}
            startIcon={<RocketLaunchIcon />}
            sx={{
              fontWeight: 700,
              minWidth: 160,
              borderRadius: 0,
              letterSpacing: '.08em',
            }}
          >
            {isProcessing ? 'Processing...' : 'Buy'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

BuyTicketsModal.propTypes = {
  title: PropTypes.string,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onConfirm: PropTypes.func.isRequired,
  isProcessing: PropTypes.bool,
  // accepte number | string; BigInt
  balanceQubic: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  defaultQuantity: PropTypes.number,
  pricePerTicket: PropTypes.number,
  minTickets: PropTypes.number,
  maxTickets: PropTypes.number,
};

export default BuyTicketsModal;
