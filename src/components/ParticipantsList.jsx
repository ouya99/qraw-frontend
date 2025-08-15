import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import GroupIcon from '@mui/icons-material/Group';
import {
  Box,
  Typography,
  List,
  ListItem,
  Paper,
  Divider,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import { motion } from 'framer-motion';
import React from 'react';

const ParticipantsList = ({ participants, ticketsByParticipant, publicID, totalTickets }) => {
  const theme = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.8 }}
    >
      <Stack spacing={3}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <GroupIcon
              sx={{
                color: theme.palette.text.secondary,
                fontSize: 20,
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.6rem', sm: '0.8rem', md: '1rem' },
              }}
            >
              Participants ({participants.length})
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ConfirmationNumberOutlinedIcon
              sx={{
                color: theme.palette.text.secondary,
                fontSize: 20,
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.6rem', sm: '0.8rem', md: '1rem' },
              }}
            >
              Tickets ({totalTickets})
            </Typography>
          </Stack>
        </Box>

        <Paper
          variant="outlined"
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
                    fontSize: { xs: '0.6rem', sm: '0.8rem', md: '1rem' },
                    color:
                      addr === publicID ? theme.palette.primary.main : theme.palette.text.secondary,
                    backgroundColor:
                      addr === publicID ? alpha(theme.palette.primary.main, 0.03) : 'transparent',
                    borderLeft:
                      addr === publicID
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
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography
                      sx={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '0.95em',
                        color:
                          addr === publicID
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
                          addr === publicID
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
  );
};

export default ParticipantsList;
