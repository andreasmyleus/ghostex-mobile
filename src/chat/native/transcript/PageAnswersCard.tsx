/**
 * The answers a reader sent from an agent's HTML page or an in-chat questions form, drawn as a
 * green receipt instead of the JSON message gxserver typed into the session (`pageAnswers`,
 * packages/gx-chat-core/src/transcript/page_answers.rs).
 *
 * CDXC:SessionChat 2026-10-11 SEE-ALSO:
 * Desktop draws the same card in apps/desktop/src/app/native_chat/page_answers.rs. Change them together.
 */

import { StyleSheet, Text, View } from 'react-native';

import type { ProjectedMessage } from '../../rust/document';
import { AnswerAside, AnswerChip, AskCard, AskHead, ReceiptRow } from '../cards/askCard';
import { useTranscriptEnv } from './context';
import { arr, num, obj, str } from './json';

/** The green that marks an answered page or form (desktop `answered_color`). */
export { answeredColor } from '../cards/askCard';

/** A long or multi-line answer reads as text rather than squeezed into a chip. */
function fitsChip(value: string): boolean {
  return value.length <= 80 && !value.includes('\n');
}

export function PageAnswersCard({ message }: { message: ProjectedMessage }) {
  const { theme } = useTranscriptEnv();
  const answers = obj(message.pageAnswers);
  const more = num(answers, 'more') ?? 0;
  const rows = arr(answers?.rows);
  const count = rows.length + more;
  return (
    <AskCard
      head={
        <AskHead
          icon="check"
          tone="answered"
          title={`You answered “${str(answers, 'title')}”`}
          detail={count === 1 ? '1 answer' : `${count} answers`}
        />
      }
    >
      <View style={styles.rows}>
        {rows.map((row, index) => {
          const value = str(row, 'value');
          const note = str(row, 'note');
          // The question sits above its answer, both at the card's full width (the user's decision in desktop page_answers.rs).
          return (
            <ReceiptRow
              key={index}
              number={index + 1}
              question={str(row, 'label')}
              answer={
                fitsChip(value) ? (
                  <AnswerChip label={value} />
                ) : (
                  <Text selectable style={[styles.longValue, { color: theme.foreground }]}>
                    {value}
                  </Text>
                )
              }
              below={note.length > 0 ? <AnswerAside>{note}</AnswerAside> : undefined}
              first={index === 0}
            />
          );
        })}
        {more > 0 ? <Text style={[styles.more, { color: theme.muted }]}>and {more} more</Text> : null}
      </View>
    </AskCard>
  );
}

const styles = StyleSheet.create({
  rows: { marginTop: -6 },
  longValue: { flexShrink: 1, fontSize: 14, lineHeight: 20, fontWeight: '500' },
  more: { fontSize: 12, paddingLeft: 32, paddingTop: 2 },
});
