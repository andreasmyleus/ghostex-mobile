/**
 * A question form an agent wrote as a ```questions block, drawn where the block sits in its reply:
 * every question at once, choices picked with a tap, a note or text box per question, and one Send
 * button. The rules (picks, Other, what is sent, the answered state) are the chat core's
 * (`questionForms`, packages/gx-chat-core/src/questions/forms.rs); this file only lays them out.
 *
 * CDXC:SessionChat 2026-10-11 SEE-ALSO:
 * Desktop draws the same form in apps/desktop/src/app/native_chat/question_form.rs; the grammar is
 * packages/gx-chat-core/src/transcript/question_forms.rs. Change them together.
 */

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { Json } from '../../rust/document';
import { useTranscriptEnv } from './context';
import { Glyph } from './icons';
import { arr, obj, str, type JsonRecord } from './json';
import { answeredColor } from './PageAnswersCard';
import { MONO_FONT, PROSE_LINE, PROSE_SIZE } from './theme';
import { StatusCard } from './SystemRows';

/** The document's `questionForms`, by form id. */
const FormsContext = createContext<{ [id: string]: Json }>({});
export const QuestionFormsProvider = FormsContext.Provider;

function letter(index: number): string {
  return index < 26 ? String.fromCharCode(97 + index) : String(index + 1);
}

function placeholder(question: JsonRecord | null, draft: JsonRecord | null): string {
  if (question?.text === true) return str(question, 'placeholder') || 'Your answer (optional)';
  return draft?.otherPicked === true ? 'What would you prefer instead? (optional)' : 'Note (optional)';
}

export function QuestionForm({ id, source }: { id: string; source: string }) {
  const { theme, dispatch } = useTranscriptEnv();
  const form = obj(useContext(FormsContext)[id]);
  if (form === null) {
    return <Text style={[styles.source, { color: theme.cardMuted }]}>{source}</Text>;
  }
  const phase = str(form, 'state');
  const enabled = phase === 'open';
  const error = str(form, 'error');
  const good = answeredColor(theme.light);
  const header = (
    <View style={styles.header}>
      <View style={styles.headerGlyph}>
        <Glyph name='help-circle' size={14} color={theme.muted} />
      </View>
      <Text style={[styles.title, { color: theme.foreground }]}>{str(form, 'title')}</Text>
      {phase === 'answered' ? (
        <View style={[styles.answered, { backgroundColor: `${good}24` }]}>
          <Glyph name='check' size={11} color={good} />
          <Text style={[styles.answeredLabel, { color: good }]}>Answered</Text>
        </View>
      ) : null}
    </View>
  );
  if (error.length > 0) {
    return (
      <StatusCard header={header}>
        <Text style={{ color: theme.error }}>These questions could not be shown: {error}</Text>
        <Text style={[styles.source, { color: theme.cardMuted }]}>{source}</Text>
      </StatusCard>
    );
  }
  const canSend = form.canSend === true;
  const sendError = str(form, 'sendError');
  const status =
    phase === 'answered'
      ? 'Sent to the agent.'
      : phase === 'queued'
        ? "Queued: it goes to the agent once it's ready."
        : phase === 'sending'
        ? 'Sending…'
        : sendError.length > 0
          ? sendError
          : 'Questions you leave blank are sent as unanswered.';
  const sendLabel = phase === 'answered' ? 'Sent' : phase === 'queued' ? 'Queued' : str(form, 'submit');
  const footer = (
    <View style={styles.footer}>
      <Text style={[styles.status, { color: enabled && sendError.length > 0 ? theme.error : theme.muted }]}>{status}</Text>
      <Pressable
        accessibilityRole='button'
        accessibilityLabel={sendLabel}
        accessibilityState={{ disabled: !canSend }}
        disabled={!canSend}
        hitSlop={6}
        onPress={() => dispatch({ type: 'formSend', form: id })}
        style={({ pressed }) => [
          styles.send,
          { borderColor: theme.border, backgroundColor: pressed ? theme.input : theme.light ? theme.background : 'transparent' },
          !canSend && styles.disabled,
        ]}
      >
        <Text style={{ color: theme.foreground, fontSize: 14 }}>{sendLabel}</Text>
      </Pressable>
    </View>
  );
  const drafts = arr(form.drafts);
  return (
    <StatusCard header={header} footer={footer}>
      {arr(form.questions).map((question, index) => (
        <FormQuestion
          key={index}
          formId={id}
          index={index}
          question={obj(question)}
          draft={obj(drafts[index])}
          otherLabel={str(form, 'otherLabel')}
          enabled={enabled}
        />
      ))}
    </StatusCard>
  );
}

function FormQuestion({
  formId,
  index,
  question,
  draft,
  otherLabel,
  enabled,
}: {
  formId: string;
  index: number;
  question: JsonRecord | null;
  draft: JsonRecord | null;
  otherLabel: string;
  enabled: boolean;
}) {
  const { theme, dispatch } = useTranscriptEnv();
  const tag = str(question, 'tag');
  const detail = str(question, 'detail');
  const multiple = question?.multiple === true;
  const isText = question?.text === true;
  const picked = new Set(arr(draft?.indices).filter((value): value is number => typeof value === 'number'));
  const choices = arr(question?.choices);
  const written = str(draft, 'other');
  const pick = (choice: number) => dispatch({ type: 'formChoice', form: formId, question: index, choice });
  // The saved draft is read as the form appears, so its text can land after the box was made: it
  // fills the box once (a remount with the saved text), never over what the reader typed.
  const settled = useRef(written.length > 0);
  const [filled, setFilled] = useState(0);
  useEffect(() => {
    if (!settled.current && written.length > 0) {
      settled.current = true;
      setFilled((count) => count + 1);
    }
  }, [written]);
  return (
    <View style={styles.question}>
      <View style={styles.questionHead}>
        {tag.length > 0 ? (
          <Text style={[styles.tag, { color: theme.muted, backgroundColor: `${theme.muted}2e` }]}>{tag}</Text>
        ) : null}
        <Text style={[styles.questionTitle, { color: theme.foreground }]}>{str(question, 'title')}</Text>
      </View>
      {detail.length > 0 ? <Text style={[styles.detail, { color: theme.cardMuted }]}>{detail}</Text> : null}
      {!isText && multiple ? <Text style={[styles.hint, { color: theme.muted }]}>Pick any that apply.</Text> : null}
      {!isText
        ? choices.map((choice, choiceIndex) => (
            <ChoiceRow
              key={choiceIndex}
              number={choiceIndex}
              label={str(choice, 'label')}
              detail={str(choice, 'detail')}
              recommended={obj(choice)?.recommended === true}
              picked={picked.has(choiceIndex)}
              multiple={multiple}
              other={false}
              enabled={enabled}
              onPress={() => pick(choiceIndex)}
            />
          ))
        : null}
      {!isText ? (
        <ChoiceRow
          number={choices.length}
          label={otherLabel}
          detail=''
          recommended={false}
          picked={draft?.otherPicked === true}
          multiple={multiple}
          other
          enabled={enabled}
          onPress={() => pick(choices.length)}
        />
      ) : null}
      {enabled ? (
        <TextInput
          key={filled}
          multiline
          defaultValue={written}
          placeholder={placeholder(question, draft)}
          placeholderTextColor={theme.muted}
          onChangeText={(text) => {
            settled.current = true;
            dispatch({ type: 'formText', form: formId, question: index, text });
          }}
          style={[
            styles.input,
            { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.light ? theme.background : 'transparent' },
            isText && styles.textAnswer,
          ]}
        />
      ) : written.trim().length > 0 ? (
        <Text selectable style={[styles.detail, { color: theme.cardMuted }]}>
          {isText ? written : `Note: ${written}`}
        </Text>
      ) : isText ? (
        <Text style={[styles.detail, { color: theme.muted }]}>Not answered</Text>
      ) : null}
    </View>
  );
}

function ChoiceRow({
  number,
  label,
  detail,
  recommended,
  picked,
  multiple,
  other,
  enabled,
  onPress,
}: {
  number: number;
  label: string;
  detail: string;
  recommended: boolean;
  picked: boolean;
  multiple: boolean;
  other: boolean;
  enabled: boolean;
  onPress: () => void;
}) {
  const { theme } = useTranscriptEnv();
  const primary = theme.controlPrimary;
  return (
    <Pressable
      accessibilityRole={multiple ? 'checkbox' : 'radio'}
      accessibilityLabel={label}
      accessibilityState={{ checked: picked, disabled: !enabled }}
      disabled={!enabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        {
          borderColor: picked ? `${primary}4d` : theme.border,
          backgroundColor: picked ? `${primary}1a` : pressed ? theme.pressed : theme.light ? theme.background : 'transparent',
        },
        !enabled && !picked && styles.disabled,
      ]}
    >
      <View
        style={[
          styles.mark,
          multiple ? styles.checkbox : styles.radio,
          { borderColor: picked ? primary : theme.muted },
          picked && multiple && { backgroundColor: primary },
        ]}
      >
        {picked && multiple ? <Glyph name='check' size={10} color={theme.background} /> : null}
        {picked && !multiple ? <View style={[styles.dot, { backgroundColor: primary }]} /> : null}
      </View>
      <View style={styles.choiceBody}>
        <View style={styles.choiceLine}>
          <Text style={[styles.choiceLabel, { color: other && !picked ? theme.cardMuted : theme.foreground }]}>
            {label}
          </Text>
          {recommended ? (
            <Text style={[styles.recommended, { color: primary, borderColor: `${primary}99` }]}>Recommended</Text>
          ) : null}
        </View>
        {detail.length > 0 ? <Text style={[styles.detail, { color: theme.cardMuted }]}>{detail}</Text> : null}
      </View>
      {/* The letter the reader can refer to ("do b"), as a muted keycap at the row's end. */}
      <Text style={[styles.keycap, { color: picked ? theme.foreground : theme.muted, borderColor: theme.border }]}>{letter(number)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  headerGlyph: { paddingTop: 4 },
  title: { flex: 1, fontSize: PROSE_SIZE, lineHeight: PROSE_LINE },
  answered: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  answeredLabel: { fontSize: 11, fontWeight: '600' },
  question: { gap: 6 },
  // The user's pick (desktop question_form.rs): the tag is a filled chip above the title.
  questionHead: { alignItems: 'flex-start', gap: 4 },
  tag: { fontFamily: MONO_FONT, fontSize: 10.5, lineHeight: 18, fontWeight: '500', paddingHorizontal: 7, borderRadius: 999, overflow: 'hidden' },
  keycap: { minWidth: 20, height: 20, paddingHorizontal: 4, marginTop: 0.5, borderWidth: 1, borderRadius: 4, fontFamily: MONO_FONT, fontSize: 11.5, lineHeight: 18, fontWeight: '500', textAlign: 'center', overflow: 'hidden' },
  questionTitle: { alignSelf: 'stretch', fontSize: 15, lineHeight: 21, fontWeight: '500' },
  detail: { fontSize: 13, lineHeight: 18 },
  hint: { fontSize: 12 },
  choice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderRadius: 8 },
  mark: { width: 16, height: 16, marginTop: 2, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radio: { borderRadius: 8 },
  checkbox: { borderRadius: 4 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  choiceBody: { flex: 1, gap: 2 },
  choiceLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  choiceLabel: { fontSize: 15, lineHeight: 21 },
  recommended: { fontSize: 10.5, lineHeight: 16, fontWeight: '600', paddingHorizontal: 6, borderWidth: 1, borderRadius: 999, overflow: 'hidden' },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, minHeight: 38, textAlignVertical: 'top' },
  textAnswer: { minHeight: 70 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  status: { flex: 1, fontSize: 12.5 },
  send: { height: 32, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  source: { fontFamily: MONO_FONT, fontSize: 12 },
});
