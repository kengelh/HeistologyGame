/**
 * @file roster.ts
 * @description
 * This file defines the roster of available characters for the player to choose from.
 * Each character has a unique name, a set of skills with proficiency levels, and a short backstory.
 */

import { RosterCharacter, Skill } from './types';

/**
 * Defines the unique, permanent color for each character, used throughout the UI.
 * This ensures consistency and better character identification.
 * Colors are chosen for good contrast in both light and dark modes.
 */
export const CHARACTER_COLORS: Record<string, string> = {
  // Tier 1
  'Ivan': 'text-orange-400',
  'Theo': 'text-red-400',
  'Lester': 'text-sky-400',
  'Sandra': 'text-pink-400',
  'Earl': 'text-emerald-500',
  'Dominic': 'text-yellow-400',
  // Tier 2
  'Lou I.': 'text-blue-500',
  'Dan T.': 'text-gray-400',
  'Erich I.': 'text-teal-400',
  'Tim S.': 'text-indigo-400',
  'Linus E.': 'text-fuchsia-400',
  'Sara D.': 'text-blue-600',
  // Tier 3
  'Luitpold L.': 'text-orange-500',
  'Sofia S.': 'text-rose-500',
  'Damian D.': 'text-slate-400',
  'Elena E.': 'text-cyan-400',
  'Ivy I.': 'text-lime-500',
  'Tomas T.': 'text-amber-500',
  // Tier 4
  'Edilberto S.': 'text-emerald-600',
  'Leonardo E.': 'text-blue-700',
  'Dudley T.': 'text-yellow-600',
  'Ingo D.': 'text-gray-600',
};


export const ROSTER: RosterCharacter[] = [
  // --- Tier 1: The New Recruits (Always Available) ---
  // High utility base characters with a single specialized skill.

  {
    name: 'Theo',
    skills: { thief: 1 },
    hireCost: 500,
    tier: 1,
    reputationRequired: 0,
    share: 0.1,
    bio: "roster.theo.bio"
  },
  {
    name: 'Lester',
    skills: { lockpicking: 1 },
    hireCost: 500,
    tier: 1,
    reputationRequired: 0,
    share: 0.1,
    bio: "roster.lester.bio"
  },
  {
    name: 'Ivan',
    skills: { infiltrator: 1 },
    hireCost: 500,
    tier: 1,
    reputationRequired: 1,
    share: 0.1,
    bio: "roster.ivan.bio"
  }, {
    name: 'Sandra',
    skills: { safecracker: 1 },
    hireCost: 500,
    tier: 1,
    reputationRequired: 1,
    share: 0.1,
    bio: "roster.sandra.bio"
  },
  {
    name: 'Earl',
    skills: { electronics: 1 },
    hireCost: 500,
    tier: 1,
    reputationRequired: 1,
    share: 0.1,
    bio: "roster.earl.bio"
  },
  {
    name: 'Dominic',
    skills: { demolitions: 1 },
    hireCost: 500,
    tier: 1,
    reputationRequired: 1,
    share: 0.1,
    bio: "roster.dominic.bio"
  },

  // --- Tier 2: Generalists (2x Level 1 Skills) ---
  // Unlocked after early successes (Scenario 2+3).
  {
    name: 'Lou I.',
    skills: { lockpicking: 1, infiltrator: 1 },
    hireCost: 6000,
    tier: 2,
    reputationRequired: 8,
    share: 0.15,
    bio: "roster.lou.bio"
  },
  {
    name: 'Dan T.',
    skills: { demolitions: 1, thief: 1 },
    hireCost: 5500,
    tier: 2,
    reputationRequired: 8,
    share: 0.15,
    bio: "roster.dan.bio"
  },
  {
    name: 'Erich I.',
    skills: { electronics: 1, infiltrator: 1 },
    hireCost: 7500,
    tier: 2,
    reputationRequired: 12,
    share: 0.15,
    bio: "roster.erich.bio"
  },
  {
    name: 'Tim S.',
    skills: { thief: 1, safecracker: 1 },
    hireCost: 6500,
    tier: 2,
    reputationRequired: 12,
    share: 0.15,
    bio: "roster.tim.bio"
  },
  {
    name: 'Linus E.',
    skills: { lockpicking: 1, electronics: 1 },
    hireCost: 8000,
    tier: 2,
    reputationRequired: 15,
    share: 0.15,
    bio: "roster.linus.bio"
  },
  {
    name: 'Sara D.',
    skills: { safecracker: 1, demolitions: 1 },
    hireCost: 7000,
    tier: 2,
    reputationRequired: 15,
    share: 0.15,
    bio: "roster.sara.bio"
  },

  // --- Tier 3: Specialists (1x Level 2 Skill) ---
  // Highly focused experts for specific mission requirements.
  {
    name: 'Luitpold L.',
    skills: { lockpicking: 2 },
    hireCost: 13500,
    tier: 3,
    reputationRequired: 30,
    share: 0.20,
    bio: "roster.luitpold.bio"
  },
  {
    name: 'Sofia S.',
    skills: { safecracker: 2 },
    hireCost: 14000,
    tier: 3,
    reputationRequired: 30,
    share: 0.20,
    bio: "roster.sofia.bio"
  },
  {
    name: 'Damian D.',
    skills: { demolitions: 2 },
    hireCost: 12000,
    tier: 3,
    reputationRequired: 35,
    share: 0.20,
    bio: "roster.damian.bio"
  },
  {
    name: 'Elena E.',
    skills: { electronics: 2 },
    hireCost: 15000,
    tier: 3,
    reputationRequired: 35,
    share: 0.20,
    bio: "roster.elena.bio"
  },
  {
    name: 'Ivy I.',
    skills: { infiltrator: 2 },
    hireCost: 14500,
    tier: 3,
    reputationRequired: 40,
    share: 0.20,
    bio: "roster.ivy.bio"
  },
  {
    name: 'Tomas T.',
    skills: { thief: 2 },
    hireCost: 12500,
    tier: 3,
    reputationRequired: 40,
    share: 0.20,
    bio: "roster.tomas.bio"
  },

  // --- Tier 4: Elites (The Best of the Best) ---
  // High-cost, high-reward specialists with hybrid skill sets.
  {
    name: 'Edilberto S.',
    skills: { electronics: 2, safecracker: 1 },
    hireCost: 28000,
    tier: 4,
    reputationRequired: 80,
    share: 0.20,
    bio: "roster.edilberto.bio"
  },
  {
    name: 'Leonardo E.',
    skills: { lockpicking: 2, electronics: 1 },
    hireCost: 30000,
    tier: 4,
    reputationRequired: 80,
    share: 0.20,
    bio: "roster.leonardo.bio"
  },
  {
    name: 'Dudley T.',
    skills: { demolitions: 2, thief: 1 },
    hireCost: 24000,
    tier: 4,
    reputationRequired: 70,
    share: 0.20,
    bio: "roster.dudley.bio"
  },
  {
    name: 'Ingo D.',
    skills: { infiltrator: 2, demolitions: 1 },
    hireCost: 25000,
    tier: 4,
    reputationRequired: 70,
    share: 0.20,
    bio: "roster.ingo.bio"
  },
];

export const SKILL_DESCRIPTIONS: Record<Skill, string> = {
  lockpicking: "skill_desc.lockpicking",
  safecracker: "skill_desc.safecracker",
  demolitions: "skill_desc.demolitions",
  electronics: "skill_desc.electronics",
  infiltrator: "skill_desc.infiltrator",
  thief: "skill_desc.thief",
  passive: "ui.jack_of_all_trades",
};