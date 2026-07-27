import { render, screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';

import { colors } from '@/theme';

import { Button } from '../Button';
import { Touchable } from '../Touchable';

function classTokens(instance: { props: Record<string, unknown> }): string[] {
  const className = instance.props.className;
  expect(typeof className).toBe('string');
  return (className as string).split(/\s+/);
}

it('keeps a disabled primary Button on its opaque disabled palette', async () => {
  await render(<Button disabled label="Salvar avaliação" />);

  const button = screen.getByRole('button', { name: 'Salvar avaliação' });
  const tokens = classTokens(button);

  expect(button).toBeDisabled();
  expect(tokens).toContain('bg-surface-muted');
  expect(tokens).not.toContain('opacity-[0.45]');
});

it('still dims neutral Buttons and ordinary Touchables when disabled', async () => {
  await render(
    <View>
      <Button disabled label="Opção neutra" variant="neutral" />
      <Touchable
        accessibilityLabel="Ação simples"
        accessibilityRole="button"
        disabled
      >
        <Text>Ação simples</Text>
      </Touchable>
    </View>,
  );

  const neutralButton = screen.getByRole('button', { name: 'Opção neutra' });
  const ordinaryTouchable = screen.getByRole('button', { name: 'Ação simples' });

  expect(neutralButton).toBeDisabled();
  expect(classTokens(neutralButton)).toContain('opacity-[0.45]');
  expect(ordinaryTouchable).toBeDisabled();
  expect(classTokens(ordinaryTouchable)).toContain('opacity-[0.45]');
});

it('blocks a loading primary Button without replacing its green surface', async () => {
  await render(<Button label="Publicando avaliação" loading />);

  const button = screen.getByRole('button', { name: 'Publicando avaliação' });
  const tokens = classTokens(button);
  const spinner = screen.container.queryAll(
    (instance) => instance.type === 'ActivityIndicator',
  )[0];

  expect(button).toBeDisabled();
  expect(button).toBeBusy();
  expect(tokens).toContain('bg-primary');
  expect(tokens).not.toContain('bg-surface-muted');
  expect(tokens).not.toContain('opacity-[0.45]');
  expect(spinner).toBeDefined();
  expect(spinner.props.color).toBe(colors.background);
});
