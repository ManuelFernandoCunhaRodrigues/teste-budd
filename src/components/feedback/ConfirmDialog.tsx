import { Modal, Text, View } from 'react-native';

import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import { cn } from '@/utils/cn';

import { Button } from '../ui/Button';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Styles the dialog and its confirm button as a destructive action. */
  destructive?: boolean;
  /** Spins the confirm button and blocks both actions while a request is open. */
  loading?: boolean;
  /**
   * Failure to show inside the dialog.
   *
   * Kept here rather than closing and toasting, so a failed destructive action
   * stays visible with the option to retry — a dialog that dismisses itself
   * reads as success.
   */
  errorMessage?: string | null;
}

/** Centred confirmation dialog for actions that need a second thought. */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  destructive = false,
  loading = false,
  errorMessage = null,
}: ConfirmDialogProps) {
  const titleRef = useModalAccessibility(visible, title);

  return (
    <Modal
      animationType="fade"
      // Android back must not dismiss mid-request and leave the user unsure
      // whether the action went through.
      onRequestClose={loading ? () => {} : onCancel}
      transparent
      visible={visible}
    >
      <View className="flex-1 items-center justify-center bg-black/60 px-6">
        <View
          accessibilityViewIsModal
          aria-modal
          className={cn(
            'w-full rounded-2xl border bg-surface p-6',
            destructive ? 'border-danger-border' : 'border-border',
          )}
          importantForAccessibility="yes"
        >
          <Text
            accessibilityRole="header"
            ref={titleRef}
            className={cn(
              'text-center text-2xl font-extrabold',
              destructive ? 'text-danger' : 'text-text',
            )}
          >
            {title}
          </Text>

          <Text className="mt-2 text-center text-base leading-5 text-text-muted">{message}</Text>

          {errorMessage ? (
            <Text
              accessibilityLiveRegion="assertive"
              className="mt-3 text-center text-sm text-danger-alt"
              role="alert"
            >
              {errorMessage}
            </Text>
          ) : null}

          <View className="mt-5 flex-row gap-3">
            <Button
              className="flex-1"
              disabled={loading}
              label={cancelLabel}
              onPress={onCancel}
              variant="neutral"
            />
            <Button
              className="flex-1"
              label={confirmLabel}
              loading={loading}
              onPress={onConfirm}
              variant={destructive ? 'danger' : 'primary'}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
