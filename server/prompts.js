import { BRAND } from '../shared/eras.js';

/**
 * Build the instruction we hand to the image model.
 *
 * Two rules matter and are repeated on purpose:
 *  1. keep the person's likeness - this is their photo, not a new face;
 *  2. do not render the frame, plaque or headline - the poster design is
 *     drawn by us afterwards, so the model only produces the photograph.
 */
export function buildPrompt({ era, community, year }) {
  const place = community ? `in ${community}, Dubai` : 'in Dubai';

  return [
    `Restyle this photograph of a real person so they appear as the model in ${era.prompt.scene}.`,
    '',
    'Keep the person instantly recognisable: same face, same bone structure,',
    'same skin tone, same hair, same approximate age, same expression.',
    'Do not beautify, slim, lighten or change their features. This is their',
    'own photograph being restyled, not a new person.',
    '',
    `Photographic treatment: ${era.prompt.look}.`,
    `Wardrobe: ${era.prompt.wardrobe}.`,
    `Setting: a believable ${era.adYear} Dubai residential scene ${place},`,
    'warm and ordinary rather than luxury, as if photographed for a',
    `${BRAND.name} property advertisement of that year.`,
    '',
    'Framing: head and shoulders to waist up, person facing camera,',
    'generous clean space around the subject.',
    '',
    'Do not add any text, lettering, logos, watermarks, borders, picture',
    'frames or plaques. Return the photograph only.',
    '',
    `Era: ${era.label}. Move-in year: ${year}.`,
  ].join('\n');
}

/** A short, human-readable credit line shown under the finished poster. */
export function creditLine({ era, provider }) {
  const how = provider === 'none' ? 'era filter preview' : `AI generated · ${provider}`;
  return `${era.lookShort} · ${how}`;
}
