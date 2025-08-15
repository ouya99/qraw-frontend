/* global BigInt */
import { Buffer } from 'buffer';

import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import {
  Box,
  Container,
  Typography,
  List,
  ListItem,
  Paper,
  Divider,
  Stack,
  Button,
  useTheme,
  alpha,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

import logo from '../assets/logo/logoWin.svg';
import BuyTicketsModal, { DEFAULTS } from '../components/BuyTicketsModal';
import ParticipantsList from '../components/ParticipantsList';
import { useQubicConnect } from '../components/qubic/connect/QubicConnectContext';
import { formatQubicAmount } from '../components/qubic/util';
import { queryContract } from '../components/qubic/util/contractApi';
import { parseGetInfo, parseParticipants } from '../components/qubic/util/contractUtils';
import { executeTransactionWithWallet } from '../components/qubic/util/transactionApi';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const INITIAL_POT = '0';

// Draw Animation
function MatrixReveal({ id, duration = 8000, onComplete }) {
  const theme = useTheme();
  const [display, setDisplay] = useState(() => id.replace(/./g, () => '█'));

  useEffect(() => {
    setDisplay(id.replace(/./g, () => '█'));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const indices = Array.from({ length: id.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const start = performance.now();
    let frameId;
    const animate = (time) => {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const toReveal = Math.floor(progress * id.length);
      const next = display.split('');
      for (let k = 0; k < toReveal; k++) {
        const idx = indices[k];
        next[idx] = id[idx];
      }
      for (let k = toReveal; k < id.length; k++) {
        const idx = indices[k];
        next[idx] =
          Math.random() > 0.6 ? ALPHABET[Math.floor(Math.random() * ALPHABET.length)] : '█';
      }
      setDisplay(next.join(''));
      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        setDisplay(id);
        if (onComplete) onComplete();
      }
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [id, duration]);

  return (
    <Box
      sx={{
        fontFamily: 'monospace',
        letterSpacing: '0.05em',
        fontSize: { xs: '1rem', sm: '1.3rem', md: '1.6rem' },
        color: theme.palette.primary.main,
        userSelect: 'all',
        wordBreak: 'break-all',
        textAlign: 'center',
        lineHeight: 1.4,
        p: { xs: 2, sm: 3 },
        borderRadius: 1,
        background: theme.palette.background.paper,
      }}
    >
      {display}
    </Box>
  );
}

export default function StartPage() {
  const theme = useTheme();
  const {
    wallet,
    qHelper,
    getTick,
    signTransaction,
    broadcastTx,
    connected,
    httpEndpoint,
    toggleConnectModal,
    balance,
  } = useQubicConnect();
  console.log('Balance:', balance);

  const [participants, setParticipants] = useState([]);
  const [ticketsByParticipant, setTicketsByParticipant] = useState({});
  const [winner, setWinner] = useState(null);
  const [lastWinAmount, setLastWinAmount] = useState('0');
  const [lastDrawHour, setLastDrawHour] = useState(null);
  const [currentHour, setCurrentHour] = useState(null);
  const [nextDrawHour, setNextDrawHour] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [pot, setPot] = useState(INITIAL_POT);
  const [txStatus, setTxStatus] = useState(false);
  const totalTickets = Object.values(ticketsByParticipant).reduce((sum, t) => sum + t, 0);
  const publicID = wallet ? wallet.publicKey : 'Not connected';

  const [openBuy, setOpenBuy] = useState(false);

  useEffect(() => {
    if (!qHelper) return;

    const fetchInfo = async () => {
      try {
        const result = await queryContract(
          'http://67.222.157.63:8000',
          15, // QDRAW
          2, // getInfo
          {},
          [],
          null,
          null,
          null,
        );
        const buf = Buffer.from(result.rawResponse.responseData, 'base64');
        const info = await parseGetInfo(buf, qHelper);
        setPot(info.pot);
        setCurrentHour(info.currentHour);
        setNextDrawHour(info.nextDrawHour);
        if (info.lastDrawHour !== lastDrawHour) {
          setWinner(info.lastWinner);
          setLastWinAmount(info.lastWinAmount);
          setLastDrawHour(info.lastDrawHour);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchInfo();

    const interval = setInterval(fetchInfo, 2 * 1000);
    return () => clearInterval(interval);
  }, [qHelper, httpEndpoint, lastDrawHour]);

  useEffect(() => {
    if (currentHour === null || nextDrawHour === null) return;
    const update = () => {
      const now = new Date();
      const diffHours = (nextDrawHour - currentHour + 24) % 24;
      const target = new Date(now);
      target.setHours(now.getHours() + diffHours, 0, 0, 0);
      setTimeLeft(Math.max(0, Math.floor((target - now) / 1000)));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [currentHour, nextDrawHour]);

  useEffect(() => {
    if (!qHelper) return;
    const fetchParticipants = async () => {
      try {
        const result = await queryContract(
          'http://67.222.157.63:8000',
          15, // QDRAW
          3, // getParticipants
          {},
          [],
          null,
          null,
          null,
        );
        const buf = Buffer.from(result.rawResponse.responseData, 'base64');
        const parsed = await parseParticipants(buf, qHelper);
        setParticipants(parsed.participants);
        const map = {};
        for (const id of parsed.participants) {
          map[id] = (map[id] || 0) + 1;
        }
        setTicketsByParticipant(map);
      } catch (e) {
        console.error(e);
      }
    };

    fetchParticipants();
    const id = setInterval(fetchParticipants, 2000);
    // if this was run and triggered change in participantsList all good, -> reset txStatus
    if (txStatus) setTxStatus(false);
    return () => {
      clearInterval(id);
    };
  }, [qHelper, httpEndpoint, txStatus]);

  const handleGetTicket = () => {
    if (!connected) {
      toggleConnectModal();
      return;
    }
    setOpenBuy(true);
  };

  const handleConfirmBuy = async (qty) => {
    console.log('Buy', qty, 'tickets');

    const txDetails = {
      qubicConnect: {
        wallet,
        qHelper,
        getTick,
        signTransaction,
        broadcastTx,
        connected,
        httpEndpoint,
      },
      // contractIndex: 'QDRAW',  // not used in function
      procedureIndex: 1,
      params: { ticketCount: qty },
      inputFields: [{ name: 'ticketCount', type: 'uint64' }],
      amount: qty * DEFAULTS.PRICE_PER_TICKET,
      // sourceId: wallet.publicKey, // not used in function
      // destinationId: 'Contract: ' + contractName,  // not used in function
      functionName: 'buyTicket',
      functionParams: { ticketCount: qty },
      // contractIndexes,
    };

    const result = await executeTransactionWithWallet(txDetails);
    console.log(result);
    setTxStatus(result ? result.success : false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: theme.palette.background.default,
        color: theme.palette.text.primary,
        py: { xs: 6, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 8, mt: 8 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 500,
              fontSize: { xs: '1.8rem', sm: '2.0rem', md: '2.3rem' },
              mb: 6,
              fontFamily: 'monospace',
              letterSpacing: '.03em',
            }}
          >
            Every Hour, One Shot. One Hash.{' '}
            <span
              style={{
                fontWeight: 500,
                color: theme.palette.primary.main,
              }}
            >
              One Winner.
            </span>
          </Typography>
          <Paper
            elevation={0}
            sx={{
              px: 4,
              py: 2,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              borderRadius: 99,
              fontWeight: 800,
              fontSize: { xs: '1.25rem', sm: '1.8rem', md: '2rem' },
              letterSpacing: '.04em',
              color: theme.palette.primary.main,
              mb: 2,
              mx: 'auto',
              fontFamily: 'monospace',
            }}
          >
            <Box
              component="span"
              sx={{
                fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.3rem' },
                color: theme.palette.text.secondary,
                fontWeight: 600,
                mr: 2,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                opacity: 0.7,
              }}
            >
              Prize Pool
            </Box>
            <Box
              component="span"
              sx={{
                fontWeight: 600,
                color: '#fff23eff',
                fontFamily: 'monospace',
                fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.8rem' },
                letterSpacing: '.06em',
              }}
            >
              {formatQubicAmount(pot)}
            </Box>
            <Box
              component="span"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
              }}
            >
              <img
                src={logo}
                alt="Qubic Draw Logo"
                style={{
                  width: 32,
                  height: 32,
                  marginLeft: -10,
                  marginTop: 2,
                }}
              />
            </Box>
          </Paper>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems="center"
            justifyContent="center"
            spacing={{ xs: 2, sm: 6 }}
            sx={{ mb: 4, mt: 2 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography
                variant="body1"
                sx={{
                  fontFamily: 'monospace',
                  color: theme.palette.text.secondary,
                  fontSize: '1.1rem',
                }}
              >
                NEXT DRAW IN{' '}
                <span
                  style={{
                    color: theme.palette.primary.main,
                    fontWeight: 700,
                  }}
                >
                  {timeLeft} S
                </span>
              </Typography>
            </Box>
          </Stack>

          <Button
            size="large"
            variant="contained"
            color="primary"
            startIcon={<RocketLaunchIcon />}
            sx={{
              fontWeight: 600,
              fontFamily: 'monospace',
              fontSize: '1rem',
              px: 5,
              py: 1.5,
              borderRadius: 0,
              letterSpacing: '.06em',
              borderWidth: 2,
            }}
            onClick={handleGetTicket}
          >
            Get Ticket
          </Button>
        </Box>

        <Box
          sx={{
            mb: 8,
            p: { xs: 3, sm: 4 },
            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            borderRadius: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: theme.palette.text.secondary,
              mb: 3,
              textAlign: 'center',
              fontSize: '0.85rem',
            }}
          >
            Last Winner ID
          </Typography>

          {winner ? (
            <>
              <MatrixReveal
                key={`${lastDrawHour}-${winner ?? ''}`}
                id={winner ?? ''}
                duration={6000}
              />
              <Typography
                sx={{
                  mt: 2,
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  color: theme.palette.text.secondary,
                }}
              >
                Won {formatQubicAmount(lastWinAmount)}
              </Typography>
            </>
          ) : (
            <Box
              sx={{
                textAlign: 'center',
                py: 4,
                color: theme.palette.text.disabled,
                fontFamily: 'monospace',
              }}
            >
              Waiting for draw...
            </Box>
          )}
        </Box>
        <ParticipantsList
          participants={participants}
          ticketsByParticipant={ticketsByParticipant}
          publicID={publicID}
          totalTickets={totalTickets}
        ></ParticipantsList>
      </Container>

      <BuyTicketsModal
        open={openBuy}
        onClose={() => setOpenBuy(false)}
        balanceQubic={balance}
        onConfirm={handleConfirmBuy}
        isProcessing={false}
      />
    </Box>
  );
}
