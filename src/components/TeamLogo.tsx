import React from 'react';
import { TEAMS } from '../utils/generators';

const PIXEL_DATA: Record<string, string[]> = {
  'T1': [ // 陽明金烏 (Sun/Bird)
    "00011000",
    "00111100",
    "01111110",
    "11122111",
    "11111111",
    "01111110",
    "00100100",
    "00100100",
  ],
  'T2': [ // 碧波海神 (Trident)
    "10010010",
    "10010010",
    "10010010",
    "01111100",
    "00010000",
    "00010000",
    "00010000",
    "00010000",
  ],
  'T3': [ // 綠林遊俠 (Bow)
    "00011000",
    "00100100",
    "01000010",
    "01000111",
    "01000010",
    "00100100",
    "00011000",
    "00000000",
  ],
  'T4': [ // 鋼鐵巨獸 (Anvil)
    "00000000",
    "00111100",
    "01111110",
    "01111110",
    "00011000",
    "00111100",
    "01111110",
    "00000000",
  ],
  'T5': [ // 觀星彗星 (Comet)
    "00000011",
    "00000111",
    "00001110",
    "00011100",
    "01110000",
    "11100000",
    "11000000",
    "00000000",
  ],
  'T6': [ // 迷霧幻影 (Ghost)
    "00011100",
    "00111110",
    "01121211",
    "01111111",
    "01111111",
    "01111111",
    "01010101",
    "00000000",
  ],
  'T7': [ // 炎夏火鳥 (Flame)
    "00001000",
    "00011000",
    "00111100",
    "01112100",
    "01111110",
    "01111110",
    "00111100",
    "00011000",
  ],
  'T8': [ // 百花蜜蜂 (Bee)
    "00000000",
    "01100110",
    "00111100",
    "01313130",
    "01131310",
    "00111100",
    "00011000",
    "00001000",
  ],
  'T9': [ // 晨曦曙光 (Rising Sun)
    "00000000",
    "00000000",
    "00011000",
    "00111100",
    "01111110",
    "11111111",
    "11111111",
    "00000000",
  ],
  'T10': [ // 觀海巨浪 (Wave)
    "00000010",
    "00000110",
    "00001100",
    "00011000",
    "00110011",
    "01100111",
    "11111111",
    "11111111",
  ],
  'T11': [ // 巨石泰坦 (Mountain)
    "00000000",
    "00001000",
    "00011100",
    "00112110",
    "01111111",
    "11111111",
    "11111111",
    "11111111",
  ],
  'T12': [ // 銀河星塵 (Star)
    "00011000",
    "00011000",
    "00011000",
    "11111111",
    "11111111",
    "00011000",
    "00011000",
    "00011000",
  ],
  'BANANA': [ // Winter League Banana
    "00000033",
    "00000113",
    "00001100",
    "00011000",
    "00110000",
    "01100000",
    "01100000",
    "00111100",
  ]
};

interface TeamLogoProps {
  teamId: string;
  className?: string;
}

export default function TeamLogo({ teamId, className = "w-12 h-12" }: TeamLogoProps) {
  const isWinter = teamId.startsWith('WB_TEAM');
  const data = isWinter ? PIXEL_DATA['BANANA'] : (PIXEL_DATA[teamId] || PIXEL_DATA['T1']);
  
  const team = TEAMS.find(t => t.id === teamId);
  const primaryColor = isWinter ? '#FDE047' : (team?.logoColor || '#F59E0B');

  const colorMap: Record<string, string> = {
    '0': 'transparent',
    '1': primaryColor,
    '2': '#ffffff',
    '3': '#18181b', // zinc-900
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ imageRendering: 'pixelated' }}>
      <svg viewBox="0 0 8 8" className="w-full h-full drop-shadow-md" shapeRendering="crispEdges">
        {data.map((row, y) => 
          row.split('').map((pixel, x) => {
            if (pixel === '0') return null;
            return (
              <rect 
                key={`${x}-${y}`} 
                x={x} 
                y={y} 
                width="1" 
                height="1" 
                fill={colorMap[pixel]} 
              />
            );
          })
        )}
      </svg>
    </div>
  );
}
