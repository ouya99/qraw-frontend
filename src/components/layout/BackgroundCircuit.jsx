import { Box, useTheme, alpha } from '@mui/material';

const ElectricCircuit = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      {/* SVG des circuits électroniques */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1200 900"
        style={{ position: 'absolute', opacity: 0.7 }}
      >
        <defs>
          {/* Gradient pour l'électricité */}
          <linearGradient id="electricGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={alpha(theme.palette.primary.main, 0)} />
            <stop offset="50%" stopColor={theme.palette.primary.main} />
            <stop offset="100%" stopColor={alpha(theme.palette.primary.main, 0)} />
          </linearGradient>

          {/* Animation de pulsation électrique */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Circuits de fond */}
        <g opacity="0.3">
          {/* Circuit horizontal principal */}
          <path
            d="M 50 200 L 300 200 L 320 180 M 320 220 L 340 200 L 600 200 L 620 180 M 620 220 L 640 200 L 1150 200"
            stroke={alpha(theme.palette.primary.main, 0.4)}
            strokeWidth="2"
            fill="none"
          />

          {/* Circuit vertical gauche */}
          <path
            d="M 200 50 L 200 150 L 220 170 M 180 170 L 200 150 L 200 250 L 220 270 M 180 270 L 200 250 L 200 400"
            stroke={alpha(theme.palette.primary.main, 0.4)}
            strokeWidth="2"
            fill="none"
          />

          {/* Circuit diagonal */}
          <path
            d="M 800 100 L 900 200 L 1000 300 L 1100 400"
            stroke={alpha(theme.palette.primary.main, 0.4)}
            strokeWidth="2"
            fill="none"
          />

          {/* Composants électroniques */}
          {/* Résistances */}
          <rect
            x="295"
            y="195"
            width="10"
            height="10"
            fill={theme.palette.primary.main}
            opacity="0.6"
          />
          <rect
            x="635"
            y="195"
            width="10"
            height="10"
            fill={theme.palette.primary.main}
            opacity="0.6"
          />
          <rect
            x="195"
            y="245"
            width="10"
            height="10"
            fill={theme.palette.primary.main}
            opacity="0.6"
          />

          {/* Condensateurs */}
          <circle
            cx="500"
            cy="200"
            r="6"
            fill="none"
            stroke={theme.palette.primary.main}
            strokeWidth="2"
            opacity="0.6"
          />
          <circle
            cx="200"
            cy="350"
            r="6"
            fill="none"
            stroke={theme.palette.primary.main}
            strokeWidth="2"
            opacity="0.6"
          />

          {/* Microprocesseurs */}
          <rect
            x="450"
            y="180"
            width="20"
            height="20"
            fill="none"
            stroke={theme.palette.primary.main}
            strokeWidth="2"
            opacity="0.4"
          />
          <rect
            x="900"
            y="190"
            width="15"
            height="15"
            fill="none"
            stroke={theme.palette.primary.main}
            strokeWidth="1.5"
            opacity="0.4"
          />
        </g>

        {/* Impulsions électriques animées */}
        <g filter="url(#glow)">
          {/* Impulsion 1 - Circuit horizontal */}
          <circle r="4" fill="url(#electricGradient)" opacity="0.9">
            <animateMotion
              dur="4s"
              repeatCount="indefinite"
              path="M 50 200 L 300 200 L 320 180 M 320 220 L 340 200 L 600 200 L 620 180 M 620 220 L 640 200 L 1150 200"
            />
          </circle>

          {/* Impulsion 2 - Circuit vertical */}
          <circle r="3" fill={theme.palette.primary.main} opacity="0.8">
            <animateMotion
              dur="3.5s"
              repeatCount="indefinite"
              begin="1s"
              path="M 200 50 L 200 150 L 220 170 M 180 170 L 200 150 L 200 250 L 220 270 M 180 270 L 200 250 L 200 400"
            />
          </circle>

          {/* Impulsion 3 - Circuit diagonal */}
          <circle r="3.5" fill={theme.palette.primary.main} opacity="0.7">
            <animateMotion
              dur="5s"
              repeatCount="indefinite"
              begin="2s"
              path="M 800 100 L 900 200 L 1000 300 L 1100 400"
            />
          </circle>

          {/* Impulsions rapides multiples */}
          <circle r="2" fill={theme.palette.primary.main} opacity="0.9">
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              begin="0.5s"
              path="M 50 200 L 300 200"
            />
          </circle>

          <circle r="2" fill={theme.palette.primary.main} opacity="0.9">
            <animateMotion
              dur="2.5s"
              repeatCount="indefinite"
              begin="1.5s"
              path="M 640 200 L 1150 200"
            />
          </circle>
        </g>

        {/* Nodes de connection qui pulsent */}
        <g>
          <circle cx="300" cy="200" r="5" fill={theme.palette.primary.main} opacity="0.6">
            <animate attributeName="r" values="3;7;3" dur="2s" repeatCount="indefinite" />
            <animate
              attributeName="opacity"
              values="0.4;0.9;0.4"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="640" cy="200" r="5" fill={theme.palette.primary.main} opacity="0.6">
            <animate
              attributeName="r"
              values="3;7;3"
              dur="2.5s"
              repeatCount="indefinite"
              begin="0.5s"
            />
            <animate
              attributeName="opacity"
              values="0.4;0.9;0.4"
              dur="2.5s"
              repeatCount="indefinite"
              begin="0.5s"
            />
          </circle>
          <circle cx="200" cy="250" r="4" fill={theme.palette.primary.main} opacity="0.6">
            <animate
              attributeName="r"
              values="2;6;2"
              dur="1.8s"
              repeatCount="indefinite"
              begin="1s"
            />
            <animate
              attributeName="opacity"
              values="0.3;0.8;0.3"
              dur="1.8s"
              repeatCount="indefinite"
              begin="1s"
            />
          </circle>
        </g>
      </svg>
    </Box>
  );
};

export default ElectricCircuit;
