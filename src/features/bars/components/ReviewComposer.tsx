import { Text, TextInput, View } from 'react-native';

import { Button, StarRating } from '@/components/ui';
import {
  REVIEW_TEXT_LIMIT,
  REVIEW_TEXT_MINIMUM,
  type ReviewPublicationStatus,
} from '@/domain/reviews/reviewTypes';
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

/** Shows the counter only once the limit is close enough to matter. */
const COUNTER_VISIBLE_FROM = REVIEW_TEXT_LIMIT - 80;

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
  const trimmed = text.trim();
  const hasDraftContent = stars > 0 || trimmed.length > 0;

  /**
   * The product rule, stated in one place.
   *
   * Both a score and a few words are required — `validateReviewFields` enforces
   * the same thing server-side, and the two must not disagree or the button
   * enables into a guaranteed rejection.
   */
  const canSubmit = stars > 0 && trimmed.length >= REVIEW_TEXT_MINIMUM && !isSubmitting;

  /** Says what is missing, rather than leaving a dead button unexplained. */
  const requirementHint =
    stars === 0
      ? 'Escolha uma nota para continuar.'
      : trimmed.length < REVIEW_TEXT_MINIMUM
        ? 'Escreva algumas palavras sobre sua experiência.'
        : null;

  const helper =
    errorMessage ??
    (isSubmitting
      ? 'Enviando avaliação…'
      : (requirementHint ??
        (hasDraftContent && status === 'draft' ? 'Rascunho salvo neste aparelho.' : null)));

  const buttonLabel =
    status === 'failed'
      ? 'Tentar novamente'
      : status === 'submitting'
        ? 'Enviando…'
        : 'Enviar avaliação';

  return (
    <View className="rounded-xl border border-border bg-surface p-4">
      <Text className="text-md font-extrabold text-text">Deixe sua avaliação</Text>

      <StarRating
        className="mt-2"
        onChange={isSubmitting ? undefined : onChangeStars}
        value={stars}
      />

      <TextInput
        accessibilityHint={`Máximo de ${REVIEW_TEXT_LIMIT} caracteres.`}
        accessibilityLabel="Conte como foi sua experiência"
        className="mt-3 min-h-[88px] rounded-md border border-border bg-surface-alt p-3 text-base leading-6 text-text"
        editable={!isSubmitting}
        maxLength={REVIEW_TEXT_LIMIT}
        multiline
        onChangeText={onChangeText}
        placeholder="Conte como foi sua experiência…"
        placeholderTextColor={colors.textMuted}
        textAlignVertical="top"
        value={text}
      />

      <View className="mt-2 flex-row items-start justify-between gap-3">
        {helper ? (
          <Text
            accessibilityLiveRegion={errorMessage ? 'assertive' : 'polite'}
            className={
              errorMessage ? 'flex-1 text-sm leading-5 text-danger-alt' : 'flex-1 text-sm leading-5 text-text-muted'
            }
            role={errorMessage ? 'alert' : undefined}
          >
            {helper}
          </Text>
        ) : (
          <View className="flex-1" />
        )}

        {text.length > COUNTER_VISIBLE_FROM ? (
          <Text className="text-xs text-text-muted">
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
