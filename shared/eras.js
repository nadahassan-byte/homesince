/**
 * Home since - era definitions.
 *
 * One entry per "classic betterhomes ad". The year somebody moved to Dubai
 * picks the ad; the ad decides both the photographic look applied to their
 * selfie and the fixed poster design drawn around it.
 *
 * This file is loaded by the browser (as an ES module) and by the Node
 * server, so it must stay dependency-free.
 */

export const BRAND = {
  name: 'betterhomes',
  founded: 1986,
  hashtag: '#yourbhomestory',
};

export const ERAS = [
  {
    id: '1980s',
    label: '1980s',
    adName: 'The Classified',
    adYear: 1986,
    from: 1900,
    to: 1989,
    blurb: 'Soft-focus studio portrait, warm black and white, printed on newsprint.',
    lookShort: '1980s · newsprint classified',
    // Canvas grading for the prototype (no-AI) path.
    grade: {
      filter: 'grayscale(1) sepia(0.42) contrast(1.12) brightness(1.06)',
      bloom: 0.42,
      bloomBlur: 14,
      grain: 0.1,
      vignette: 0.5,
      tint: [168, 134, 92, 0.1],
      halftone: 108,
    },
    // Fixed poster design.
    template: 'classified',
    palette: {
      paper: '#e9e2d2',
      ink: '#241f1a',
      accent: '#8a1f1a',
      muted: '#6d6253',
    },
    headline: 'A BETTER WAY HOME.',
    kicker: 'THE PROPERTY PAGES',
    body: [
      'Villas and apartments across the new',
      'neighbourhoods of Dubai. Long lets,',
      'short lets, and a kettle on by Friday.',
    ],
    signoff: 'betterhomes · Dubai · est. 1986',
    // Prompt fragments for the real AI generation.
    prompt: {
      scene:
        'a 1986 Dubai newspaper property advertisement, photographed in a warm ' +
        'soft-focus studio with a single key light',
      look:
        'warm monochrome black and white, soft focus, gentle halation around ' +
        'highlights, visible newsprint halftone texture, 1980s studio portrait',
      wardrobe: 'simple 1980s-appropriate smart clothing',
    },
  },
  {
    id: '1990s',
    label: '1990s',
    adName: 'The Brochure',
    adYear: 1994,
    from: 1990,
    to: 1999,
    blurb: 'Flash film photo, rich colour and a little grain, on a glossy brochure.',
    lookShort: '1990s · glossy brochure',
    grade: {
      filter: 'saturate(1.35) contrast(1.18) brightness(1.04)',
      bloom: 0.16,
      bloomBlur: 8,
      grain: 0.16,
      vignette: 0.55,
      tint: [255, 176, 92, 0.08],
    },
    template: 'brochure',
    palette: {
      paper: '#0d3b40',
      ink: '#f6f1e4',
      accent: '#c9a227',
      muted: '#9fb7b4',
    },
    headline: 'Your place\nin the sun.',
    kicker: 'BETTERHOMES · DUBAI',
    body: [
      'A home by the creek, the coast',
      'or the new roads out west.',
    ],
    signoff: 'Ask for the 1994 portfolio',
    prompt: {
      scene:
        'a mid-1990s glossy Dubai property brochure cover, shot on 35mm film ' +
        'with direct on-camera flash',
      look:
        'rich saturated colour film, slight grain, bright flash falloff into a ' +
        'darker background, 1990s brochure photography',
      wardrobe: 'smart 1990s-appropriate clothing',
    },
  },
  {
    id: '2000s',
    label: '2000s',
    adName: 'The Billboard',
    adYear: 2006,
    from: 2000,
    to: 2009,
    blurb: 'Early digital camera, bright and a little flat, blown up on Sheikh Zayed Road.',
    lookShort: '2000s · roadside billboard',
    grade: {
      filter: 'saturate(1.12) contrast(0.92) brightness(1.12)',
      bloom: 0.1,
      bloomBlur: 6,
      grain: 0.07,
      vignette: 0.18,
      tint: [120, 170, 205, 0.09],
    },
    template: 'billboard',
    palette: {
      paper: '#bfdcec',
      ink: '#12303f',
      accent: '#e8615c',
      muted: '#5d7f90',
    },
    headline: 'LIVE THE\nNEW DUBAI',
    kicker: 'NOW LEASING',
    body: ['Marina · Ranches · Greens · JLT'],
    signoff: 'betterhomes.com',
    prompt: {
      scene:
        'a 2006 roadside billboard advertisement beside Sheikh Zayed Road in Dubai',
      look:
        'early digital compact camera look, bright and slightly flat contrast, ' +
        'cool daylight white balance, mild digital sharpening',
      wardrobe: 'smart casual 2000s clothing',
    },
  },
  {
    id: '2010s',
    label: '2010s',
    adName: 'The Cover',
    adYear: 2015,
    from: 2010,
    to: 2019,
    blurb: 'Clean, modern, natural colour, on the cover of the property magazine.',
    lookShort: '2010s · magazine cover',
    grade: {
      filter: 'saturate(1.06) contrast(1.08) brightness(1.02)',
      bloom: 0.08,
      bloomBlur: 10,
      grain: 0.04,
      vignette: 0.26,
      tint: [255, 236, 214, 0.05],
    },
    template: 'cover',
    palette: {
      paper: '#f4efe6',
      ink: '#14202b',
      accent: '#e8615c',
      muted: '#7c8a93',
    },
    headline: 'HOME\nSINCE',
    kicker: 'THE DUBAI ISSUE',
    body: [
      'The handover diaries',
      'Where the city moved next',
      'Twelve keys, twelve stories',
    ],
    signoff: 'betterhomes',
    prompt: {
      scene: 'a 2015 glossy property magazine cover shot in natural window light',
      look:
        'clean modern digital photography, natural colour, soft even light, ' +
        'shallow depth of field, editorial cover portrait',
      wardrobe: 'contemporary smart casual clothing',
    },
  },
  {
    id: '2020s',
    label: '2020s on',
    adName: 'The Post',
    adYear: 2024,
    from: 2020,
    to: 2100,
    blurb: 'Phone camera, true colour, straight to the feed.',
    lookShort: '2020s · social post',
    grade: {
      filter: 'saturate(1.1) contrast(1.05) brightness(1.03)',
      bloom: 0.05,
      bloomBlur: 8,
      grain: 0.03,
      vignette: 0.14,
      tint: [255, 255, 255, 0],
    },
    template: 'post',
    palette: {
      paper: '#ffffff',
      ink: '#14202b',
      accent: '#e8615c',
      muted: '#8b949b',
    },
    headline: 'Got the keys.',
    kicker: 'betterhomes',
    body: ['Tap the link for the full tour.'],
    signoff: '#yourbhomestory',
    prompt: {
      scene: 'a 2024 social media property post, shot on a modern phone camera',
      look: 'crisp modern phone photography, true to life colour, bright and clean',
      wardrobe: 'present day everyday clothing',
    },
  },
];

/** The ad that belongs to a given move-in year. */
export function eraForYear(year) {
  const y = Number(year);
  if (!Number.isFinite(y)) return ERAS[ERAS.length - 1];
  return ERAS.find((era) => y >= era.from && y <= era.to) || ERAS[ERAS.length - 1];
}

export function eraById(id) {
  return ERAS.find((era) => era.id === id) || null;
}

/** Years we accept on the form. */
export const YEAR_MIN = 1960;
export const YEAR_MAX = new Date().getFullYear();
