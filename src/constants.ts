import { Generator, Expansion } from './types';

export const INITIAL_GENERATORS: Generator[] = [
  {
    id: 'gen-1',
    name: 'Manual Crank',
    baseIncome: 1,
    baseCost: 0,
    level: 1,
    unlocked: true,
    description: 'A simple crank. It ain\'t much, but it\'s honest work.',
    icon: 'Hand',
  },
  {
    id: 'gen-2',
    name: 'Steam Piston',
    baseIncome: 5,
    baseCost: 100,
    level: 0,
    unlocked: false,
    description: 'Harness the power of boiling water.',
    icon: 'Wind',
  },
  {
    id: 'gen-3',
    name: 'Electric Turbine',
    baseIncome: 25,
    baseCost: 1000,
    level: 0,
    unlocked: false,
    description: 'Clean, efficient, and slightly dangerous.',
    icon: 'Zap',
  },
  {
    id: 'gen-4',
    name: 'Fusion Reactor',
    baseIncome: 150,
    baseCost: 10000,
    level: 0,
    unlocked: false,
    description: 'The power of a sun in your basement.',
    icon: 'Sun',
  },
  {
    id: 'gen-5',
    name: 'Quantum Extractor',
    baseIncome: 1000,
    baseCost: 100000,
    level: 0,
    unlocked: false,
    description: 'Pulling money from alternate dimensions.',
    icon: 'Atom',
  }
];

export const INITIAL_EXPANSIONS: Expansion[] = [
  {
    id: 'exp-1',
    name: 'Basement Workshop',
    cost: 500,
    unlocked: false,
    description: 'More space for more machines.',
  },
  {
    id: 'exp-2',
    name: 'Industrial Floor',
    cost: 5000,
    unlocked: false,
    description: 'A massive floor for heavy machinery.',
  },
  {
    id: 'exp-3',
    name: 'Skyscraper Wing',
    cost: 50000,
    unlocked: false,
    description: 'The sky is the limit.',
  }
];
