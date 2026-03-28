# Step 2: Plan - Implementation Strategy

## Goal
Elevate the dashboard revenue chart to a "Simple, Interactive & Fluid Enterprise" aesthetic using custom Recharts components and the lime green primary color.

## Proposed Changes

### Dashboard UI Redesign

#### [MODIFY] [page.tsx](file:///home/afreeserv/project/num_zero/src/app/[locale]/(admin)/admin/dashboard/page.tsx)
- **Custom Tooltip**: Create a `ChartTooltip` component with `backdrop-blur-xl` and `bg-card/80` for a glass effect.
- **Custom Dot**: Create a `ChartActiveDot` SVG component with a soft lime green glow.
- **Chart Layout**:
  - Remove vertical grid lines; keep horizontal lines at very low opacity.
  - Set `strokeWidth={4}` on the `Area` for a bold, surgical look.
  - Update `linearGradient` to use `#adfa1b` with multiple opacity stops.
  - Add smooth 1.5s ease-in-out animations.

### Implementation Todo
1.  Define helper components `ChartTooltip` and `ChartActiveDot`.
2.  Update the `AreaChart` block in the JSX.
3.  Optimize responsive font sizes for axes.

## Acceptance Criteria
- [ ] AC1: Chart uses vibrant lime green colors consistently.
- [ ] AC2: Tooltip has a glassmorphism/blur effect.
- [ ] AC3: Hovering over data points shows a glowing pulse dot.
- [ ] AC4: Animations are fluid and professional.
- [ ] AC5: Layout remains responsive on mobile.
