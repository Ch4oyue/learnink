"""Regenerate how-it-works.png: python3 how-it-works.py (needs matplotlib)."""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

fig, ax = plt.subplots(figsize=(11, 6.2), dpi=150)
ax.set_xlim(0, 11); ax.set_ylim(0, 6.2); ax.axis('off')
fig.patch.set_facecolor('white')

def box(x, y, w, h, title, lines, fc, ec='#D2D2D7', tc='#1D1D1F', title_fs=10.5, fs=8.6):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.09,rounding_size=0.12',
                                fc=fc, ec=ec, lw=1.2))
    ax.text(x+w/2, y+h-0.34, title, ha='center', va='center', fontsize=title_fs,
            fontweight='bold', color=tc)
    for i, ln in enumerate(lines):
        ax.text(x+w/2, y+h-0.72-i*0.30, ln, ha='center', va='center', fontsize=fs, color='#6E6E73')

def arrow(x1, y1, x2, y2):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle='-|>', mutation_scale=16,
                                 color='#86868B', lw=1.6))

ax.text(5.5, 5.9, 'How the refactor works', ha='center', fontsize=14, fontweight='bold', color='#1D1D1F')

box(0.25, 3.1, 3.0, 2.0, '1. Design tokens (index.css)', [
    'Light: white / #F5F5F7 / #007AFF',
    'Dark: black / #1C1C1E / #0A84FF',
    'Radius, shadow, tracking scale',
    'shadcn accent renamed --accent-muted'], '#F5F5F7')
box(0.25, 0.5, 3.0, 2.0, '2. Stack bridge', [
    'React 19.3 + @types 19',
    'Tailwind 4 via @tailwindcss/vite',
    'legacy tailwind.config.ts via @config',
    'postcss.config.js removed'], '#F5F5F7')
arrow(1.75, 3.05, 1.75, 2.62)

box(4.05, 3.1, 3.0, 2.0, '3. Component layer', [
    'HeroUI v3.2.7 (@heroui/react)',
    'selective @heroui/styles imports',
    '361 kB CSS / 45 kB gzip (was 938 kB)',
    '--accent color fix for HeroUI vars'], '#F5F5F7')
arrow(3.35, 4.1, 3.95, 4.1)
arrow(3.35, 1.5, 3.95, 1.5)
box(4.05, 0.5, 3.0, 2.0, '4. Core primitives restyled', [
    'Pill buttons, filled inputs',
    'Borderless cards, neutral shadows',
    'No gradients, no colored glow'], '#F5F5F7')
arrow(5.55, 3.05, 5.55, 2.62)

box(7.85, 1.8, 2.9, 2.4, '5. Pages rebuilt', [
    'Landing header + hero',
    'Auth: single-column Apple card',
    'HeroUI Button for submit',
    '',
    'Unchanged: logic, routes,',
    'dashboard pages (token-inherited)'], '#E8F0FE', ec='#007AFF')
arrow(7.15, 4.1, 7.75, 3.6)
arrow(7.15, 1.5, 7.75, 2.4)

plt.tight_layout()
plt.savefig('how-it-works.png', bbox_inches='tight', facecolor='white')
