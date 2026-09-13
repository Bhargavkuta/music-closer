import { NoteLetter } from './notes';
import { ChordDefinition, ScaleType } from '../types/music';
import { getChord, getDiatonicChords } from './chords';

export interface ChordSuggestion {
  chord: ChordDefinition;
  symbol: string; // e.g. "G", "F", "Am"
  title: string;  // e.g. "Try G Major"
  reason: string; // e.g. "Completes the classic pop progression back to tonic"
  feel: string;   // e.g. "Resolution", "Uplift", "Emotional Twist"
}

/**
 * Suggests the next chords based on progression history and current key/scale.
 * Fully deterministic and rule-based as required by Master Prompt Section 19.
 */
export function suggestNextChords(
  history: string[], // list of recent chord symbols e.g. ['C', 'Am', 'F']
  rootKey: NoteLetter = 'C',
  scaleType: ScaleType = 'major'
): ChordSuggestion[] {
  const diatonic = getDiatonicChords(rootKey, scaleType);
  if (diatonic.length === 0) return [];

  // Helper to find a diatonic chord by degree or symbol
  const getByDegree = (deg: string) => diatonic.find(d => d.degree === deg);

  const cleanHistory = history.map(s => s.trim());
  const len = cleanHistory.length;
  const lastChord = len > 0 ? cleanHistory[len - 1] : null;
  const secondLast = len > 1 ? cleanHistory[len - 2] : null;

  const suggestions: ChordSuggestion[] = [];

  // Rule 1: Specific Master Prompt Example: C -> Am -> F -> suggests G (I -> vi -> IV -> V)
  if (
    len >= 3 &&
    cleanHistory[len - 3].startsWith('C') &&
    cleanHistory[len - 2].startsWith('Am') &&
    cleanHistory[len - 1].startsWith('F')
  ) {
    const gChord = getChord('G', 'major');
    suggestions.push({
      chord: gChord,
      symbol: 'G',
      title: 'Try G Major',
      reason: 'Completes the iconic 50s doo-wop / pop cadence back to C.',
      feel: 'Classic Pop Turnaround'
    });

    const cChord = getChord('C', 'major');
    suggestions.push({
      chord: cChord,
      symbol: 'C',
      title: 'Try C Major',
      reason: 'Direct plagal resolution back to home tonic.',
      feel: 'Hymn / Gospel Release'
    });

    return suggestions;
  }

  // Rule 2: Axis Progression: I -> V -> vi -> suggests IV (e.g. C -> G -> Am -> F)
  if (
    len >= 2 &&
    secondLast?.startsWith('G') &&
    lastChord?.startsWith('Am')
  ) {
    const fChord = getChord('F', 'major');
    suggestions.push({
      chord: fChord,
      symbol: 'F',
      title: 'Try F Major',
      reason: 'The celebrated Axis progression heard in hundreds of legendary anthems.',
      feel: 'Epic Uplift'
    });

    const emChord = getChord('E', 'minor');
    suggestions.push({
      chord: emChord,
      symbol: 'Em',
      title: 'Try E Minor',
      reason: 'Moody step down into mediant reflection.',
      feel: 'Deep Melancholy'
    });

    return suggestions;
  }

  // Rule 3: vi -> IV -> I -> suggests V (e.g. Am -> F -> C -> G)
  if (
    len >= 2 &&
    secondLast?.startsWith('F') &&
    lastChord?.startsWith('C')
  ) {
    const gChord = getChord('G', 'major');
    suggestions.push({
      chord: gChord,
      symbol: 'G',
      title: 'Try G Major',
      reason: 'Adds decisive forward momentum before repeating the verse.',
      feel: 'Driving Momentum'
    });
  }

  // Rule 4: ii -> V -> suggests I (Jazz & standard pop cadence e.g. Dm -> G -> C)
  if (
    lastChord?.startsWith('G') &&
    secondLast?.startsWith('Dm')
  ) {
    const cChord = getChord('C', 'major');
    suggestions.push({
      chord: cChord,
      symbol: 'C',
      title: 'Try C Major',
      reason: 'Perfect authentic cadence resolving all tension home.',
      feel: 'Satisfying Home'
    });
  }

  // Rule 5: Generic functional harmony based on the last played chord
  const cTonic = getByDegree('I') || diatonic[0];
  const gDom = getByDegree('V') || diatonic[4];
  const fSub = getByDegree('IV') || diatonic[3];
  const amRel = getByDegree('vi') || diatonic[5];
  const dmSup = getByDegree('ii') || diatonic[1];

  if (!lastChord || lastChord === cTonic.symbol) {
    // Starting on Tonic -> suggest vi (emotion), IV (lift), or V (drive)
    if (amRel) {
      suggestions.push({
        chord: getChord(amRel.root, amRel.type),
        symbol: amRel.symbol,
        title: `Try ${amRel.name}`,
        reason: 'Shifts from bright tonic into rich emotional minor territory.',
        feel: 'Emotional Depth'
      });
    }
    if (fSub) {
      suggestions.push({
        chord: getChord(fSub.root, fSub.type),
        symbol: fSub.symbol,
        title: `Try ${fSub.name}`,
        reason: 'Opens up the song with a warm, uplifting subdominant lift.',
        feel: 'Uplifting Lift'
      });
    }
    if (gDom) {
      suggestions.push({
        chord: getChord(gDom.root, gDom.type),
        symbol: gDom.symbol,
        title: `Try ${gDom.name}`,
        reason: 'Builds immediate musical tension that wants to resolve.',
        feel: 'Dynamic Drive'
      });
    }
  } else if (lastChord.includes(fSub.symbol) || lastChord.includes('F')) {
    // On Subdominant IV -> suggest V (standard) or I (plagal)
    if (gDom) {
      suggestions.push({
        chord: getChord(gDom.root, gDom.type),
        symbol: gDom.symbol,
        title: `Try ${gDom.name}`,
        reason: 'Steps up to the dominant tension for a soaring climax.',
        feel: 'Climactic Tension'
      });
    }
    if (cTonic) {
      suggestions.push({
        chord: getChord(cTonic.root, cTonic.type),
        symbol: cTonic.symbol,
        title: `Try ${cTonic.name}`,
        reason: 'Plagal "Amen" cadence creating peaceful release.',
        feel: 'Peaceful Resolution'
      });
    }
  } else if (lastChord.includes(gDom.symbol) || lastChord.includes('G')) {
    // On Dominant V -> suggest I (home) or vi (deceptive cadence)
    if (cTonic) {
      suggestions.push({
        chord: getChord(cTonic.root, cTonic.type),
        symbol: cTonic.symbol,
        title: `Try ${cTonic.name}`,
        reason: 'The gold standard resolution back to home key.',
        feel: 'Complete Resolution'
      });
    }
    if (amRel) {
      suggestions.push({
        chord: getChord(amRel.root, amRel.type),
        symbol: amRel.symbol,
        title: `Try ${amRel.name}`,
        reason: 'Deceptive cadence: surprises the listener with poignant minor color.',
        feel: 'Surprise & Longing'
      });
    }
  } else {
    // Fallback: provide diatonic options
    if (cTonic) {
      suggestions.push({
        chord: getChord(cTonic.root, cTonic.type),
        symbol: cTonic.symbol,
        title: `Try ${cTonic.name}`,
        reason: 'Resolves back to home key.',
        feel: 'Resolution'
      });
    }
    if (gDom) {
      suggestions.push({
        chord: getChord(gDom.root, gDom.type),
        symbol: gDom.symbol,
        title: `Try ${gDom.name}`,
        reason: 'Energizes the progression towards the turnaround.',
        feel: 'Energy'
      });
    }
    if (dmSup) {
      suggestions.push({
        chord: getChord(dmSup.root, dmSup.type),
        symbol: dmSup.symbol,
        title: `Try ${dmSup.name}`,
        reason: 'Smooth pre-dominant bridge leading towards cadence.',
        feel: 'Smooth Motion'
      });
    }
  }

  return suggestions.slice(0, 3);
}
