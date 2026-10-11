/**
 * Marked sections in an agent's reply: each section drawn in its kind's colour, in the style picked
 * in Settings > Chat, and the summary strip of the chips that count what needs the reader. The core
 * finds the sections and the counts (`packages/gx-chat-core/src/transcript/marked_sections.rs`);
 * this file only draws them.
 *
 * CDXC:MarkedHandovers 2026-10-11 DECISION:
 * User picked three styles from the mockups (docs/2026-10-11/chat-section-markers/index.html in the Ghostex repo): A, a thin left rule in the kind's colour with the emoji kept; C, a coloured badge naming the kind in place of the emoji, dropping a bold label that only repeats it; D, the emoji kept and the label coloured, the default. Every style shows the summary strip, whose chips jump to their section. The phone cannot read the computer's Marked handovers switch, so its own Settings > Chat entry picks the style and adds Plain text for no colouring.
 * SEE-ALSO: apps/desktop/src/app/native_chat/marked_look.rs in the Ghostex repo (the desktop look and the same palette).
 */

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSettingsStore, type MarkedHandoversStyle } from '../../../../settings/store';
import { PROSE_LINE, PROSE_SIZE, type TranscriptTheme } from '../theme';
import type { SectionMeta, SummaryChip } from './parse';

/** The "In progress" colour (user pick 2026-10-11: #00A6ED); darkened on a light chat, where it reads 2.7:1. */
const IN_PROGRESS = { dark: '#00a6ed', light: '#0077b6' };

const PALETTE: { [kind: string]: { dark: string; light: string } } = {
  need: { dark: '#60a5fa', light: '#2563eb' },
  done: { dark: '#4ade80', light: '#15803d' },
  read: { dark: '#fbbf24', light: '#b45309' },
  kicked: { dark: '#f472b6', light: '#be185d' },
  progress: IN_PROGRESS,
  untested: { dark: '#2dd4bf', light: '#0f766e' },
  shipped: { dark: '#818cf8', light: '#4f46e5' },
  blocked: { dark: '#f87171', light: '#dc2626' },
};

export function kindColor(kind: string, light: boolean): string {
  const entry = PALETTE[kind];
  if (entry === undefined) return light ? '#71717b' : '#9e9e9e';
  return light ? entry.light : entry.dark;
}

/** `#rrggbb` at `alpha`, as `#rrggbbaa`. */
function withAlpha(hex: string, alpha: number): string {
  return `${hex}${Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0')}`;
}

function tint(theme: TranscriptTheme): { fill: number; edge: number } {
  return theme.light ? { fill: 0.07, edge: 0.28 } : { fill: 0.11, edge: 0.3 };
}

export function useMarkedStyle(): MarkedHandoversStyle {
  return useSettingsStore((store) => store.settings.markedHandoversStyle);
}

/**
 * Where the main transcript scrolls a section to: the list registers a function that brings a
 * window position to the top of the transcript.
 */
let revealer: ((windowY: number) => void) | null = null;

export function setMarkedSectionRevealer(next: ((windowY: number) => void) | null): void {
  revealer = next;
}

/** The sections of one reply, by index, so its summary chips can find them. */
export type SectionRefs = Map<number, View>;

export function MarkedSummary({ chips, theme, sections }: { chips: SummaryChip[]; theme: TranscriptTheme; sections: SectionRefs }) {
  const { fill, edge } = tint(theme);
  return (
    <View style={[styles.strip, { borderBottomColor: theme.border }]}>
      {chips.map((chip, index) => {
        const color = kindColor(chip.kind, theme.light);
        return (
          <Pressable
            key={index}
            accessibilityRole='button'
            accessibilityLabel={`${chip.count} ${chip.text}`}
            onPress={() => sections.get(chip.section)?.measureInWindow((_x, y) => revealer?.(y))}
            style={({ pressed }) => [
              styles.chip,
              { borderColor: withAlpha(color, edge), backgroundColor: withAlpha(color, pressed ? fill + 0.08 : fill) },
            ]}
          >
            <Text style={[styles.chipText, { color }]}>
              {chip.emoji} <Text style={styles.chipCount}>{chip.count}</Text> {chip.text}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type SectionProps = {
  meta: SectionMeta;
  style: MarkedHandoversStyle;
  theme: TranscriptTheme;
  color: string;
  /** Every line of the section drawn as written (style A, and Plain text). */
  all: ReactNode;
  /** The lines after the first (styles C and D). */
  rest: ReactNode;
  /** The rest of the first line, as inline text (styles C and D). */
  lead: ReactNode;
  sections: SectionRefs;
  selectable: boolean;
};

export function MarkedSection({ meta, style, theme, color, all, rest, lead, sections, selectable }: SectionProps) {
  const register = (view: View | null) => {
    if (view !== null) sections.set(meta.index, view);
    else sections.delete(meta.index);
  };
  if (style === 'plain') return <View ref={register}>{all}</View>;
  const accent = kindColor(meta.kind, theme.light);
  if (style === 'rule') {
    return (
      <View ref={register} style={[styles.rule, { borderLeftColor: accent }]}>
        {all}
      </View>
    );
  }
  const hasLead = meta.lead.length > 0;
  if (style === 'badge') {
    const { fill, edge } = tint(theme);
    const label = meta.label.length > 0 && !meta.labelRepeats ? meta.label : '';
    return (
      <View ref={register}>
        <View style={styles.badgeRow}>
          <View style={styles.badgeLine}>
            <View style={[styles.badge, { borderColor: withAlpha(accent, edge), backgroundColor: withAlpha(accent, fill + 0.05) }]}>
              <View style={[styles.badgeDot, { backgroundColor: accent }]} />
              <Text style={[styles.badgeText, { color: accent }]}>{meta.name.toUpperCase()}</Text>
            </View>
          </View>
          {label.length > 0 || hasLead ? (
            <Text selectable={selectable} style={[styles.prose, styles.badgeLead, { color }]}>
              {label.length > 0 ? <Text style={[styles.label, { color: theme.foreground }]}>{label}</Text> : null}
              {label.length > 0 && hasLead ? ' ' : null}
              {hasLead ? lead : null}
            </Text>
          ) : null}
        </View>
        {rest}
      </View>
    );
  }
  // Coloured labels: the line reads as written, with its label in the kind's colour.
  return (
    <View ref={register}>
      <Text selectable={selectable} style={[styles.prose, { color }]}>
        {meta.emoji}{' '}
        {meta.label.length > 0 ? <Text style={[styles.label, { color: accent }]}>{meta.label}</Text> : null}
        {meta.label.length > 0 && hasLead ? ' ' : null}
        {hasLead ? lead : null}
      </Text>
      {rest}
    </View>
  );
}

const styles = StyleSheet.create({
  prose: { fontSize: PROSE_SIZE, lineHeight: PROSE_LINE },
  label: { fontWeight: '600' },
  strip: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  chipText: { fontSize: 12, lineHeight: 15 },
  chipCount: { fontWeight: '700' },
  rule: { borderLeftWidth: 3, paddingLeft: 12 },
  badgeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  badgeLine: { height: PROSE_LINE, justifyContent: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 999, paddingLeft: 7, paddingRight: 8, paddingVertical: 3 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, lineHeight: 13, fontWeight: '600', letterSpacing: 0.4 },
  badgeLead: { flex: 1, minWidth: 0 },
});
