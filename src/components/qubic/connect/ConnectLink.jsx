import React, { useState } from "react";
import { Box, Button, useMediaQuery, IconButton } from "@mui/material";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ConnectModal from "./ConnectModal";
import { useQubicConnect } from "./QubicConnectContext";
import { useQuotteryContext } from "../../../contexts/QuotteryContext";
import { MIN_BALANCE_THRESHOLD } from "../util/commons";
import { motion } from "framer-motion";
import { useTheme } from "@mui/material/styles";

const ConnectLink = () => {
  const { connected, showConnectModal, toggleConnectModal } = useQubicConnect();
  const { balance, fetchBalance, walletPublicIdentity } = useQuotteryContext();
  const theme = useTheme();
  const lg = useMediaQuery(theme.breakpoints.up("lg"));
  const [isHovered, setIsHovered] = useState(false);

  const handleBalanceClick = (e) => {
    e.stopPropagation();
    if (walletPublicIdentity) {
      fetchBalance(walletPublicIdentity);
    }
  };

  const isNotEnoughFund = parseInt(balance) <= MIN_BALANCE_THRESHOLD;

  const icon = connected ? (
    <AccountBalanceWalletIcon sx={{
      color: theme.palette.secondary.main,
    }}
    />
  ) : (
    <LockOpenIcon color='tertiary' />
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {lg ? (
          <Button
            onClick={toggleConnectModal}
            variant='standard'
            startIcon={icon}
            size='large'
            sx={{
              fontWeight: 600,
              fontFamily: "monospace",
              fontSize: "1rem",
              px: 4,
              py: 1.3,
              borderRadius: 1,
              letterSpacing: ".06em",
              borderWidth: 2,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {connected ? "Wallet" : "Unlock wallet"}
          </Button>
        ) : (
          <Box
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <IconButton
              onClick={toggleConnectModal}
              sx={{
                p: 0.5,
                backgroundColor: "transparent",
                "&:hover": {
                  backgroundColor: "transparent",
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
