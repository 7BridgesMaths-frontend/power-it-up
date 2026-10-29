export type EffectName = "pulse";

export interface GameConfig {
  gameName: string;
  [key: string]: any;
  slotType: "WAYS" | "LINES" | "CLUSTER" | "STEPPER";
  version: `${number}`;
  info: boolean;

  availableBets: number[];

  balance: number;
  bet: number;
  sidebet?: number | false;

  bigWins: BigWins[]

  bonusBuy: BonusBuy[];

  waysWinningAnimation: {
    border: {
      visible: boolean;
      groupBySymbol: boolean;
    };
    effects: EffectName[];
    duration: number;
    delayBetweenWays?: number;
  };

  loadingScreen: {
    show: boolean,
    test: boolean,
    showLogo: boolean,
  }
  
  forcedPlays: ForcedPlay[]

  linesWinningAnimation: {
      effects: EffectName[];
      duration: number;
      delayBetweenLines?: number;
      allLinesDuration?: number;
      winBoxes?: boolean;
  },

  jackpots: any[];

  grid: number[];

  reels: Record<string, number[]>;

  reelsY: number[];

  reelsConfig: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    gapBetweenReels: number;
    gapBetweenRows: number;
  };

  symbolSize: number;

  spinTriggers?: Record<string, "auto" | "click">;

  debug?: boolean;
}

interface BonusBuy {
  title: string;
  description: string;
  price: number;
  type: string;
  priceType: "fixed" | "multiplier";
  texture: string;
}

interface BigWins {
  type: string;
  multiplier: number;
  [key: string]: any;
}