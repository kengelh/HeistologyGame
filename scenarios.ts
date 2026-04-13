import { TileType, Scenario, T } from './types';
import type { Camera, Guard, LaserGrid, PressurePlate, TimeLock, HackableTerminal } from './types';
import { GRID_HEIGHT, GRID_WIDTH } from './constants';

/**
 * Creates a full-sized map by embedding a smaller, sparse map onto a grid of EXTERIOR tiles.
 * @param sparse The sparse map data, containing the tile grid and its top-left offset.
 * @returns A full GRID_WIDTH x GRID_HEIGHT map.
 */
const createFullMap = (sparse: { data: TileType[][], offset: { x: number, y: number } }): TileType[][] => {
  const fullMap = Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(T.x));
  const { data, offset } = sparse;
  for (let y = 0; y < data.length; y++) {
    for (let x = 0; x < data[0].length; x++) {
      if ((y + offset.y < GRID_HEIGHT) && (x + offset.x < GRID_WIDTH)) {
        fullMap[y + offset.y][x + offset.x] = data[y][x];
      }
    }
  }
  return fullMap;
};



/**
 * Calculates the total possible value of all treasures in a given scenario.
 * @param scenario The scenario to calculate the value for.
 * @returns The total value as a number.
 */
export const calculateTotalScenarioValue = (scenario: Scenario): number => {
  return Object.values(scenario.treasures).reduce<number>((sum, treasure) => {
    const value = typeof treasure === 'number' ? treasure : treasure.value;
    return sum + value;
  }, 0);
};

// --- Tier 1: The Basics ---
// Copy this code into your scenarios.ts file.
// It relies on the 'createFullMap' helper function in that file.
// Import at the top: import { T } from './types';

const s00_tutorial: Scenario = {
  "id": "s00_tutorial",
  "name": "scenario.s00_tutorial.name",
  "description": "scenario.s00_tutorial.desc",
  "initialMessage": "scenario.s00_tutorial.initialMessage",
  "tier": 1,
  "reputationRequired": 0,
  "reputationRewards": { "base": 1, "stealth": 0, "speed": 0, "fullLoot": 0 },
  "speedRunTime": 60,
  "map": createFullMap({
    data: [
      [T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w],
      [T.w, T.f, T.dc, T.f, T.f, T.f, T.w, T.ab, T.w, T.f, T.f, T.dica, T.w],
      [T.w, T.apa, T.w, T.desk, T.f, T.f, T.w, T.f, T.w, T.f, T.f, T.f, T.w],
      [T.w, T.w, T.w, T.f, T.f, T.f, T.w, T.dc, T.w, T.w, T.w, T.dc, T.w],
      [T.x, T.x, T.w, T.w, T.w, T.do, T.w, T.f, T.f, T.col, T.f, T.f, T.w],
      [T.x, T.x, T.w, T.f, T.plant, T.f, T.do, T.f, T.f, T.f, T.f, T.f, T.w],
      [T.x, T.x, T.w, T.f, T.f, T.f, T.w, T.sc, T.f, T.col, T.f, T.sc, T.w],
      [T.x, T.x, T.w, T.dc, T.w, T.w, T.w, T.w, T.w, T.w, T.do, T.w, T.w],
      [T.x, T.x, T.w, T.f, T.f, T.w, T.x, T.x, T.x, T.w, T.f, T.tc, T.w],
      [T.x, T.x, T.w, T.w, T.dl, T.w, T.x, T.x, T.x, T.w, T.f, T.f, T.w],
      [T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.dl, T.f, T.f, T.w],
      [T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.w, T.w, T.w, T.w],
      [T.x, T.x, T.x, T.x, T.car, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x]
    ],
    offset: { x: 30, y: 23 }
  }),
  "startPositions": [{ "x": 33, "y": 35 }, { "x": 35, "y": 35 }],
  "treasures": { "41-24": 8000, "31-25": 4000, "41-31": 250 },
  "cameras": [],
  "guards": [
    {
      "id": 1760478515503,
      "name": "Uncle Bob",
      patrolRoute: [],
      "x": 33,
      "y": 24,
      "patrolWaypoints": [
        {
          "x": 33,
          "y": 24
        },
        {
          "x": 35,
          "y": 24
        },
        {
          "x": 35,
          "y": 26
        },
        {
          "x": 35,
          "y": 28
        },
        {
          "x": 41,
          "y": 28
        },
        {
          "x": 41,
          "y": 27
        }
      ],
      "patrolIndex": 0,
      "orientation": "down",
      "status": "patrolling",
      "time_to_next_move": 1
    }
  ],
  "primaryTarget": { "x": 41, "y": 24 },
  "secondaryTarget": { "x": 41, "y": 31 },
  "laserGrids": [],
  "pressurePlates": [],
  "timeLocks": [],
  "hackableTerminals": []
};


const s01_starter_job: Scenario = {
  "id": "s01_starter_job",
  "name": "scenario.s01_starter_job.name",
  "description": "scenario.s01_starter_job.desc",
  "initialMessage": "scenario.s01_starter_job.initialMessage",
  "tier": 1,
  "reputationRequired": 1,
  "reputationRewards": { "base": 2, "stealth": 1, "speed": 0, "fullLoot": 0 },
  "speedRunTime": 45,
  "map": createFullMap({
    data: [
      [T.w, T.w, T.w, TileType.WINDOW, TileType.WINDOW, TileType.WINDOW, T.w, T.w, T.w],
      [T.w, T.dica, T.x, T.x, T.x, T.x, T.dla, T.x, T.w],
      [T.cm, T.x, T.x, T.x, T.w, T.dc, T.w, T.apa, T.w],
      [T.w, T.dic, T.x, T.x, T.w, T.x, T.w, T.w, T.w],
      [T.w, T.x, T.x, T.x, T.w, T.x, T.x, T.w, T.x],
      [T.w, T.dic, T.x, T.x, T.w, T.ccp, T.ab, T.w, T.x],
      [T.w, T.w, T.cm, T.dl, T.w, T.w, T.w, T.w, T.x],
      [T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.car, T.x, T.x, T.x, T.x, T.x]
    ],
    offset: { x: 42, y: 28 }
  }),
  "startPositions": [{ "x": 44, "y": 37 }, { "x": 46, "y": 37 }],
  "treasures": { "43-33": 1000, "43-31": 1500, "43-29": 3500, "49-30": 8000 },
  "cameras": [
    {
      "id": 1765546978574,
      "x": 44,
      "y": 34,
      "orientation": "up",
      "pattern": [
        [
          {
            "x": 44,
            "y": 33
          },
          {
            "x": 44,
            "y": 32
          }
        ],
        [
          {
            "x": 43,
            "y": 33
          }
        ],
        [
          {
            "x": 44,
            "y": 33
          },
          {
            "x": 44,
            "y": 32
          }
        ],
        [
          {
            "x": 45,
            "y": 33
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1765546987959,
      "x": 42,
      "y": 30,
      "orientation": "right",
      "pattern": [
        [
          {
            "x": 43,
            "y": 30
          },
          {
            "x": 44,
            "y": 30
          }
        ],
        [
          {
            "x": 43,
            "y": 29
          }
        ],
        [
          {
            "x": 43,
            "y": 30
          },
          {
            "x": 44,
            "y": 30
          }
        ],
        [
          {
            "x": 43,
            "y": 29
          }
        ]
      ],
      "period": 1
    }
  ],
  "guards": [
    {
      "id": 1765550998117,
      "name": "Guard 1",
      patrolRoute: [],
      "x": 49,
      "y": 27,
      "patrolWaypoints": [
        {
          "x": 49,
          "y": 27
        },
        {
          "x": 41,
          "y": 27
        },
        {
          "x": 41,
          "y": 35
        },
        {
          "x": 42,
          "y": 35
        }
      ],
      "patrolIndex": 0,
      "orientation": "down",
      "status": "patrolling",
      "time_to_next_move": 1
    }
  ],
  "primaryTarget": { "x": 49, "y": 30 },
  "secondaryTarget": { "x": 43, "y": 29 },
  "laserGrids": [],
  "pressurePlates": [],
  "timeLocks": [],
  "hackableTerminals": []
};



const s02_diamond_dogs: Scenario = {
  "id": "s02_diamond_dogs",
  "name": "scenario.s02_diamond_dogs.name",
  "description": "scenario.s02_diamond_dogs.desc",
  "briefing": "This place is a relic of the 70s, when the Boss was young and into Elvis and Bowie. High value, low security. The only guard on duty is Mr. Jules Jewels. He's a quite unsuspecting and won't even notice you as long as you don't break anything. In fact, if you get close enough, you might even be able to relieve him of his general key (1 time use).",
  "initialMessage": "The Boss wants you to get the 'Hound Dog Diamond' from the safe. It's a priceless (and slightly questionable) stone that, when you stare at it, it looks exactly like an extremely sparkly Elvis. There is also a vintage poster from David Bowie's first final tour",
  "tier": 1,
  "reputationRequired": 3,
  "reputationRewards": { "base": 3, "stealth": 0, "speed": 1, "fullLoot": 0 },
  "speedRunTime": 45,
  "map": createFullMap({
    data: [
      [T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.x, T.x, T.x, T.x, T.x, T.x],
      [T.w, T.f, T.f, T.f, T.f, T.s, T.w, T.x, T.x, T.x, T.x, T.x, T.x],
      [T.dla, T.f, T.f, T.f, T.desk, T.ab, T.w, T.x, T.x, T.x, T.x, T.x, T.x],
      [T.w, T.f, T.f, T.f, T.f, T.f, T.w, T.x, T.x, T.x, T.x, T.x, T.x],
      [T.w, T.w, T.w, T.dl, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w],
      [T.w, T.f, T.f, T.f, T.f, T.sc, T.cm, T.f, T.f, T.dica, T.f, T.f, T.w],
      [T.w, T.f, T.f, T.f, T.f, T.f, T.dl, T.f, T.f, T.f, T.f, T.dica, T.w],
      [T.w, T.f, T.f, T.f, T.f, T.sc, T.w, T.dica, T.f, T.f, T.f, T.f, T.w],
      [T.w, T.w, T.w, T.dla, T.w, T.w, T.w, T.w, T.cm, T.dc, T.w, T.w, T.w],
      [T.w, T.f, T.f, T.f, T.f, T.f, T.w, T.dica, T.f, T.f, T.f, T.dica, T.w],
      [T.w, T.f, T.f, T.sa, T.f, T.f, T.w, T.f, T.f, T.f, T.f, T.f, T.w],
      [T.w, T.w, T.w, T.cm, T.w, T.w, T.w, T.w, T.w, T.f, T.cm, T.w, T.w],
      [T.w, T.f, T.f, T.w, T.f, T.tc, T.f, T.dic, T.f, T.f, T.f, T.dic, T.w],
      [T.w, T.dica, T.f, T.dl, T.f, T.f, T.f, T.f, T.f, T.f, T.f, T.w, T.w],
      [T.w, T.ccp, T.f, T.w, T.f, T.tc, T.f, T.dic, T.f, T.f, T.f, T.dic, T.w],
      [T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.dl, T.w, T.w, T.w],
      [T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.car, T.x, T.x, T.x]
    ],
    offset: { x: 30, y: 39 }
  }),
  "startPositions": [{ "x": 38, "y": 57 }, { "x": 40, "y": 57 }],
  "treasures": { "41-45": 2400, "41-54": 750, "35-51": 250, "35-53": 250, "31-52": 1250, "41-51": 750, "41-53": 800, "37-53": 500, "37-51": 600, "33-49": 12850, "41-48": 1000, "37-48": 1000, "39-44": 2400, "37-46": 1600, "35-40": 4250 },
  "cameras": [
    {
      "id": 1764255792016,
      "x": 40,
      "y": 51,
      "orientation": "left",
      "pattern": [
        [
          {
            "x": 39,
            "y": 51
          },
          {
            "x": 38,
            "y": 51
          }
        ],
        [
          {
            "x": 39,
            "y": 52
          }
        ],
        [
          {
            "x": 39,
            "y": 51
          },
          {
            "x": 38,
            "y": 51
          }
        ],
        [
          {
            "x": 39,
            "y": 50
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1764255796706,
      "x": 38,
      "y": 47,
      "orientation": "right",
      "pattern": [
        [
          {
            "x": 39,
            "y": 47
          },
          {
            "x": 40,
            "y": 47
          }
        ],
        [
          {
            "x": 39,
            "y": 46
          }
        ],
        [
          {
            "x": 39,
            "y": 47
          },
          {
            "x": 40,
            "y": 47
          }
        ],
        [
          {
            "x": 39,
            "y": 46
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1764865063612,
      "x": 40,
      "y": 50,
      "orientation": "left",
      "pattern": [
        [
          {
            "x": 39,
            "y": 50
          },
          {
            "x": 38,
            "y": 50
          }
        ],
        [
          {
            "x": 39,
            "y": 51
          }
        ],
        [
          {
            "x": 39,
            "y": 50
          },
          {
            "x": 38,
            "y": 50
          }
        ],
        [
          {
            "x": 39,
            "y": 49
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1764865168443,
      "x": 36,
      "y": 44,
      "orientation": "down",
      "pattern": [
        [
          {
            "x": 36,
            "y": 45
          },
          {
            "x": 36,
            "y": 46
          }
        ],
        [
          {
            "x": 37,
            "y": 45
          }
        ],
        [
          {
            "x": 36,
            "y": 45
          },
          {
            "x": 36,
            "y": 46
          }
        ],
        [
          {
            "x": 35,
            "y": 45
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1764865179567,
      "x": 33,
      "y": 50,
      "orientation": "up",
      "pattern": [
        [
          {
            "x": 33,
            "y": 49
          },
          {
            "x": 33,
            "y": 48
          }
        ],
        [
          {
            "x": 32,
            "y": 49
          }
        ],
        [
          {
            "x": 33,
            "y": 49
          },
          {
            "x": 33,
            "y": 48
          }
        ],
        [
          {
            "x": 34,
            "y": 49
          }
        ]
      ],
      "period": 1
    }
  ],
  "guards": [
    {
      "id": 1764865739008,
      "name": "Jules Jewels",
      "patrolRoute": [],
      "x": 29,
      "y": 41,
      "patrolWaypoints": [
        {
          "x": 29,
          "y": 41
        },
        {
          "x": 29,
          "y": 55
        },
        {
          "x": 39,
          "y": 55
        },
        {
          "x": 47,
          "y": 55
        },
        {
          "x": 69,
          "y": 55
        },
        {
          "x": 90,
          "y": 55
        }
      ],
      "patrolIndex": 0,
      "orientation": "down",
      "status": "patrolling",
      "time_to_next_move": 1,
      "onlyAlertsOnDoorTamper": true,
      "despawnAfterMoves": 30,
      "moveCounter": 0,
      "hasKey": true
    }
  ],
  "primaryTarget": { "x": 33, "y": 49 },
  "secondaryTarget": { "x": 35, "y": 40 },
  "laserGrids": [],
  "pressurePlates": [],
  "timeLocks": [],
  "hackableTerminals": []
};


const s03_midnight_auction: Scenario = {
  "id": "s03_midnight_auction",
  "name": "scenario.s03_midnight_auction.name",
  "description": "scenario.s03_midnight_auction.desc",
  "initialMessage": "scenario.s03_midnight_auction.initialMessage",
  "tier": 1,
  "reputationRequired": 4,
  "reputationRewards": { "base": 4, "stealth": 1, "speed": 1, "fullLoot": 0 },
  "speedRunTime": 65,
  "map": createFullMap({
    data: [
      [T.x, T.x, T.x, T.w, T.w, T.w, T.w, T.cm, T.cm, T.w, T.w, T.w, T.w, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.w, T.f, T.f, T.stat, T.dica, T.dica, T.stat, T.f, T.f, T.w, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.w, T.f, T.f, T.f, T.f, T.f, T.f, T.f, T.f, T.w, T.x, T.x, T.x],
      [T.x, T.x, T.x, TileType.WINDOW, T.f, T.f, T.stat, T.f, T.stat, T.stat, T.f, T.f, TileType.WINDOW, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.w, T.f, T.f, T.stat, T.f, T.f, T.stat, T.f, T.f, T.w, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.w, T.cm, T.dc, T.w, T.vd, T.w, T.w, T.dc, T.cm, T.w, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.w, T.f, T.f, T.w, T.x, T.x, T.w, T.f, T.f, T.w, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.w, T.plant, T.f, T.w, T.sa, T.dica, T.w, T.f, T.plant, T.w, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.w, T.cm, T.dc, T.w, T.apa, T.apa, T.w, T.dc, T.cm, T.w, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.w, T.f, T.f, T.f, T.f, T.f, T.f, T.f, T.f, T.w, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.w, T.f, T.dica, T.sofa, T.sofa, T.sofa, T.sofa, T.dica, T.f, T.w, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.w, T.f, T.f, T.f, T.f, T.f, T.f, T.f, T.f, T.w, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.w, T.f, T.f, T.stata, T.f, T.f, T.stata, T.f, T.f, T.w, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.w, T.f, T.f, T.stat, T.fm, T.f, T.stat, T.f, T.f, T.w, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.w, T.w, T.dc, T.w, T.ccp, T.ab, T.w, T.dc, T.w, T.w, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.w, T.desk, T.f, T.f, T.w, T.w, T.f, T.f, T.f, T.w, T.x, T.x, T.x],
      [T.w, T.w, T.w, T.w, T.f, T.f, T.f, T.w, T.w, T.f, T.f, T.f, T.w, T.w, T.w, T.w],
      [T.w, T.f, T.f, T.f, T.f, T.f, T.f, T.w, T.w, T.f, T.f, T.f, T.f, T.f, T.f, T.w],
      [T.w, T.f, T.desk, T.f, T.f, T.plant, T.f, T.w, T.w, T.f, T.plant, T.f, T.f, T.sofa, T.f, T.w],
      [T.w, T.f, T.f, T.f, T.f, T.f, T.f, T.w, T.w, T.f, T.f, T.f, T.f, T.f, T.f, T.w],
      [T.w, T.w, T.w, T.w, T.w, T.w, T.dla, T.w, T.w, T.dla, T.w, T.w, T.w, T.w, T.w, T.w],
      [T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.car, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x]
    ],
    offset: { x: 35, y: 21 }
  }),
  "startPositions": [{ "x": 42, "y": 43 }, { "x": 43, "y": 43 }],
  "treasures": { "40-31": 5000, "45-31": 5000, "42-22": 32000, "43-22": 12000, "41-22": 1000, "44-22": 1000, "41-24": 2000, "41-25": 3500, "44-24": 6000, "44-25": 4000, "43-24": 1200, "43-28": 12000, "42-28": 24000, "41-33": 2000, "44-33": 2000, "42-29": 12000, "43-29": 8000, "41-34": 1000, "44-34": 1000 },
  "cameras": [
    {
      "id": 1,
      "x": 42,
      "y": 30,
      "orientation": "down",
      "pattern": [
        [
          {
            "x": 42,
            "y": 31
          },
          {
            "x": 42,
            "y": 32
          }
        ],
        [
          {
            "x": 41,
            "y": 31
          }
        ],
        [
          {
            "x": 42,
            "y": 31
          },
          {
            "x": 42,
            "y": 32
          }
        ],
        [
          {
            "x": 43,
            "y": 31
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 2,
      "x": 47,
      "y": 30,
      "orientation": "down",
      "pattern": [
        [
          {
            "x": 47,
            "y": 31
          },
          {
            "x": 47,
            "y": 32
          }
        ],
        [
          {
            "x": 48,
            "y": 31
          }
        ],
        [
          {
            "x": 47,
            "y": 31
          },
          {
            "x": 47,
            "y": 32
          }
        ],
        [
          {
            "x": 46,
            "y": 31
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 4,
      "x": 47,
      "y": 37,
      "orientation": "right",
      "pattern": [
        [
          {
            "x": 48,
            "y": 37
          },
          {
            "x": 49,
            "y": 37
          }
        ],
        [
          {
            "x": 48,
            "y": 38
          }
        ],
        [
          {
            "x": 48,
            "y": 37
          },
          {
            "x": 49,
            "y": 37
          }
        ],
        [
          {
            "x": 48,
            "y": 36
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 6,
      "x": 47,
      "y": 28,
      "orientation": "left",
      "pattern": [
        [
          {
            "x": 46,
            "y": 28
          },
          {
            "x": 45,
            "y": 28
          }
        ],
        [
          {
            "x": 46,
            "y": 27
          }
        ],
        [
          {
            "x": 46,
            "y": 28
          },
          {
            "x": 45,
            "y": 28
          }
        ],
        [
          {
            "x": 46,
            "y": 29
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1765741925315,
      "x": 46,
      "y": 26,
      "orientation": "left",
      "pattern": [
        [
          {
            "x": 45,
            "y": 26
          },
          {
            "x": 44,
            "y": 26
          }
        ],
        [
          {
            "x": 45,
            "y": 27
          }
        ],
        [
          {
            "x": 45,
            "y": 26
          },
          {
            "x": 44,
            "y": 26
          }
        ],
        [
          {
            "x": 45,
            "y": 25
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1765741926358,
      "x": 46,
      "y": 29,
      "orientation": "left",
      "pattern": [
        [
          {
            "x": 45,
            "y": 29
          },
          {
            "x": 44,
            "y": 29
          }
        ],
        [
          {
            "x": 45,
            "y": 30
          }
        ],
        [
          {
            "x": 45,
            "y": 29
          },
          {
            "x": 44,
            "y": 29
          }
        ],
        [
          {
            "x": 45,
            "y": 28
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1765741928691,
      "x": 39,
      "y": 29,
      "orientation": "right",
      "pattern": [
        [
          {
            "x": 40,
            "y": 29
          },
          {
            "x": 41,
            "y": 29
          }
        ],
        [
          {
            "x": 40,
            "y": 28
          }
        ],
        [
          {
            "x": 40,
            "y": 29
          },
          {
            "x": 41,
            "y": 29
          }
        ],
        [
          {
            "x": 40,
            "y": 28
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1765741929359,
      "x": 39,
      "y": 26,
      "orientation": "right",
      "pattern": [
        [
          {
            "x": 40,
            "y": 26
          },
          {
            "x": 41,
            "y": 26
          }
        ],
        [
          {
            "x": 40,
            "y": 25
          }
        ],
        [
          {
            "x": 40,
            "y": 26
          },
          {
            "x": 41,
            "y": 26
          }
        ],
        [
          {
            "x": 40,
            "y": 25
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1765741933898,
      "x": 42,
      "y": 21,
      "orientation": "down",
      "pattern": [
        [
          {
            "x": 42,
            "y": 22
          },
          {
            "x": 42,
            "y": 23
          }
        ],
        [
          {
            "x": 43,
            "y": 22
          }
        ],
        [
          {
            "x": 42,
            "y": 22
          },
          {
            "x": 42,
            "y": 23
          }
        ],
        [
          {
            "x": 41,
            "y": 22
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1765741934749,
      "x": 43,
      "y": 21,
      "orientation": "down",
      "pattern": [
        [
          {
            "x": 43,
            "y": 22
          },
          {
            "x": 43,
            "y": 23
          }
        ],
        [
          {
            "x": 44,
            "y": 22
          }
        ],
        [
          {
            "x": 43,
            "y": 22
          },
          {
            "x": 43,
            "y": 23
          }
        ],
        [
          {
            "x": 42,
            "y": 22
          }
        ]
      ],
      "period": 1
    }
  ],
  "guards": [
    {
      "id": 1765741731005,
      "name": "Mr North",
      "patrolRoute": [],
      "x": 45,
      "y": 30,
      "patrolWaypoints": [
        {
          "x": 45,
          "y": 30
        },
        {
          "x": 45,
          "y": 23
        },
        {
          "x": 40,
          "y": 23
        },
        {
          "x": 40,
          "y": 30
        }
      ],
      "patrolIndex": 0,
      "orientation": "down",
      "status": "patrolling",
      "time_to_next_move": 1,
      "hasKey": true
    },
    {
      "id": 1765741873204,
      "name": "Mr South",
      "patrolRoute": [],
      "x": 40,
      "y": 37,
      "patrolWaypoints": [
        {
          "x": 40,
          "y": 37
        },
        {
          "x": 40,
          "y": 32
        },
        {
          "x": 39,
          "y": 32
        },
        {
          "x": 39,
          "y": 30
        },
        {
          "x": 46,
          "y": 30
        },
        {
          "x": 46,
          "y": 32
        },
        {
          "x": 45,
          "y": 32
        },
        {
          "x": 45,
          "y": 37
        }
      ],
      "patrolIndex": 0,
      "orientation": "down",
      "status": "patrolling",
      "time_to_next_move": 1,
      "hasKey": true
    }
  ],
  "primaryTarget": { "x": 42, "y": 22 },
  "secondaryTarget": { "x": 42, "y": 29 },
  "laserGrids": [],
  "pressurePlates": [],
  "timeLocks": [],
  "hackableTerminals": []
};

const s04_galerie_dor_org: Scenario = {
  "id": "s04_galerie_dor_org",
  "name": "The Galerie D'Or",
  "description": "The newly opened Galerie D'Or is showing Al Capone's paintings when he was in kindergarden. The Boss needs these fantasies in crayon badly. Security is professional but manageable - a good test of your growing skills.",
  "initialMessage": "The Boss is anxious and cannot wait! The the picture, and get out. Watch out for the guards and the security cameras.",
  "tier": 1,
  "reputationRequired": 7,
  "reputationRewards": { "base": 5, "stealth": 2, "speed": 2, "fullLoot": 0 },
  "speedRunTime": 90,
  "map": createFullMap({
    data: [
      [T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.cm, T.w, T.w, T.w],
      [T.w, T.s, T.x, T.sa, T.w, T.f, T.stata, T.stata, T.f, T.w, T.tc, T.f, T.f, T.f, T.f, T.w, T.sofa, T.f, T.w, T.ab, T.f, T.ccp, T.w],
      [T.cm, T.x, T.x, T.x, T.cm, T.f, T.f, T.f, T.f, T.w, T.f, T.sofa, T.f, T.sofa, T.f, T.w, T.f, T.plant, T.w, T.x, T.desk, T.f, T.w],
      [T.w, T.stata, T.x, T.x, T.w, T.st, T.f, T.f, T.st, T.w, T.sofa, T.f, T.f, T.f, T.sofa, T.w, T.f, T.f, T.do, T.f, T.desk, T.f, T.w],
      [T.w, T.apa, T.x, T.x, T.cm, T.st, T.f, T.f, T.st, T.w, T.plant, T.f, T.sofa, T.f, T.plant, T.w, T.sofa, T.f, T.cm, T.f, T.f, T.f, T.w],
      [T.w, T.stata, T.x, T.x, T.w, T.w, T.dc, T.ap, T.w, T.w, T.w, T.dc, T.cm, T.dc, T.w, T.cm, T.w, T.dl, T.w, T.ap, T.w, T.dla, T.cm],
      [T.w, T.apa, T.x, T.x, T.dla, T.f, T.f, T.f, T.f, T.f, T.f, T.f, T.f, T.f, T.f, T.f, T.f, T.f, T.f, T.f, T.f, T.f, T.w],
      [T.w, T.w, T.cm, T.w, T.w, T.f, T.f, T.f, T.f, T.sc, T.f, T.f, T.f, T.f, T.f, T.sc, T.f, T.f, T.f, T.f, T.f, T.f, T.w],
      [T.x, T.x, T.x, T.x, T.w, T.w, T.w, T.cm, T.w, T.w, T.f, T.f, T.cm, T.f, T.f, T.w, T.w, T.w, T.cm, T.cm, T.w, T.w, T.w],
      [T.x, T.x, T.x, T.x, T.w, T.f, T.st, T.f, T.st, T.w, T.f, T.f, T.w, T.f, T.f, T.cm, T.f, T.apa, T.f, T.apa, T.f, T.f, T.w],
      [T.x, T.x, T.x, T.x, T.cm, T.stata, T.f, T.f, T.f, T.do, T.f, T.f, T.w, T.f, T.f, T.do, T.f, T.f, T.f, T.f, T.f, T.stata, T.cm],
      [T.x, T.x, T.x, T.x, T.w, T.f, T.fm, T.f, T.f, T.w, T.f, T.f, T.w, T.f, T.f, T.cm, T.f, T.f, T.f, T.f, T.f, T.f, T.w],
      [T.x, T.x, T.x, T.x, T.w, T.w, T.apa, T.w, T.apa, T.w, T.f, T.f, T.w, T.f, T.f, T.w, T.w, T.apa, T.w, T.ap, T.w, T.w, T.w],
      [T.x, T.x, T.x, T.x, T.w, T.x, T.x, T.x, T.x, T.w, T.f, T.f, T.w, T.f, T.f, T.w, T.w, T.x, T.x, T.x, T.x, T.x, T.w],
      [T.x, T.x, T.x, T.x, T.w, T.w, T.w, T.w, T.w, T.w, T.dc, T.dc, T.w, T.tc, T.dc, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w],
      [T.x, T.x, T.x, T.x, T.w, T.sc, T.plant, T.sc, T.f, T.st, T.f, T.f, T.w, T.f, T.f, T.st, T.f, T.f, T.f, T.dc, T.f, T.loo, T.w],
      [T.x, T.x, T.x, T.x, T.w, T.plant, T.f, T.f, T.f, T.f, T.f, T.tc, T.w, T.f, T.f, T.f, T.f, T.plant, T.plant, T.w, T.w, T.w, T.w],
      [T.x, T.x, T.x, T.x, T.w, T.sc, T.plant, T.sc, T.f, T.sc, T.f, T.f, T.w, T.f, T.f, T.sc, T.f, T.f, T.f, T.dc, T.f, T.loo, T.w],
      [T.x, T.x, T.x, T.x, T.w, T.w, T.w, T.w, T.w, T.w, T.dl, T.dl, T.w, T.dl, T.dl, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w],
      [T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.car, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x]
    ],
    offset: { x: 34, y: 20 }
  }),
  "startPositions": [{ "x": 45, "y": 40 }, { "x": 47, "y": 40 }, { "x": 44, "y": 40 }, { "x": 48, "y": 40 }],
  "treasures": { "47-34": 250, "43-35": 1600, "49-35": 1200, "55-30": 18000, "39-30": 14000, "53-32": 1200, "41-25": 1600, "53-25": 2000, "44-21": 250, "45-36": 800, "41-21": 14000, "40-21": 8000, "39-23": 1000, "42-23": 1000, "42-24": 1000, "39-24": 1000, "51-29": 8000, "53-29": 6000, "51-32": 9000, "42-29": 1000, "40-29": 1000, "42-32": 6500, "40-32": 11000, "37-21": 38000, "35-21": 5000, "35-26": 16000, "35-24": 12000, "35-23": 22000, "35-25": 26000 },
  "cameras": [
    {
      "id": 3,
      "x": 48,
      "y": 30,
      "orientation": "down",
      "period": 2,
      "pattern": [
        [
          {
            "x": 48,
            "y": 31
          }
        ],
        [
          {
            "x": 49,
            "y": 31
          }
        ]
      ]
    },
    {
      "id": 1763334784057,
      "x": 56,
      "y": 30,
      "orientation": "left",
      "pattern": [
        [
          {
            "x": 55,
            "y": 30
          },
          {
            "x": 54,
            "y": 30
          }
        ],
        [
          {
            "x": 55,
            "y": 31
          }
        ],
        [
          {
            "x": 55,
            "y": 30
          },
          {
            "x": 54,
            "y": 30
          }
        ],
        [
          {
            "x": 55,
            "y": 29
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1763334790874,
      "x": 38,
      "y": 30,
      "orientation": "right",
      "pattern": [
        [
          {
            "x": 39,
            "y": 30
          },
          {
            "x": 40,
            "y": 30
          }
        ],
        [
          {
            "x": 39,
            "y": 29
          }
        ],
        [
          {
            "x": 39,
            "y": 30
          },
          {
            "x": 40,
            "y": 30
          }
        ],
        [
          {
            "x": 39,
            "y": 29
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1763337120489,
      "x": 41,
      "y": 28,
      "orientation": "down",
      "pattern": [
        [
          {
            "x": 41,
            "y": 29
          },
          {
            "x": 41,
            "y": 30
          }
        ],
        [
          {
            "x": 42,
            "y": 29
          }
        ],
        [
          {
            "x": 41,
            "y": 29
          },
          {
            "x": 41,
            "y": 30
          }
        ],
        [
          {
            "x": 40,
            "y": 29
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1763337131493,
      "x": 46,
      "y": 28,
      "orientation": "up",
      "pattern": [
        [
          {
            "x": 46,
            "y": 27
          },
          {
            "x": 46,
            "y": 26
          }
        ],
        [
          {
            "x": 45,
            "y": 27
          }
        ],
        [
          {
            "x": 46,
            "y": 27
          },
          {
            "x": 46,
            "y": 26
          }
        ],
        [
          {
            "x": 47,
            "y": 27
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1763337134409,
      "x": 46,
      "y": 25,
      "orientation": "down",
      "pattern": [
        [
          {
            "x": 46,
            "y": 26
          },
          {
            "x": 46,
            "y": 27
          }
        ],
        [
          {
            "x": 47,
            "y": 26
          }
        ],
        [
          {
            "x": 46,
            "y": 26
          },
          {
            "x": 46,
            "y": 27
          }
        ],
        [
          {
            "x": 45,
            "y": 26
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1763337169032,
      "x": 56,
      "y": 25,
      "orientation": "left",
      "pattern": [
        [
          {
            "x": 55,
            "y": 25
          },
          {
            "x": 54,
            "y": 25
          }
        ],
        [
          {
            "x": 55,
            "y": 26
          }
        ],
        [
          {
            "x": 55,
            "y": 25
          },
          {
            "x": 54,
            "y": 25
          }
        ],
        [
          {
            "x": 55,
            "y": 24
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1763337181112,
      "x": 52,
      "y": 24,
      "orientation": "up",
      "pattern": [
        [
          {
            "x": 52,
            "y": 23
          },
          {
            "x": 52,
            "y": 22
          }
        ],
        [
          {
            "x": 51,
            "y": 23
          }
        ],
        [
          {
            "x": 52,
            "y": 23
          },
          {
            "x": 52,
            "y": 22
          }
        ],
        [
          {
            "x": 53,
            "y": 23
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1763337197842,
      "x": 53,
      "y": 20,
      "orientation": "down",
      "pattern": [
        [
          {
            "x": 53,
            "y": 21
          },
          {
            "x": 53,
            "y": 22
          }
        ],
        [
          {
            "x": 54,
            "y": 21
          }
        ],
        [
          {
            "x": 53,
            "y": 21
          },
          {
            "x": 53,
            "y": 22
          }
        ],
        [
          {
            "x": 52,
            "y": 21
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1763337213277,
      "x": 38,
      "y": 22,
      "orientation": "left",
      "pattern": [
        [
          {
            "x": 37,
            "y": 22
          },
          {
            "x": 36,
            "y": 22
          }
        ],
        [
          {
            "x": 37,
            "y": 23
          }
        ],
        [
          {
            "x": 37,
            "y": 22
          },
          {
            "x": 36,
            "y": 22
          }
        ],
        [
          {
            "x": 37,
            "y": 21
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1763337214514,
      "x": 38,
      "y": 24,
      "orientation": "left",
      "pattern": [
        [
          {
            "x": 37,
            "y": 24
          },
          {
            "x": 36,
            "y": 24
          }
        ],
        [
          {
            "x": 37,
            "y": 25
          }
        ],
        [
          {
            "x": 37,
            "y": 24
          },
          {
            "x": 36,
            "y": 24
          }
        ],
        [
          {
            "x": 37,
            "y": 23
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1763337181112,
      "x": 36,
      "y": 27,
      "orientation": "up",
      "pattern": [
        [
          {
            "x": 36,
            "y": 26
          },
          {
            "x": 36,
            "y": 25
          }
        ],
        [
          {
            "x": 35,
            "y": 26
          }
        ],
        [
          {
            "x": 36,
            "y": 26
          },
          {
            "x": 36,
            "y": 25
          }
        ],
        [
          {
            "x": 37,
            "y": 26
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1763337223565,
      "x": 34,
      "y": 22,
      "orientation": "right",
      "pattern": [
        [
          {
            "x": 35,
            "y": 22
          },
          {
            "x": 36,
            "y": 22
          }
        ],
        [
          {
            "x": 35,
            "y": 21
          }
        ],
        [
          {
            "x": 35,
            "y": 22
          },
          {
            "x": 36,
            "y": 22
          }
        ],
        [
          {
            "x": 35,
            "y": 21
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1763394538655,
      "x": 52,
      "y": 28,
      "orientation": "down",
      "pattern": [
        [
          {
            "x": 52,
            "y": 29
          },
          {
            "x": 52,
            "y": 30
          }
        ],
        [
          {
            "x": 53,
            "y": 29
          }
        ],
        [
          {
            "x": 52,
            "y": 29
          },
          {
            "x": 52,
            "y": 30
          }
        ],
        [
          {
            "x": 51,
            "y": 29
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1763394563181,
      "x": 49,
      "y": 31,
      "orientation": "right",
      "pattern": [
        [
          {
            "x": 50,
            "y": 31
          },
          {
            "x": 51,
            "y": 31
          }
        ],
        [
          {
            "x": 50,
            "y": 30
          }
        ],
        [
          {
            "x": 50,
            "y": 31
          },
          {
            "x": 51,
            "y": 31
          }
        ],
        [
          {
            "x": 50,
            "y": 30
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1763394564226,
      "x": 49,
      "y": 29,
      "orientation": "right",
      "pattern": [
        [
          {
            "x": 50,
            "y": 29
          },
          {
            "x": 51,
            "y": 29
          }
        ],
        [
          {
            "x": 50,
            "y": 28
          }
        ],
        [
          {
            "x": 50,
            "y": 29
          },
          {
            "x": 51,
            "y": 29
          }
        ],
        [
          {
            "x": 50,
            "y": 28
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1763394583495,
      "x": 53,
      "y": 28,
      "orientation": "up",
      "pattern": [
        [
          {
            "x": 53,
            "y": 27
          },
          {
            "x": 53,
            "y": 26
          }
        ],
        [
          {
            "x": 52,
            "y": 27
          }
        ],
        [
          {
            "x": 53,
            "y": 27
          },
          {
            "x": 53,
            "y": 26
          }
        ],
        [
          {
            "x": 54,
            "y": 27
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1763394589895,
      "x": 49,
      "y": 25,
      "orientation": "down",
      "pattern": [
        [
          {
            "x": 49,
            "y": 26
          },
          {
            "x": 49,
            "y": 27
          }
        ],
        [
          {
            "x": 50,
            "y": 26
          }
        ],
        [
          {
            "x": 49,
            "y": 26
          },
          {
            "x": 49,
            "y": 27
          }
        ],
        [
          {
            "x": 48,
            "y": 26
          }
        ]
      ],
      "period": 1
    }
  ],
  "guards": [
    {
      "id": 1765576215056,
      "name": "Mr. West",
      "patrolRoute": [],
      "x": 43,
      "y": 26,
      "patrolWaypoints": [
        {
          "x": 43,
          "y": 26
        },
        {
          "x": 44,
          "y": 32
        }
      ],
      "patrolIndex": 0,
      "orientation": "down",
      "status": "patrolling",
      "time_to_next_move": 1,
      "hasKey": true
    },
    {
      "id": 1765709539148,
      "name": "Mr. East",
      "patrolRoute": [],
      "x": 47,
      "y": 32,
      "patrolWaypoints": [
        {
          "x": 47,
          "y": 32
        },
        {
          "x": 47,
          "y": 26
        },
        {
          "x": 55,
          "y": 26
        },
        {
          "x": 48,
          "y": 26
        },
        {
          "x": 48,
          "y": 30
        },
        {
          "x": 49,
          "y": 30
        },
        {
          "x": 48,
          "y": 30
        },
        {
          "x": 48,
          "y": 32
        },
        {
          "x": 47,
          "y": 32
        }
      ],
      "patrolIndex": 0,
      "orientation": "down",
      "status": "patrolling",
      "time_to_next_move": 1,
      "hasKey": true
    }
  ],
  "hackableTerminals": [
    {
      "x": 46,
      "y": 32,
      "cameraIds": [
        1
      ]
    }
  ],
  "primaryTarget": { "x": 37, "y": 21 },
  "secondaryTarget": { "x": 55, "y": 30 }
};


const s05_downtown_bank_org: Scenario = {
  "id": "s05_downtown_bank_org",
  "name": "scenario.s05_downtown_bank.name",
  "description": "scenario.s05_downtown_bank.desc",
  "initialMessage": "The vault is alarmed, but the manager keeps a keycard in his office safe. Get that key first, then you can open the vault without triggering the alarm. Watch your step around those pressure plates!",
  "tier": 2,
  "reputationRequired": 12,
  "reputationRewards": { "base": 6, "stealth": 1, "speed": 1, "fullLoot": 0.5 },
  "speedRunTime": 120,
  "map": createFullMap({
    data: [
      [T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w],
      [T.w, T.fc, T.fc, T.fc, T.fc, T.fc, T.fc, T.w, T.desk, T.f, T.w, T.desk, T.f, T.w, T.desk, T.f, T.w, T.desk, T.f, T.w, T.f, T.f, T.sofa, T.w],
      [T.w, T.fc, T.w, T.w, T.w, T.vd, T.w, T.w, T.w, T.dl, T.w, T.w, T.dl, T.w, T.w, T.dl, T.w, T.w, T.dl, T.cm, T.sa, T.f, T.f, T.w],
      [T.w, T.fc, T.cm, T.stat, T.pp, T.pp, T.w, T.fc, T.dla, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.dla, T.f, T.f, T.desk, T.w],
      [T.w, T.fc, T.w, T.gba, T.pp, T.gba, T.w, T.fc, T.w, T.w, T.w, T.dla, T.w, T.w, T.w, T.w, T.x, T.plant, T.x, T.w, T.apa, T.f, T.f, T.w],
      [T.w, T.fc, T.cm, T.pp, T.pp, T.pp, T.w, T.fc, T.w, T.x, T.x, T.x, T.x, T.x, T.x, T.w, T.x, T.stata, T.x, T.w, T.w, T.cm, T.w, T.w],
      [T.w, T.fc, T.w, T.sa, T.gba, T.gba, T.w, T.fc, T.w, T.x, T.w, T.w, T.w, T.w, T.dla, T.cm, T.x, T.plant, T.x, T.dl, T.f, T.col, T.f, T.w],
      [T.w, T.fc, T.w, T.w, T.w, T.w, T.w, T.fc, T.w, T.x, T.dl, T.x, T.ccp, T.ppp, T.x, T.w, T.x, T.x, T.x, T.w, T.f, T.desk, T.f, T.w],
      [T.w, T.fc, T.fc, T.fc, T.fc, T.fc, T.fc, T.fc, T.w, T.x, T.w, T.x, T.ab, T.w, T.sa, T.w, T.x, T.wc, T.x, T.w, T.f, T.f, T.f, T.w],
      [T.w, T.w, T.w, T.w, T.w, T.cm, T.dla, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.dl, T.w, T.w, T.w, T.w, T.w, T.w, T.w],
      [T.x, T.x, T.x, T.x, T.x, T.w, T.x, T.w, T.f, T.col, T.f, T.f, T.f, T.col, T.f, T.w, T.x, T.w, T.x, T.x, T.x, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.x, T.x, T.w, T.x, T.tc, T.f, T.f, T.f, T.f, T.f, T.f, T.f, T.tc, T.x, T.w, T.x, T.x, T.x, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.x, T.x, T.w, T.x, T.tc, T.f, T.col, T.f, T.f, T.f, T.col, T.f, T.tc, T.x, T.w, T.x, T.x, T.x, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.x, T.x, T.w, T.x, T.w, T.f, T.f, T.f, T.f, T.f, T.f, T.f, T.tc, T.x, T.w, T.x, T.x, T.x, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.x, T.x, T.w, T.x, T.tc, T.f, T.col, T.f, T.f, T.f, T.col, T.f, T.tc, T.x, T.w, T.x, T.x, T.x, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.x, T.x, T.w, T.x, T.tc, T.f, T.f, T.f, T.f, T.f, T.f, T.f, T.tc, T.x, T.w, T.x, T.x, T.x, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.x, T.x, T.w, T.x, T.tc, T.f, T.col, T.f, T.f, T.f, T.col, T.f, T.tc, T.x, T.w, T.x, T.x, T.x, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.x, T.x, T.w, T.x, T.tc, T.f, T.f, T.f, T.f, T.f, T.f, T.f, T.tc, T.x, T.w, T.x, T.x, T.x, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.x, T.x, T.w, T.x, T.dl, T.f, T.f, T.f, T.f, T.f, T.f, T.f, T.dl, T.x, T.w, T.x, T.x, T.x, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.x, T.x, T.w, T.w, T.w, T.w, T.w, T.w, T.dl, T.dl, T.w, T.w, T.w, T.w, T.w, T.x, T.x, T.x, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.car, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x]
    ],
    offset: { x: 37, y: 29 }
  }),
  "startPositions": [{ "x": 47, "y": 50 }, { "x": 49, "y": 50 }],
  "treasures": { "44-40": 450, "44-41": 250, "44-43": 810, "44-44": 120, "44-45": 620, "44-46": 125, "52-46": 129, "52-45": 756, "52-44": 395, "52-43": 415, "52-42": 250, "52-41": 325, "52-40": 750, "40-35": 70000, "41-35": 8000, "42-35": 16000, "40-33": 22000, "42-33": 6000, "57-31": { "value": 5000, "containsKey": true }, "57-33": 32000, "54-34": 28000, "51-37": 26000, "40-32": 22000 },
  "cameras": [
    {
      "id": 1765236113989,
      "x": 52,
      "y": 35,
      "orientation": "right",
      "pattern": [
        [
          {
            "x": 53,
            "y": 35
          },
          {
            "x": 54,
            "y": 35
          }
        ],
        [
          {
            "x": 53,
            "y": 34
          }
        ],
        [
          {
            "x": 53,
            "y": 35
          },
          {
            "x": 54,
            "y": 35
          }
        ],
        [
          {
            "x": 53,
            "y": 34
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1765236132622,
      "x": 39,
      "y": 32,
      "orientation": "right",
      "pattern": [
        [
          {
            "x": 40,
            "y": 32
          },
          {
            "x": 41,
            "y": 32
          }
        ],
        [
          {
            "x": 40,
            "y": 31
          }
        ],
        [
          {
            "x": 40,
            "y": 32
          },
          {
            "x": 41,
            "y": 32
          }
        ],
        [
          {
            "x": 40,
            "y": 31
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1765236136462,
      "x": 39,
      "y": 34,
      "orientation": "right",
      "pattern": [
        [
          {
            "x": 40,
            "y": 34
          },
          {
            "x": 41,
            "y": 34
          }
        ],
        [
          {
            "x": 40,
            "y": 33
          }
        ],
        [
          {
            "x": 40,
            "y": 34
          },
          {
            "x": 41,
            "y": 34
          }
        ],
        [
          {
            "x": 40,
            "y": 33
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1765236159710,
      "x": 58,
      "y": 34,
      "orientation": "up",
      "pattern": [
        [
          {
            "x": 58,
            "y": 33
          },
          {
            "x": 58,
            "y": 32
          }
        ],
        [
          {
            "x": 57,
            "y": 33
          }
        ],
        [
          {
            "x": 58,
            "y": 33
          },
          {
            "x": 58,
            "y": 32
          }
        ],
        [
          {
            "x": 59,
            "y": 33
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1765236202016,
      "x": 42,
      "y": 38,
      "orientation": "up",
      "pattern": [
        [
          {
            "x": 42,
            "y": 37
          },
          {
            "x": 42,
            "y": 36
          }
        ],
        [
          {
            "x": 41,
            "y": 37
          }
        ],
        [
          {
            "x": 42,
            "y": 37
          },
          {
            "x": 42,
            "y": 36
          }
        ],
        [
          {
            "x": 43,
            "y": 37
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1765236228180,
      "x": 56,
      "y": 31,
      "orientation": "down",
      "pattern": [
        [
          {
            "x": 56,
            "y": 32
          },
          {
            "x": 56,
            "y": 33
          }
        ],
        [
          {
            "x": 57,
            "y": 32
          }
        ],
        [
          {
            "x": 56,
            "y": 32
          },
          {
            "x": 56,
            "y": 33
          }
        ],
        [
          {
            "x": 55,
            "y": 32
          }
        ]
      ],
      "period": 1
    }
  ],
  "guards": [
    {
      "id": 1765790406891,
      "name": "Herr Tresor",
      "patrolRoute": [],
      "x": 46,
      "y": 36,
      "patrolWaypoints": [
        {
          "x": 46,
          "y": 36
        },
        {
          "x": 46,
          "y": 34
        },
        {
          "x": 48,
          "y": 34
        },
        {
          "x": 48,
          "y": 32
        },
        {
          "x": 44,
          "y": 32
        },
        {
          "x": 44,
          "y": 37
        },
        {
          "x": 38,
          "y": 37
        },
        {
          "x": 38,
          "y": 30
        },
        {
          "x": 42,
          "y": 30
        }
      ],
      "patrolIndex": 0,
      "orientation": "down",
      "status": "patrolling",
      "time_to_next_move": 1,
      "hasKey": true
    },
    {
      "id": 1765790426975,
      "name": "Mr Circle",
      "patrolRoute": [],
      "x": 53,
      "y": 37,
      "patrolWaypoints": [
        {
          "x": 53,
          "y": 37
        },
        {
          "x": 55,
          "y": 36
        },
        {
          "x": 55,
          "y": 32
        },
        {
          "x": 52,
          "y": 32
        },
        {
          "x": 53,
          "y": 32
        },
        {
          "x": 53,
          "y": 37
        }
      ],
      "patrolIndex": 0,
      "orientation": "down",
      "status": "patrolling",
      "time_to_next_move": 1,
      "hasKey": true
    }
  ],
  "pressurePlates": [
    {
      "x": 42,
      "y": 32
    },
    {
      "x": 41,
      "y": 32
    },
    {
      "x": 41,
      "y": 33
    },
    {
      "x": 40,
      "y": 34
    },
    {
      "x": 41,
      "y": 34
    },
    {
      "x": 42,
      "y": 34
    }
  ],
  "primaryTarget": { "x": 40, "y": 35 },
  "secondaryTarget": { "x": 57, "y": 31 }
};


const s04_galerie_dor: Scenario = {
  ...s04_galerie_dor_org,
  "id": "s04_galerie_dor",
  "name": "scenario.s04_galerie_dor.name",
  "description": "scenario.s04_galerie_dor.desc",
  "initialMessage": "scenario.s04_galerie_dor.initialMessage",
  "reputationRequired": 10,
  "cameras": s04_galerie_dor_org.cameras.map(cam => ({ ...cam, hideInPlanningAfter: 15 })),
};


const s05_downtown_bank: Scenario = {
  ...s05_downtown_bank_org,
  "id": "s05_downtown_bank",
  "name": "scenario.s05_downtown_bank.name",
  "description": "scenario.s05_downtown_bank.desc",
  "initialMessage": "scenario.s05_downtown_bank.initialMessage",
  "reputationRequired": 15,
  "guards": [
    ...s05_downtown_bank_org.guards.map(g => ({ ...g, hidePatrolInPlanning: true })),
    {
      "id": 1765790426999,
      "name": "The Enforcer",
      "x": 50,
      "y": 40,
      "patrolRoute": [],
      "patrolWaypoints": [
        { "x": 50, "y": 40 },
        { "x": 46, "y": 40 }
      ],
      "patrolIndex": 0,
      "orientation": "left",
      "status": "patrolling",
      "time_to_next_move": 1,
      "hiddenInPlanning": true
    }
  ]
};


const s06_penthouse: Scenario = {
  "id": "s06_penthouse",
  "name": "scenario.s06_penthouse.name",
  "description": "scenario.s06_penthouse.desc",
  "initialMessage": "scenario.s06_penthouse.initialMessage",
  "tier": 2,
  "reputationRequired": 17,
  "reputationRewards": { "base": 7, "stealth": 3, "speed": 1, "fullLoot": 1 },
  "prerequisiteScenarioId": "s03_midnight_auction",
  "speedRunTime": 130,
  "map": createFullMap({
    data: [
      [T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.ccp, T.x, T.f, T.w],
      [T.w, T.f, T.f, T.f, T.f, T.w, T.f, T.f, T.f, T.f, T.w, T.f, T.f, T.f, T.f, T.w, T.ccp, T.x, T.f, T.w],
      [T.w, T.f, T.sofa, T.f, T.stat, T.cm, T.f, T.stat, T.stat, T.f, T.w, T.f, T.desk, T.desk, T.f, T.w, T.desk, T.col, T.f, T.w],
      [T.w, T.f, T.plant, T.f, T.f, T.dc, T.f, T.f, T.f, T.f, T.dc, T.f, T.f, T.f, T.f, T.dl, T.f, T.f, T.f, T.w],
      [T.w, T.f, T.f, T.f, T.stat, T.w, T.f, T.f, T.f, T.f, T.w, T.f, T.stata, T.f, T.stata, T.w, T.f, T.f, T.f, T.w],
      [T.w, T.w, T.dc, T.cm, T.w, T.w, T.f, T.desk, T.f, T.f, T.ab, T.w, T.w, T.vd, T.cm, T.cm, T.w, T.w, T.w, T.w],
      [T.w, T.f, T.f, T.f, T.w, T.f, T.f, T.f, T.f, T.f, T.f, T.w, T.f, T.f, T.f, T.f, T.f, T.f, T.ap, T.w],
      [T.w, T.s, T.f, T.wc, T.w, T.f, T.cm, T.f, T.f, T.f, T.f, T.w, T.f, T.dica, T.f, T.dica, T.f, T.gba, T.f, T.cm],
      [T.w, T.w, T.w, T.w, T.w, T.f, T.sc, T.f, T.sc, T.f, T.f, T.w, T.f, T.f, T.f, T.f, T.f, T.f, T.apa, T.w],
      [T.x, T.x, T.x, T.x, T.w, T.w, T.w, T.dl, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w, T.w],
      [T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x],
      [T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.car, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x, T.x]
    ],
    offset: { x: 32, y: 23 }
  }),
  "startPositions": [{ "x": 38, "y": 35 }, { "x": 40, "y": 35 }],
  "treasures": { "45-30": 18000, "47-30": 0, "33-30": { "value": 8000, "containsKey": true }, "39-25": 5000, "40-25": 8000, "36-25": 10000, "36-27": 12000, "44-27": 1000, "46-27": 1000, "49-30": 54000, "50-29": 8000, "50-31": 17500 },
  "cameras": [
    {
      "id": 1,
      "x": 50,
      "y": 28,
      "orientation": "down",
      "pattern": [
        [
          {
            "x": 50,
            "y": 29
          },
          {
            "x": 49,
            "y": 29
          }
        ],
        [
          {
            "x": 50,
            "y": 30
          }
        ],
        [
          {
            "x": 50,
            "y": 29
          },
          {
            "x": 51,
            "y": 29
          }
        ],
        [
          {
            "x": 50,
            "y": 30
          }
        ]
      ],
      "period": 2
    },
    {
      "id": 1766012130279,
      "x": 38,
      "y": 30,
      "orientation": "right",
      "pattern": [
        [
          {
            "x": 39,
            "y": 30
          },
          {
            "x": 40,
            "y": 30
          }
        ],
        [
          {
            "x": 39,
            "y": 29
          }
        ],
        [
          {
            "x": 39,
            "y": 30
          },
          {
            "x": 40,
            "y": 30
          }
        ],
        [
          {
            "x": 39,
            "y": 29
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1766012140890,
      "x": 35,
      "y": 28,
      "orientation": "left",
      "pattern": [
        [
          {
            "x": 34,
            "y": 28
          },
          {
            "x": 33,
            "y": 28
          }
        ],
        [
          {
            "x": 34,
            "y": 29
          }
        ],
        [
          {
            "x": 34,
            "y": 28
          },
          {
            "x": 33,
            "y": 28
          }
        ],
        [
          {
            "x": 34,
            "y": 27
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1766012148656,
      "x": 37,
      "y": 25,
      "orientation": "down",
      "pattern": [
        [
          {
            "x": 37,
            "y": 26
          },
          {
            "x": 37,
            "y": 27
          }
        ],
        [
          {
            "x": 38,
            "y": 26
          }
        ],
        [
          {
            "x": 37,
            "y": 26
          },
          {
            "x": 37,
            "y": 27
          }
        ],
        [
          {
            "x": 36,
            "y": 26
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1766012152567,
      "x": 46,
      "y": 28,
      "orientation": "left",
      "pattern": [
        [
          {
            "x": 45,
            "y": 28
          },
          {
            "x": 44,
            "y": 28
          }
        ],
        [
          {
            "x": 45,
            "y": 29
          }
        ],
        [
          {
            "x": 45,
            "y": 28
          },
          {
            "x": 44,
            "y": 28
          }
        ],
        [
          {
            "x": 45,
            "y": 27
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1766012154590,
      "x": 51,
      "y": 30,
      "orientation": "left",
      "pattern": [
        [
          {
            "x": 50,
            "y": 30
          },
          {
            "x": 49,
            "y": 30
          }
        ],
        [
          {
            "x": 50,
            "y": 31
          }
        ],
        [
          {
            "x": 50,
            "y": 30
          },
          {
            "x": 49,
            "y": 30
          }
        ],
        [
          {
            "x": 50,
            "y": 29
          }
        ]
      ],
      "period": 1
    },
    {
      "id": 1766012171140,
      "x": 47,
      "y": 28,
      "orientation": "down",
      "pattern": [
        [
          {
            "x": 47,
            "y": 29
          },
          {
            "x": 47,
            "y": 30
          }
        ],
        [
          {
            "x": 48,
            "y": 29
          }
        ],
        [
          {
            "x": 47,
            "y": 29
          },
          {
            "x": 47,
            "y": 30
          }
        ],
        [
          {
            "x": 46,
            "y": 29
          }
        ]
      ],
      "period": 1
    }
  ],
  "guards": [
    {
      "id": 1765794034648,
      "name": "Mr. Strong",
      "patrolRoute": [],
      "x": 40,
      "y": 28,
      "patrolWaypoints": [
        {
          "x": 40,
          "y": 28
        }
      ],
      "patrolIndex": 0,
      "orientation": "down",
      "status": "patrolling",
      "time_to_next_move": 1,
      "isStationary": true,
      "panSequence": [
        "down",
        "left",
        "up",
        "right"
      ],
      "panIndex": 0,
      "panTimer": 3,
      "panPeriod": 2,
      "hasKey": true
    },
    {
      "id": 1765794512914,
      "name": "The Boss",
      "patrolRoute": [],
      "x": 35,
      "y": 26,
      "patrolWaypoints": [
        {
          "x": 35,
          "y": 26
        },
        {
          "x": 48,
          "y": 26
        }
      ],
      "patrolIndex": 0,
      "orientation": "down",
      "status": "patrolling",
      "time_to_next_move": 1,
      "hasKey": true
    }
  ],
  "primaryTarget": { "x": 47, "y": 30 },
  "secondaryTarget": { "x": 36, "y": 27 }
};



export type ScenarioId = "s00_tutorial" | "s01_starter_job" | "s02_diamond_dogs" | "s03_midnight_auction" | "s04_galerie_dor"
  | 's05_downtown_bank'
  | 's06_penthouse'
  ;

export const scenarios: Record<ScenarioId | string, Scenario> = {
  s00_tutorial,
  s01_starter_job,
  s02_diamond_dogs,
  s03_midnight_auction,
  s04_galerie_dor,
  s05_downtown_bank,
  s06_penthouse,
};

export const scenarioOrder: ScenarioId[] = [
  "s00_tutorial",
  "s01_starter_job",
  "s02_diamond_dogs",
  "s03_midnight_auction",
  's04_galerie_dor',
  's05_downtown_bank',
  's06_penthouse',
];