import { Text, TextInput, View } from 'react-native';

import { Button, StarRating } from '@/components/ui';
import { REVIEW_TEXT_LIMIT, type ReviewPublicationStatus } from '@/domain/reviews/reviewTypes';
import { colors } from '@/theme';

export interface ReviewComposerProps {
  stars: number;
  text: string;
  status: ReviewPublicationStatus | 'idle';
  errorMessage?: string;
  onChangeStars: (stars: number) => void;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onDiscard?: () => void;
}

/** Star picker plus free-text field for leaving a review. */
export function ReviewComposer({
  stars,
  text,
  status,
  errorMessage,
  onChangeStars,
  onChangeText,
  onSubmit,
  onDiscard,
}: ReviewComposerProps) {
  const isSubmitting = status === 'submitting';
  const hasDraftContent = stars > 0 || text.trim().length > 0;
  const canSubmit = stars > 0 && text.trim().length > 0 && !isSubmitting;

  const helper =
    errorMessage ??
    (status === 'submitting'
      ? 'Enviando avaliacao...'
      : hasDraftContent && status === 'draft'
        ? 'Rascunho salvo neste aparelho.'
        : null);

  const buttonLabel =
    status === 'failed'
      ? 'Tentar novamente'
      : status === 'submitting'
        ? 'Enviando...'
        : 'Enviar avaliacao';

  return (
    <View className="rounded-xl border border-border bg-surface p-4">
      <Text className="text-md font-extrabold text-text">Deixe sua avaliacao</Text>

      <StarRating
        className="mt-3"
        onChange={isSubmitting ? undefined : onChangeStars}
        value={stars}
      />

      <TextInput
        accessibilityLabel="Conte como foi sua experiencia"
        className="mt-3 min-h-[64px] rounded-md border border-border bg-surface-alt p-3 text-base text-text"
        editable={!isSubmitting}
        maxLength={REVIEW_TEXT_LIMIT}
        multiline
        onChangeText={onChangeText}
        placeholder="Conte como foi sua experiencia..."
        placeholderTextColor={colors.textDim}
        textAlignVertical="top"
        value={text}
      />

      <View className="mt-2 flex-row items-center justify-between gap-3">
        <Text
          className={errorMessage ? 'flex-1 text-sm text-danger' : 'flex-1 text-sm text-text-dim'}
        >
          {helper}
        </Text>
        {text.length > REVIEW_TEXT_LIMIT - 80 ? (
          <Text className="text-xs text-text-dim">
            {text.length}/{REVIEW_TEXT_LIMIT}
          </Text>
        ) : null}
      </View>

      <Button
        className="mt-3"
        disabled={!canSubmit}
        fullWidth
        label={buttonLabel}
        loading={isSubmitting}
        onPress={onSubmit}
      />

      {hasDraftContent && !isSubmitting && onDiscard ? (
        <Button
          className="mt-2"
          fullWidth
          label="Descartar rascunho"
          onPress={onDiscard}
          variant="ghost"
        />
      ) : null}
    </View>
  );
}
