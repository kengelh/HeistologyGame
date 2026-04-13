/**
 * @file CharacterIcons.tsx
 * @description
 * This file maps character names to their corresponding icon components.
 */

import * as React from 'react';
import { PlayerIcon } from './Icons';

export const CharacterIcons: Record<string, React.FC<{ className?: string, isActive?: boolean }>> = {
    'Ivan': PlayerIcon,
    'Theo': PlayerIcon,
    'Lester': PlayerIcon,
    'Sandra': PlayerIcon,
    'Earl': PlayerIcon,
    'Dominic': PlayerIcon,
    'Lou I.': PlayerIcon,
    'Dan T.': PlayerIcon,
    'Erich I.': PlayerIcon,
    'Tim S.': PlayerIcon,
    'Linus E.': PlayerIcon,
    'Sara D.': PlayerIcon,
    'Luitpold L.': PlayerIcon,
    'Sofia S.': PlayerIcon,
    'Damian D.': PlayerIcon,
    'Elena E.': PlayerIcon,
    'Ivy I.': PlayerIcon,
    'Tomas T.': PlayerIcon,
    'Edilberto S.': PlayerIcon,
    'Leonardo E.': PlayerIcon,
    'Dudley T.': PlayerIcon,
    'Ingo D.': PlayerIcon,
};
