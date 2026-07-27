import { useCallback, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton, Touchable } from '@/components/ui';
import { BuddLogo, ChevronRightIcon, CloseIcon } from '@/components/ui/icons';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import { colors } from '@/theme';

import { exchange, resetConversation } from '../assistantConversation';
import { QUICK_SUGGESTIONS } from '../assistantEngine';
import type { AssistantMessage, AssistantResult } from '../assistantTypes';

import { AssistantResultCard } from './AssistantResultCard';

export interface AssistantSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Called with the tapped card; the caller navigates and closes the sheet. */
  onOpenResult: (result: AssistantResult) => void;
}

/**
 * The assistant conversation.
 *
 * A simulation, and it does not pretend otherwise: every answer comes from
 * `assistantEngine`, which resolves a phrase against the app's own data. No
 * request leaves the device.
 *
 * The thread scrolls to the end after each exchange, so the answer is on screen
 * without the user chasing it.
 */
export function AssistantSheet({ visible, onClose, onOpenResult }: AssistantSheetProps) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<AssistantMessage[]>(resetConversation);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const titleRef = useModalAccessibility(visible, 'Assistente Budd aberto');

  const send = useCallback((text: string) => {
    setMessages((current) => exchange(current, text));
    setDraft('');
    // Deferred a frame: the new messages have not been laid out yet, so
    // scrolling now would stop at the previous content height.
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const lastMessage = messages[messages.length - 1];
  // Starter chips while the thread is untouched; the assistant's own follow-ups
  // once it has answered something.
  const chips =
    messages.length === 1
      ? QUICK_SUGGESTIONS.map((suggestion) => suggestion.query)
      : (lastMessage?.followUps ?? []);

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View className="flex-1 justify-end bg-black/60">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="max-h-[88%] rounded-t-3xl bg-surface-sheet"
        >
          <View
            accessibilityViewIsModal
            className="flex-row items-center gap-3 border-b border-border px-4.5 pb-3.5 pt-4"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-primary">
              <BuddLogo color={colors.background} size={22} />
            </View>

            <View className="min-w-0 flex-1">
              <Text className="text-lg font-extrabold text-text" ref={titleRef}>
                Assistente Budd
              </Text>
              <Text className="text-sm text-text-muted" numberOfLines={1}>
                Descubra bares, eventos e promoções
              </Text>
            </View>

            <IconButton
              accessibilityLabel="Fechar o assistente"
              onPress={onClose}
              size={38}
              variant="neutral"
            >
              <CloseIcon color={colors.textSoft} size={18} />
            </IconButton>
          </View>

          <ScrollView
            className="px-4.5"
            contentContainerClassName="gap-3.5 py-4"
            keyboardShouldPersistTaps="handled"
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message) => (
              <MessageRow key={message.id} message={message} onOpenResult={onOpenResult} />
            ))}

            {chips.length > 0 ? (
              <View className="mt-1 flex-row flex-wrap gap-2">
                {chips.map((chip) => (
                  <Touchable
                    accessibilityLabel={chip}
                    accessibilityRole="button"
                    className="rounded-2xl border border-primary-border bg-primary-surface px-3.5 py-2"
                    key={chip}
                    onPress={() => send(chip)}
                  >
                    <Text className="text-sm font-bold text-primary">{chip}</Text>
                  </Touchable>
                ))}
              </View>
            ) : null}
          </ScrollView>

          <View
            className="flex-row items-center gap-2.5 border-t border-border px-4.5 pt-3"
            style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          >
            <TextInput
              accessibilityLabel="Mensagem para o assistente"
              className="min-h-[46px] flex-1 rounded-2xl bg-surface-raised px-4 text-md text-text"
              onChangeText={setDraft}
              onSubmitEditing={() => send(draft)}
              placeholder="Pergunte ao assistente…"
              placeholderTextColor={colors.textDim}
              returnKeyType="send"
              value={draft}
            />

            <IconButton
              accessibilityLabel="Enviar mensagem"
              accessibilityState={{ disabled: draft.trim().length === 0 }}
              disabled={draft.trim().length === 0}
              onPress={() => send(draft)}
              size={46}
            >
              <ChevronRightIcon color={colors.primary} size={22} />
            </IconButton>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function MessageRow({
  message,
  onOpenResult,
}: {
  message: AssistantMessage;
  onOpenResult: (result: AssistantResult) => void;
}) {
  const isUser = message.author === 'user';

  return (
    <View className="gap-2.5">
      <View className={isUser ? 'items-end' : 'items-start'}>
        <View
          className={
            isUser
              ? 'max-w-[86%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5'
              : 'max-w-[86%] rounded-2xl rounded-bl-md bg-surface-raised px-3.5 py-2.5'
          }
        >
          <Text className={isUser ? 'text-md text-bg' : 'text-md leading-5 text-text'}>
            {message.text}
          </Text>
        </View>
      </View>

      {message.results?.map((result) => (
        <AssistantResultCard key={result.id} onOpen={onOpenResult} result={result} />
      ))}
    </View>
  );
}
