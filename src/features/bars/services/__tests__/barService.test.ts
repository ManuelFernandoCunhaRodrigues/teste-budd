describe('barService source selection', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.resetModules();
  });

  async function loadService() {
    jest.resetModules();
    return require('../barService') as typeof import('../barService');
  }

  it('does not serve seeded bars when no source is configured', async () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    process.env.EXPO_PUBLIC_ENABLE_DEV_BACKEND = 'false';

    const { fetchBars } = await loadService();

    await expect(fetchBars()).rejects.toMatchObject({
      code: 'unavailable',
      userMessage: 'Conteúdo indisponível: o servidor não está configurado.',
    });
  });

  it('serves seeded bars only when the development backend is explicitly enabled', async () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    process.env.EXPO_PUBLIC_ENABLE_DEV_BACKEND = 'true';

    const { fetchBars } = await loadService();

    await expect(fetchBars()).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: expect.any(String) })]),
    );
  });
});
