import { answerFor } from './assistantEngine';
import type { AssistantMessage } from './assistantTypes';

/**
 * The conversation as a pure reducer over messages.
 *
 * Kept out of the component so the exchange can be asserted without mounting a
 * modal: what the assistant answers is the feature, and a test that has to
 * render a keyboard to check it would not be run.
 */

/** Opening message, shown before the user says anything. */
export const GREETING: AssistantMessage = {
  id: 'greeting',
  author: 'assistant',
  text: 'Olá! Posso te ajudar a encontrar o rolê ideal hoje. Quer descobrir bares, eventos ou promoções perto de você?',
};

/**
 * Appends the user's message and the assistant's answer.
 *
 * Returns the previous array untouched for an empty message, so a stray tap on
 * send cannot push a blank bubble into the thread.
 *
 * Ids are derived from the message count rather than random, which keeps a
 * given conversation reproducible in tests and stable as React keys.
 */
export function exchange(previous: AssistantMessage[], text: string): AssistantMessage[] {
  const trimmed = text.trim();
  if (!trimmed) return previous;

  const turn = previous.length;
  const answer = answerFor(trimmed);

  return [
    ...previous,
    { id: `user-${turn}`, author: 'user', text: trimmed },
    {
      id: `assistant-${turn}`,
      author: 'assistant',
      text: answer.reply,
      results: answer.results,
      followUps: answer.followUps,
    },
  ];
}

/** Back to the opening message. */
export function resetConversation(): AssistantMessage[] {
  return [GREETING];
}
