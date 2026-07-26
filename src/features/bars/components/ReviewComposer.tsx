import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Button, StarRating } from '@/components/ui';
import { colors } from '@/theme';

export interface ReviewComposerProps {
  onSubmit: (stars: number, text: string) => void;
}

/** Star picker plus free-text field for leaving a review. */
export function ReviewComposer({ onSubmit }: ReviewComposerProps) {
  const [stars, setStars] = useState(0);
  const [text, setText] = useState('');

  const canSubmit = stars > 0 && text.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(stars, text);
    setStars(0);
    setText('');
  };

  return (
    <View className="rounded-xl border border-border bg-surface p-4">
      <Text className="text-md font-extrabold text-text">Deixe sua avaliação</Text>

      <StarRating className="mt-3" onChange={setStars} value={stars} />

      <TextInput
        accessibilityLabel="Conte como foi sua experiência"
        className="mt-3 min-h-[64px] rounded-md border border-border bg-surface-alt p-3 text-base text-text"
        multiline
        onChangeText={setText}
        placeholder="Conte como foi sua experiência…"
        placeholderTextColor={colors.textDim}
        textAlignVertical="top"
        value={text}
      />

      <Button
        className="mt-3"
        disabled={!canSubmit}
        fullWidth
        label="Enviar avaliação"
        onPress={handleSubmit}
      />
    </View>
  );
}
