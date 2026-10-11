/**
 * The answers a reader sent from an agent's HTML page, drawn as a card instead of the JSON message
 * gxserver typed into the session (`pageAnswers`, packages/gx-chat-core/src/transcript/page_answers.rs).
 *
 * CDXC:SessionChat 2026-10-11 SEE-ALSO:
 * Desktop draws the same card in apps/desktop/src/app/native_chat/page_answers.rs. Change them together.
 */

import { StyleSheet, Text, View } from 'react-native';

import type { ProjectedMessage } from '../../rust/document';
import { useTranscriptEnv } from './context';
import { Glyph } from './icons';
import { arr, num, obj, str } from './json';
import { PROSE_LINE, PROSE_SIZE } from './theme';
import { StatusCard } from './SystemRows';

/** The green that marks an answered page (desktop `answered_color`). */
export function answeredColor(light: boolean): string {
  return light ? '#059669' : '#34d399';
}

export function PageAnswersCard({ message }: { message: ProjectedMessage }) {
  const { theme } = useTranscriptEnv();
  const answers = obj(message.pageAnswers);
  const more = num(answers, 'more') ?? 0;
  const header = (
    <View style={styles.header}>
      <View style={styles.glyph}>
        <Glyph name='check' size={14} color={answeredColor(theme.light)} />
      </View>
      <Text style={[styles.title, { color: theme.foreground }]}>You answered “{str(answers, 'title')}”</Text>
    </View>
  );
  return (
    <StatusCard header={header}>
      {arr(answers?.rows).map((row, index) => {
        const label = str(row, 'label');
        return (
          <View key={index} style={styles.row}>
            {label.length > 0 ? <Text style={[styles.label, { color: theme.muted }]}>{label}</Text> : null}
            <Text selectable style={[styles.value, { color: theme.foreground }]}>
              {str(row, 'value')}
            </Text>
          </View>
        );
      })}
      {more > 0 ? <Text style={[styles.more, { color: theme.muted }]}>and {more} more</Text> : null}
    </StatusCard>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  glyph: { paddingTop: 4 },
  title: { flex: 1, fontSize: PROSE_SIZE, lineHeight: PROSE_LINE },
  row: { gap: 2 },
  label: { fontSize: 12.5, lineHeight: 17 },
  value: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  more: { fontSize: 12 },
});
