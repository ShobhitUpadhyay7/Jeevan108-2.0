# Jeevan 108 Design System

This document defines the visual language of the current website so the same look and feel can be replicated in another product using the exact home-page image and the same layout logic.

## 1. Design Intent

The site should feel like a modern healthcare service platform: calm, trustworthy, approachable, and slightly premium. The look is bright and clean rather than clinical. The core style is built from soft rounded shapes, teal accents, generous spacing, and large friendly typography.

The homepage is the primary design reference. It combines a full-screen hero image on desktop, a custom mobile hero, a pill-shaped navigation bar, bold trust sections, and service cards with strong color blocking.

## 2. Brand Personality

- Trustworthy
- Human and caring
- Clear and direct
- Modern but not overly tech-heavy
- Local-service friendly, with a hospital-at-home tone

## 3. Overall Visual Direction

- Backgrounds are mostly white or very light tinted surfaces.
- Primary accent color is teal.
- Secondary supporting tone is a soft rose tint used in the navbar container.
- Shapes are rounded, friendly, and soft-edged.
- Shadows are light and diffused, never harsh.
- The design avoids dense layouts; whitespace is part of the identity.

## 4. Color System

Use these as the canonical color tokens for the website.

### Core Colors

- Primary Teal: #14b8a6 to #0f766e
- Teal Light: #99f6e4
- Teal Background: #ccfbf1
- Soft Rose Background: #fff1f2
- White: #ffffff
- Neutral Text: #111827
- Secondary Text: #4b5563
- Muted Text: #6b7280
- Border Gray: #d1d5db
- Surface Gray: #f3f4f6

### Usage Rules

- Use teal for calls to action, key highlights, icons, badges, and numeric emphasis.
- Use white for primary text-on-color sections and elevated cards.
- Use rose only as a soft background container, not as a dominant brand color.
- Use gray for borders, disabled states, and supporting copy.

## 5. Typography

The current interface uses a bold, modern sans-serif style with heavy headline weight and clear hierarchy.

### Typography Rules

- Headlines: extra-bold, large, tight leading.
- Supporting copy: regular or medium weight, easy to scan.
- Labels and buttons: bold and concise.
- Numbers and stats: very bold and visually prominent.

### Hierarchy

- H1: very large, bold, usually split across two lines.
- H2: large section headline, often centered.
- Body text: medium gray, comfortable reading width.
- Microcopy: small, muted, used for helper text and metadata.

### Tone

- Keep copy short and reassuring.
- Avoid technical jargon unless the user is already in a logged-in flow.

## 6. Spacing and Layout

- Use generous padding on all major sections.
- Center the main content in a wide container.
- Prefer open layouts over boxed, stacked compositions.
- Keep section spacing large enough to make each block feel distinct.

### Container Behavior

- Maximum content width should sit in the 1100px to 1280px range depending on section.
- Hero image and service blocks can expand edge to edge.
- Inner content should be centered and aligned to a clear grid.

## 7. Shape Language

- Navbars and buttons use very rounded pill shapes.
- Service cards use rounded rectangles with slightly softened corners.
- Trust stats are circular elements.
- Profile images are circular.
- Inputs and cards should feel soft, approachable, and touch-friendly.

## 8. Shadow and Elevation

- Shadows are soft, subtle, and slightly diffused.
- The navbar and floating elements have the strongest shadow treatment.
- Cards use light elevation with hover growth rather than aggressive contrast.
- Avoid heavy drop shadows or sharp outlines.

## 9. Homepage Structure

The homepage should always read in this order:

1. Hero section with navigation overlaid
2. Trust/statistics section
3. Service cards section

### 9.1 Hero Section

The hero is the visual anchor of the brand.

#### Desktop Hero

- Full viewport height hero area.
- Exact home-page image is used as the full-bleed background.
- Image should fill the entire section and remain the central focus.
- Navigation is placed above the hero, slightly detached from the top edge.
- The hero is mostly visual; it does not rely on heavy text overlays on desktop.

#### Mobile Hero

- The desktop image is replaced by a custom mobile composition.
- A centered circular healthcare icon is used above the headline.
- The headline is bold, stacked, and centered.
- CTA buttons are stacked vertically.
- A trust line appears near the bottom to reinforce confidence.

#### Hero Content Tone

- The headline should communicate home-based healthcare.
- Supporting text should emphasize 24/7 availability and certified professionals.
- Primary CTA should direct to browsing providers.
- Secondary CTA should direct to professional application or sign-up.

### 9.2 Navigation Bar

The navbar is one of the strongest visual identifiers in the current design.

#### Desktop Navbar

- Centered, pill-shaped container.
- Soft rose background.
- Rounded edges on all sides.
- Logo on the left, navigation links in the middle, auth controls on the right.
- Active navigation state uses teal fill with white text.
- Inactive links are dark, bold, and become teal on hover.

#### Mobile Navbar

- Logo on the left.
- Login/logout action on the right.
- Hamburger icon opens a dropdown menu.
- Dropdown uses the same soft rose surface and rounded corners.

#### Logo Treatment

- The wordmark is lowercase style: jeevan108.
- The number 108 is emphasized in teal.
- The logo should feel bold and compact, not decorative.

### 9.3 Trust / Why Choose Us Section

This section presents proof points as large circular badges.

- Section title is oversized and centered.
- The headline is split into two lines for emphasis.
- Stats are displayed as equal-size circles.
- Most circles are white with gray borders.
- One circle uses a teal-tinted fill as a visual highlight.
- Each circle contains a large metric and a smaller label.

### 9.4 Services Section

This section introduces the three core service categories.

- Use a centered heading.
- Show three cards in a row on desktop.
- Stack cards on smaller screens.
- Each card has a teal background with white text.
- Each card includes an icon, title, description, feature list, and a button.
- Feature lists use short bullets and should feel readable.
- The button should be muted gray rather than bright teal so the card remains balanced.

## 10. Component Styling Rules

### Buttons

- Primary buttons: teal background, white text, bold font, rounded pill or rounded rectangle.
- Secondary buttons: white background with teal text or border.
- Disabled buttons: gray background, muted text, non-interactive cursor.
- Hover states should darken or slightly shift color, not animate heavily.

### Cards

- Default cards should be white with light borders.
- Card hover states can increase shadow and border contrast slightly.
- Use clear internal padding and spacing between title, body, and actions.

### Badges

- Use small rounded pill badges for role labeling and auth states.
- Badge colors should communicate category without becoming noisy.

### Icons

- Use simple line icons or flat service icons.
- Keep icon treatment consistent in size and stroke weight.
- Health-themed icons should remain friendly and uncluttered.

### Forms

- Inputs should be clean, lightly bordered, and rounded.
- Focus states should use teal outlines or rings.
- Forms should feel quick to scan and fill.

## 11. Content Style

- Use short, direct, human copy.
- Focus on service availability, safety, verified professionals, and ease of booking.
- Avoid long paragraphs on the home page.
- Use strong nouns and action verbs.

## 12. Responsive Behavior

### Desktop

- Hero image fills the screen.
- Navbar floats above the hero.
- Trust circles stay in a grid.
- Service cards display in three columns.

### Tablet

- Layout compresses but keeps the same section order.
- Navbar may simplify spacing before collapsing into mobile controls.
- Trust cards can move to two columns if needed.

### Mobile

- Replace the desktop hero image with a text-first hero block.
- Stack CTA buttons vertically.
- Reduce headline size but keep it bold.
- Use a dropdown menu for navigation.
- Service cards and trust stats stack into single-column or two-column grids depending on available width.

## 13. Motion and Interaction

- Keep motion minimal and purposeful.
- Hover states should be subtle and responsive.
- Menu open/close should feel quick and lightweight.
- Avoid decorative animation loops unless they reinforce clarity.
- Loading indicators should be small, simple spinners.

## 14. Accessibility Rules

- Maintain strong contrast between text and backgrounds.
- Keep buttons large enough for touch interaction.
- Ensure active navigation states are visually obvious.
- Do not rely on color alone to communicate important states.
- Use semantic headings in a clear hierarchy.

## 15. Imagery Rules

- The desktop homepage should use the exact hero image asset as the primary visual.
- Imagery should stay realistic and trust-oriented.
- Icons and service artwork should feel consistent with healthcare, not playful or cartoonish.
- Images should be cropped carefully so important subjects are not cut off.

## 16. Reusable Design Tokens

### Radius

- Pill buttons and navbar: full radius
- Stats circles: full radius
- Service cards: medium radius
- Inputs and small panels: medium radius

### Elevation

- Navbar: highest elevation on the home page
- Cards: medium-low elevation
- Buttons: small elevation only when needed

### Grid

- Use 12-column thinking for desktop composition.
- Use one-column stacking for mobile-first sections.
- Keep service and stat groups aligned and centered.

## 17. Do and Don’t

### Do

- Use teal as the primary brand signal.
- Keep the homepage bright and open.
- Make the hero image the main desktop statement.
- Preserve the pill navbar and circular stat language.
- Keep button and card shapes soft.

### Don’t

- Don’t introduce dark-mode styling as the default look.
- Don’t use purple as a brand accent.
- Don’t crowd the page with too many UI layers.
- Don’t replace the clean healthcare tone with something overly corporate or overly playful.
- Don’t flatten the hero into a generic text banner.

## 18. Reference Summary

If this design is recreated elsewhere, keep these five anchors intact:

- Full-screen hero image on desktop
- Soft rose pill navbar
- Teal primary accent
- Circular trust stats
- Teal service cards with white text

Those five elements define the identity of the current homepage more than any single component.

## 19. AI Implementation Contract

When an AI is asked to read this file and implement the design in another site, it must treat this document as the source of truth and reproduce the current website as closely as possible.

### Required Behavior

- Match the homepage structure, spacing, colors, typography, and component shapes as closely as possible.
- Use the exact visual hierarchy described here, not a new interpretation of the brand.
- Keep the desktop hero image as the dominant first impression.
- Preserve the same navbar style, section order, stat circles, and service-card treatment.
- Recreate the same calm healthcare tone, not a generic corporate or startup layout.
- If any detail is unclear, choose the option that stays closest to the current site rather than inventing a new style.

### Priority Order

If there is a conflict during implementation, follow this order:

1. Exact home-page image and hero treatment
2. Navbar shape, colors, and placement
3. Teal and rose color system
4. Typography hierarchy and spacing
5. Trust circles and service-card layouts
6. Buttons, badges, shadows, and smaller UI details

### Fidelity Rules

- Do not redesign the page.
- Do not substitute a different visual theme.
- Do not replace rounded forms with sharp ones.
- Do not change teal into another primary brand color.
- Do not simplify the layout into a generic landing page.
- Do not remove any major section that appears in this design system.

### Acceptance Test

The implementation is only correct if a user can compare the new site with the original and immediately recognize the same homepage composition, mood, and visual language.

### Short Instruction for Future AI

If you are an AI reading design.md, implement it exactly as written and keep the result as close as possible to the source design.

## 20. Exact Build Checklist

Use this checklist when reproducing the website in another codebase.

### Global Shell

- Use a light background and avoid dark-page defaults.
- Place the navbar above the hero with the same floating, centered treatment.
- Keep the main landing page vertically stacked in the same order as the current site.
- Preserve a wide, airy layout with strong center alignment.

### Homepage Sections

- Hero section: full-screen desktop image, custom mobile hero, no redesign.
- Why Choose Us section: oversized heading and four circular stat badges.
- Services section: three teal cards with icon, description, bullet list, and button.

### Navigation

- Use the same rounded navbar shape and soft rose background.
- Keep the left logo, middle navigation, and right-side auth actions.
- Preserve the mobile dropdown menu and its rounded panel styling.

### Buttons and Links

- Primary actions must be teal-filled and bold.
- Secondary actions must remain outlined or white with teal text.
- Link hover states should be subtle.

### Cards and Panels

- Use white cards for neutral content.
- Use teal cards for the service section.
- Keep borders light and shadows soft.

### Typography

- Keep headlines oversized and bold.
- Keep supporting text short and readable.
- Do not compress the spacing around major headings.

### Mobile

- Replace the hero image with the custom mobile composition.
- Stack call-to-action buttons vertically.
- Preserve the icon-first, headline-second flow.
- Keep the mobile navbar dropdown simple and readable.

## 21. Component Inventory

The current homepage is built from these visual parts. A faithful recreation should preserve the same relationships even if the component names change.

### Structural Components

- Hero shell
- Floating navbar
- Trust/stat section
- Services section

### Supporting UI Elements

- Logo wordmark
- Navigation links
- Auth buttons
- Mobile menu toggle
- Mobile dropdown panel
- Stat circles
- Service cards
- Service icons
- CTA buttons
- Trust icon and badge line

### Reusable Style Patterns

- Rounded pill navigation
- Circular metric cards
- Teal-filled cards
- White cards with soft borders
- Bold section headings
- Small muted labels

## 22. Token Reference Table

Use the following tokens as the closest practical representation of the current UI.

| Token | Suggested Value | Use |
| --- | --- | --- |
| primary | #14b8a6 | Main CTA, active links, highlights |
| primary-dark | #0f766e | Hover and deep accent states |
| primary-light | #99f6e4 | Soft highlights and badges |
| primary-bg | #ccfbf1 | Light accent surfaces |
| soft-rose | #fff1f2 | Navbar and dropdown background |
| text-strong | #111827 | Main headings |
| text-body | #4b5563 | Supporting paragraphs |
| text-muted | #6b7280 | Metadata and helper text |
| border | #d1d5db | Card and panel outlines |
| surface | #ffffff | Card and page surfaces |
| surface-muted | #f3f4f6 | Subtle blocks and disabled states |

## 23. Layout Reference

The following is the intended visual density of each major block.

### Hero

- Occupies almost the full viewport height.
- Uses the hero image as the dominant composition on desktop.
- Keeps text minimal on desktop and more expressive on mobile.

### Trust Section

- Sits directly below the hero.
- Uses large centered circles rather than narrow stat bars.
- Has ample breathing room around every badge.

### Services Section

- Uses a three-column layout on large screens.
- Each card is visually balanced and equal in height.
- The CTA button sits at the bottom of the card.

## 24. Fidelity Rules for AI Implementations

An AI implementing this design should obey these rules without exception:

- Copy the composition first, then the styling.
- Keep the same emotional tone before optimizing spacing or polish.
- Match the hero and navbar before adjusting smaller details.
- Prefer the existing structure over inventing new section types.
- If a detail is missing, infer the simplest option that stays visually closest to the source site.

## 25. Final Reference Sentence

This website should be recreated as a calm, soft, teal-accented healthcare landing page with a floating pill navbar, a dominant desktop hero image, a text-led mobile hero, circular trust stats, and bold service cards, with every part kept as close to the original as possible.