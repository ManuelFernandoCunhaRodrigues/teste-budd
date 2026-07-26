import type { Recommendation } from '@/types/domain';

/** The signed-in user shown throughout the profile area. */
export const CURRENT_USER = {
  name: 'Manuel Fernando',
  city: 'São Luís, MA',
  email: 'manuel@email.com',
  phone: '(98) 9 9999-9999',
  favoritesCount: 6,
  buddcoins: 25,
  ordersCount: 12,
} as const;

/** Editable account fields on the settings screen. */
export const ACCOUNT_FIELDS = [
  { key: 'name', label: 'Nome', value: CURRENT_USER.name },
  { key: 'email', label: 'E-mail', value: CURRENT_USER.email },
  { key: 'phone', label: 'Telefone', value: CURRENT_USER.phone },
  { key: 'password', label: 'Senha', value: '••••••••' },
] as const;

/** Notification categories the user can opt in and out of. */
export const NOTIFICATION_TYPES = [
  {
    key: 'app',
    title: 'Atualizações do App',
    description: 'Receba notificações quando uma nova versão estiver disponível',
  },
  {
    key: 'eventos',
    title: 'Eventos',
    description: 'Novos eventos e lembretes de eventos que você comprou ingressos',
  },
  {
    key: 'compras',
    title: 'Compras',
    description: 'Confirmações de pedidos e atualizações de status',
  },
  {
    key: 'geral',
    title: 'Geral',
    description: 'Ofertas especiais, dicas e outras informações relevantes',
  },
] as const;

/** Privacy toggles on the settings screen. */
export const PERMISSION_TOGGLES = [
  { key: 'location', label: 'Usar minha localização' },
  { key: 'personalized', label: 'Recomendações personalizadas' },
  { key: 'share', label: 'Compartilhar dados de uso' },
] as const;

/** Interest chips used to personalise recommendations. */
export const INTEREST_GROUPS = [
  {
    id: 'curte',
    title: 'O que você curte',
    items: [
      'Música ao vivo',
      'Festas',
      'Shows',
      'Eventos culturais',
      'Bares',
      'Restaurantes',
    ],
  },
  {
    id: 'consumo',
    title: 'Bebidas & comidas',
    items: ['Cerveja', 'Drinks', 'Vinho', 'Petiscos', 'Comida de boteco', 'Sem álcool'],
  },
  { id: 'preco', title: 'Faixa de preço', items: ['Econômico', 'Intermediário', 'Premium'] },
] as const;

/** Suggestions shown once at least one interest is selected. */
export const RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'rec-quintal',
    kind: 'Bar',
    name: 'Quintal 74',
    reason: 'Combina com Música ao vivo e Cerveja',
    image: 'blue',
    target: { type: 'bars' },
  },
  {
    id: 'rec-sunset',
    kind: 'Evento',
    name: 'Sunset Underground',
    reason: 'Perto de você · Festas',
    image: 'violet',
    target: { type: 'events' },
  },
  {
    id: 'rec-combo',
    kind: 'Produto',
    name: 'Combo Duplo + 2 Chopps',
    reason: 'Baseado em Petiscos e Cerveja',
    image: 'green',
    target: { type: 'bars' },
  },
];

/** Privacy policy copy. */
export const PRIVACY_BLOCKS = [
  {
    id: 'coleta',
    heading: 'Dados que coletamos',
    body: 'Coletamos apenas o necessário para o funcionamento do budd: seu nome, contato, localização (quando autorizada), pedidos e preferências de uso.',
  },
  {
    id: 'uso',
    heading: 'Como usamos',
    body: 'Usamos seus dados para mostrar bares e eventos próximos, personalizar recomendações, processar pedidos e melhorar o aplicativo.',
  },
  {
    id: 'compartilhamento',
    heading: 'Compartilhamento',
    body: 'Não vendemos seus dados. Compartilhamos apenas o essencial com estabelecimentos parceiros para concluir seus pedidos.',
  },
  {
    id: 'direitos',
    heading: 'Seus direitos',
    body: 'Você pode revisar, corrigir ou excluir seus dados a qualquer momento em Configurações ou excluindo sua conta.',
  },
] as const;

export const PRIVACY_UPDATED_AT = 'Última atualização: julho de 2026 · budd';

/** Explanatory copy for the Buddcoin loyalty programme. */
export const BUDDCOIN_ABOUT =
  'A buddcoin (BDC) é o programa de pontos e recompensas do budd. Você acumula pontos usando o app — comprando ingressos, produtos e participando de eventos — e troca por benefícios dentro da plataforma.';
