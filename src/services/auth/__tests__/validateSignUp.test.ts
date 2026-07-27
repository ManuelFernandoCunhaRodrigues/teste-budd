import { MIN_PASSWORD_LENGTH, validateSignUp } from '../authService';

/**
 * Registration validation.
 *
 * Deliberately stricter than sign-in: this is the moment the rules apply, and
 * the same length floor on sign-in would lock out anyone whose password
 * predates it.
 */

const valid = {
  name: 'Manuel Rodrigues',
  email: 'manuel@budd.com',
  password: 'segredo123',
  passwordConfirmation: 'segredo123',
};

describe('validateSignUp', () => {
  it('accepts a complete form', () => {
    expect(validateSignUp(valid)).toEqual({});
  });

  it('requires a name that is more than whitespace', () => {
    expect(validateSignUp({ ...valid, name: '   ' }).name).toBeTruthy();
  });

  it('rejects an address that is not one', () => {
    expect(validateSignUp({ ...valid, email: 'manuel' }).email).toBeTruthy();
    expect(validateSignUp({ ...valid, email: 'manuel@budd' }).email).toBeTruthy();
    expect(validateSignUp({ ...valid, email: '' }).email).toBeTruthy();
  });

  it('holds the password to a minimum length', () => {
    const short = 'a'.repeat(MIN_PASSWORD_LENGTH - 1);
    const errors = validateSignUp({
      ...valid,
      password: short,
      passwordConfirmation: short,
    });

    expect(errors.password).toContain(String(MIN_PASSWORD_LENGTH));
  });

  it('catches a mismatched confirmation', () => {
    expect(
      validateSignUp({ ...valid, passwordConfirmation: 'outra-coisa' }).passwordConfirmation,
    ).toBeTruthy();
  });

  it('reports every problem at once instead of one per submit', () => {
    const errors = validateSignUp({
      name: '',
      email: 'nao-e-email',
      password: 'abc',
      passwordConfirmation: '',
    });

    expect(Object.values(errors).filter(Boolean)).toHaveLength(4);
  });

  it('does not let a blank confirmation pass just because the password is invalid', () => {
    const errors = validateSignUp({ ...valid, password: '', passwordConfirmation: '' });

    expect(errors.password).toBeTruthy();
    expect(errors.passwordConfirmation).toBeTruthy();
  });
});
