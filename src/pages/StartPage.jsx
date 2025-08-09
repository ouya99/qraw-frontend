import React, { useEffect, useState, useMemo } from 'react';
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
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import GroupIcon from '@mui/icons-material/Group';
import { motion } from 'framer-motion';
import logo from '../assets/logo/logoWin.svg';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import { queryContract } from '../components/qubic/util/contractApi';

const DRAW_INTERVAL = 15;
const NB_PARTICIPANTS = 24;
const PUBLIC_ID_LENGTH = 60;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const INITIAL_POT = '700.000.000';

const randomPublicId = () =>
  Array.from(
    { length: PUBLIC_ID_LENGTH },
    () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  ).join('');

// Draw Animation
function MatrixReveal({ id, duration = 8000, onComplete }) {
  const theme = useTheme();
  const [display, setDisplay] = useState(() => id.replace(/./g, () => '█'));

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
          Math.random() > 0.6
            ? ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
            : '█';
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
  const participants = useMemo(
    () => Array.from({ length: NB_PARTICIPANTS }, randomPublicId),
    []
  );
  const ticketsByParticipant = useMemo(
    () =>
      participants.reduce((acc, id) => {
        acc[id] = Math.floor(Math.random() * 5) + 1;
        return acc;
      }, {}),
    [participants]
  );
  const [winner, setWinner] = useState(null);
  const [nextTime, setnextTime] = useState(DRAW_INTERVAL);
  const [pot, setPot] = useState(INITIAL_POT);
  const [revealComplete, setRevealComplete] = useState(false);

  useEffect(() => {
    const newWinner =
      participants[Math.floor(Math.random() * participants.length)];
    setRevealComplete(false);
    setWinner('');
    setTimeout(() => setWinner(newWinner), 200);

    const timer = setInterval(() => {
      const newWinner =
        participants[Math.floor(Math.random() * participants.length)];
      setWinner('');
      setTimeout(() => setWinner(newWinner), 200);
      setnextTime((prev) => prev + DRAW_INTERVAL);
    }, DRAW_INTERVAL * 1000);

    return () => clearInterval(timer);
  }, [participants]);

  const handleGetTicket = async () => {
    alert('😹');
    const result = await queryContract(
      'http://67.222.157.63:8000',
      15,
      0,
      {},
      [],
      null,
      null,
      null
    );
    console.log('View function result:', result);
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
      <Container maxWidth='lg'>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 8, mt: 8 }}>
          <Typography
            variant='h4'
            sx={{
              fontWeight: 500,
              fontSize: { xs: '1.8rem', sm: '2.0rem', md: '2.3rem' },
              mb: 6,
            }}
          >
            Every Hour, One Shot. One Hash.{' '}
            <span
              style={{
                fontWeight: 700,
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
              component='span'
              sx={{
                fontSize: '0.9em',
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
              component='span'
              sx={{
                fontWeight: 900,
                color: '#fff23eff',
                fontFamily: 'monospace',
                fontSize: '1.2em',
                letterSpacing: '.06em',
              }}
            >
              {pot}
            </Box>
            <Box
              component='span'
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
                alt='Qubic Draw Logo'
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
            alignItems='center'
            justifyContent='center'
            spacing={{ xs: 2, sm: 6 }}
            sx={{ mb: 4, mt: 2 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography
                variant='body1'
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
                  {nextTime} S
                </span>
              </Typography>
            </Box>
          </Stack>

          <Button
            variant='outlined'
            startIcon={<RocketLaunchIcon />}
            onClick={async () => handleGetTicket()}
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.95rem',
              fontWeight: 500,
              px: 4,
              py: 1.5,
              borderRadius: 0,
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
              },
            }}
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
            variant='body2'
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
            <MatrixReveal
              id={winner}
              duration={6000}
              onComplete={() => {
                setRevealComplete(true);
                setPot(0);
              }}
            />
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

        {/* Participant List */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <GroupIcon
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: 20,
                }}
              />
              <Typography
                variant='h6'
                sx={{
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: theme.palette.text.secondary,
                  fontSize: '0.95rem',
                }}
              >
                Participants ({participants.length})
              </Typography>
            </Box>

            <Paper
              variant='outlined'
              sx={{
                overflow: 'auto',
                backgroundColor: 'transparent',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                borderRadius: 1,
              }}
            >
              <List dense disablePadding>
                {participants.map((addr, idx) => (
                  <React.Fragment key={addr}>
                    <ListItem
                      sx={{
                        py: 1,
                        px: 2,
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        color:
                          addr === winner
                            ? theme.palette.primary.main
                            : theme.palette.text.secondary,
                        backgroundColor:
                          addr === winner
                            ? alpha(theme.palette.primary.main, 0.03)
                            : 'transparent',
                        borderLeft:
                          addr === winner
                            ? `2px solid ${theme.palette.primary.main}`
                            : '2px solid transparent',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                      }}
                    >
                      <span>{addr}</span>
                      <Stack direction='row' alignItems='center' spacing={0.5}>
                        <Typography
                          sx={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '0.95em',
                            color:
                              addr === winner
                                ? theme.palette.primary.main
                                : theme.palette.text.secondary,
                          }}
                        >
                          {ticketsByParticipant[addr]}
                        </Typography>
                        <ConfirmationNumberOutlinedIcon
                          sx={{
                            fontSize: 18,
                            color:
                              addr === winner
                                ? theme.palette.primary.main
                                : theme.palette.text.secondary,
                          }}
                        />
                      </Stack>
                    </ListItem>

                    {idx < participants.length - 1 && (
                      <Divider
                        sx={{
                          borderColor: alpha(theme.palette.primary.main, 0.05),
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Stack>
        </motion.div>
      </Container>
    </Box>
  );
}
