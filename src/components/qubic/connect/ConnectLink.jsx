import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { Box, Button, useMediaQuery, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import React, { useState } from 'react';

import { MIN_BALANCE_THRESHOLD } from '../util/commons';

import ConnectModal from './ConnectModal';
import { useQubicConnect } from './QubicConnectContext';

const ConnectLink = () => {
  const { balance, connected, showConnectModal, toggleConnectModal } = useQubicConnect();
  const theme = useTheme();
  const lg = useMediaQuery(theme.breakpoints.up('lg'));
  const [isHovered, setIsHovered] = useState(false);

  const isNotEnoughFund = parseInt(balance) <= MIN_BALANCE_THRESHOLD;

  const icon = connected ? (
    <AccountBalanceWalletIcon
      sx={{
        color: theme.palette.secondary.main,
      }}
    />
  ) : (
    <LockOpenIcon color="tertiary" />
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {lg ? (
          <Button
            onClick={toggleConnectModal}
            variant="standard"
            startIcon={icon}
            size="large"
            sx={{
              fontWeight: 600,
              fontFamily: 'monospace',
              fontSize: '1rem',
              px: 4,
              py: 1.3,
              borderRadius: 1,
              letterSpacing: '.06em',
              borderWidth: 2,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {connected ? 'Wallet' : 'Unlock wallet'}
          </Button>
        ) : (
          <Box onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            <IconButton
              onClick={toggleConnectModal}
              sx={{
                p: 0.5,
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: 'transparent',
                },
                color: theme.palette.primary.contrastText,
              }}
            >
              {icon}
            </IconButton>
          </Box>
        )}
      </motion.div>

      <ConnectModal open={showConnectModal} onClose={toggleConnectModal} />
    </>
  );
};

export default ConnectLink;
