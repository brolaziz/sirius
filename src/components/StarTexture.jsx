/**
 * Rub el hizb — the eight-pointed star from Uzbek tilework.
 * House rule: this appears in exactly two places, the dashboard hero texture
 * and the saved-word marker. Do not reach for it anywhere else.
 */
const PATH = 'M32 4 44 16 60 16 60 32 72 44 60 56 60 72 44 72 32 84 20 72 4 72 4 56 -8 44 4 32 4 16 20 16Z'

export function StarMark({ size = 16, color = 'var(--gold)', title }) {
  return (
    <svg
      width={size} height={size} viewBox="-10 2 84 84"
      role={title ? 'img' : 'presentation'} aria-hidden={title ? undefined : 'true'}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <path d={PATH} fill={color} />
    </svg>
  )
}

export default function StarTexture({ opacity = 0.06, color = '#fff' }) {
  return (
    <svg className="startexture" aria-hidden="true" focusable="false" style={{ opacity }}>
      <defs>
        <pattern id="sirius-star" width="72" height="72" patternUnits="userSpaceOnUse">
          <path d={PATH} fill={color} transform="translate(6 2) scale(0.72)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#sirius-star)" />
    </svg>
  )
}
