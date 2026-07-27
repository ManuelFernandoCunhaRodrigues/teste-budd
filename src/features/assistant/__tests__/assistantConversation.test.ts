import { exchange, GREETING, resetConversation } from '../assistantConversation';

/**
 * The conversation thread.
 *
 * The engine decides *what* the assistant answers; this decides that the answer
 * reaches the thread intact, in order, and that a stray send cannot corrupt it.
 */

describe('resetConversation', () => {
  it('opens on the greeting alone', () => {
    const messages = resetConversation();

    expect(messages).toEqual([GREETING]);
    expect(GREETING.author).toBe('assistant');
  });
});

describe('exchange', () => {
  it('appends the question and the answer, in that order', () => {
    const messages = exchange(resetConversation(), 'Encontrar bares perto de mim');

    expect(messages).toHaveLength(3);
    expect(messages[1].author).toBe('user');
    expect(messages[1].text).toBe('Encontrar bares perto de mim');
    expect(messages[2].author).toBe('assistant');
    expect(messages[2].results?.length).toBeGreaterThan(0);
  });

  it('never mutates the thread it was given', () => {
    const before = resetConversation();
    const snapshot = [...before];

    exchange(before, 'Ver eventos de hoje');

    expect(before).toEqual(snapshot);
  });

  it('ignores an empty send instead of pushing a blank bubble', () => {
    const before = resetConversation();

    expect(exchange(before, '')).toBe(before);
    expect(exchange(before, '    ')).toBe(before);
  });

  it('trims the message it stores', () => {
    const messages = exchange(resetConversation(), '  Descobrir promoções  ');

    expect(messages[1].text).toBe('Descobrir promoções');
  });

  it('keeps every id unique across a long conversation', () => {
    let messages = resetConversation();
    for (const text of ['bares perto', 'eventos hoje', 'promoções', 'com amigos']) {
      messages = exchange(messages, text);
    }

    // Duplicated keys would make React reuse the wrong bubble as the thread grows.
    expect(new Set(messages.map((message) => message.id)).size).toBe(messages.length);
  });

  it('offers follow-ups on every answer, including the one it did not understand', () => {
    const understood = exchange(resetConversation(), 'Ver eventos de hoje');
    const not = exchange(resetConversation(), 'zzzzz');

    expect(understood[2].followUps?.length).toBeGreaterThan(0);
    expect(not[2].results ?? []).toHaveLength(0);
    expect(not[2].followUps?.length).toBeGreaterThan(0);
  });
});
