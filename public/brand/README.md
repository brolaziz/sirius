# Sirius mascot and identity

`sirius-mascot-v1.png` is a transparent 3D-rendered **illustration**, not a rigged GLB model. The user supplied the Sirius character identity and authorized its use, animation, landing redesign and logo replacement. Created with the built-in Imagegen tool on 2026-10-08; original output preserved outside the repository.

The cream hood, indigo face, purple scarf and smiling gold star define the identity. `components/brand/logo.tsx` provides a small vector interpretation for navigation; `app/icon.svg` provides the tab icon. Decorative four-point `SiriusStar` accents remain separate from the new logo.

Final built-in edit prompt:

> Use case: background-extraction. Asset type: Sirius web dashboard mascot, full-body transparent cutout. Edit target: attached Sirius brand character. Remove only the white background and floor/background shadow, output true alpha transparency with clean antialiased edges. Preserve exact character identity, pose, proportions, cream rounded wizard hood/body, dark indigo face with two white eyes and smiling mouth, purple scarf with flowing tail and tiny stars, dangling purple bead and gold star on hat, gold smiling star held in both hands. Preserve this beautiful softly lit 3D clay render, all details and colors. Full character including hat charm and scarf tail fully visible, centered with modest transparent padding. No text, no watermark, no added objects, no checkerboard painted into image. This is a raster 3D-rendered illustration, not a new character.

`transparent_background=true`. The asset is served through Next Image with explicit viewport sizes. No competitor illustrations, photographs or videos are bundled.

Motion: six-second vertical float, mild pointer tilt, breathing shadow and star twinkles. All loops pause outside the viewport or in a hidden document. The mascot pause button persists its preference; OS reduced-motion disables transforms and loops. Text and actions are always readable without animation. The control deliberately describes mascot motion; older section scroll reveals are independent.

A true rotatable/rigged character would require a separate modeling, texturing and rigging stage. This implementation does not claim to provide one.
