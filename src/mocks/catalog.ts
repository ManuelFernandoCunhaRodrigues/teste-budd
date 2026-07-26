import type { Coupon, MenuSection, Product } from '@/types/domain';
import { parseCurrencyToCents, type MoneyInCents } from '@/utils/money';

/**
 * Authored drinks catalogue.
 *
 * The design shows a similar menu at every venue, but "similar" is not "the
 * same object": each bar gets its own product instances, stamped with its
 * `venueId` and its own price. Sharing one array across venues is what allowed a
 * chopp from two different bars to collapse into a single cart line, and it also
 * meant a mutation in one venue's menu would be visible in all of them.
 *
 * Prices are authored as display strings for readability and converted to cents
 * once, at build time.
 */

interface AuthoredProduct {
  id: string;
  name: string;
  price: string;
  image: Product['image'];
}

const base = {
  chopp: {
    id: 'chopp-artesanal-500',
    name: 'Chopp Artesanal 500ml',
    price: 'R$ 16,00',
    image: 'green',
  },
  balde: {
    id: 'balde-6-long-necks',
    name: 'Balde 6 Long Necks',
    price: 'R$ 49,90',
    image: 'amber',
  },
  imperio: {
    id: 'imperio-600',
    name: 'Império 600ml',
    price: 'R$ 13,00',
    image: 'green',
  },
  caipirinhaLimao: {
    id: 'caipirinha-limao',
    name: 'Caipirinha de Limão',
    price: 'R$ 18,00',
    image: 'plum',
  },
  caipirinha: {
    id: 'caipirinha',
    name: 'Caipirinha',
    price: 'R$ 18,00',
    image: 'plum',
  },
  ginTonica: {
    id: 'gin-tonica',
    name: 'Gin Tônica',
    price: 'R$ 24,00',
    image: 'blue',
  },
  moscowMule: {
    id: 'moscow-mule',
    name: 'Moscow Mule',
    price: 'R$ 26,00',
    image: 'plum',
  },
  refrigerante: {
    id: 'refrigerante-lata-350',
    name: 'Refrigerante lata 350ml',
    price: 'R$ 7,00',
    image: 'blue',
  },
  suco: {
    id: 'suco-natural',
    name: 'Suco Natural',
    price: 'R$ 10,00',
    image: 'green',
  },
  agua: {
    id: 'agua-mineral-500',
    name: 'Água mineral 500ml',
    price: 'R$ 5,00',
    image: 'blue',
  },
} as const satisfies Record<string, AuthoredProduct>;

/**
 * Menu category chips.
 *
 * Derived from the venue's own sections by `buildMenuCategories`, so a chip can
 * never name a group the menu does not have — the previous hard-coded list was
 * free to drift from the sections it was supposed to filter.
 */

/**
 * Per-venue price index, applied to every item.
 *
 * Placeholder pricing until the API serves real per-venue offers. It exists so
 * the app never assumes a chopp costs the same everywhere — a rooftop is dearer
 * than a boteco, and the cart has to keep those apart.
 */
const VENUE_PRICE_INDEX: Record<string, number> = {
  'pixzinho-dos-crias': 1,
  'bar-do-ze': 0.9,
  'quintal-74': 1.05,
  'terraco-anil': 1.25,
};

function priceFor(venueId: string, authored: string): MoneyInCents {
  const cents = parseCurrencyToCents(authored);
  const index = VENUE_PRICE_INDEX[venueId] ?? 1;
  // Round to whole cents so no fractional cent ever enters the domain.
  return Math.round(cents * index);
}

interface Extras {
  price?: string;
  description?: string;
  oldPrice?: string;
  discount?: string;
  promoNote?: string;
  tag?: string;
}

/** Builds one venue-owned product instance. */
function offer(venueId: string, authored: AuthoredProduct, extras: Extras = {}): Product {
  return {
    id: authored.id,
    venueId,
    name: authored.name,
    priceInCents: priceFor(venueId, extras.price ?? authored.price),
    image: authored.image,
    ...(extras.description ? { description: extras.description } : {}),
    ...(extras.oldPrice ? { oldPriceInCents: priceFor(venueId, extras.oldPrice) } : {}),
    ...(extras.discount ? { discount: extras.discount } : {}),
    ...(extras.promoNote ? { promoNote: extras.promoNote } : {}),
    ...(extras.tag ? { tag: extras.tag } : {}),
  };
}

/** The 2-column highlights grid, owned by one venue. */
export function buildFeaturedProducts(venueId: string): Product[] {
  return [
    offer(venueId, base.chopp, { tag: 'Mais pedido' }),
    offer(venueId, base.balde, {
      price: 'R$ 39,90',
      oldPrice: base.balde.price,
      discount: '-20%',
    }),
    offer(venueId, base.caipirinhaLimao),
    offer(venueId, base.ginTonica, {
      price: 'R$ 19,90',
      oldPrice: base.ginTonica.price,
      discount: '-17%',
    }),
  ];
}

/** The full menu grouped by category, owned by one venue. */
export function buildMenuSections(venueId: string): MenuSection[] {
  return [
    {
      id: 'cervejas',
      title: 'Cervejas',
      items: [
        offer(venueId, base.chopp, { description: 'IPA da casa' }),
        offer(venueId, base.balde, {
          description: 'Heineken ou Império gelada',
          oldPrice: 'R$ 59,90',
          discount: '-15%',
          promoNote: 'Promo 1ª pedido',
        }),
        offer(venueId, base.imperio, { description: 'Garrafa gelada' }),
      ],
    },
    {
      id: 'drinks',
      title: 'Drinks',
      items: [
        offer(venueId, base.caipirinha, { description: 'Limão, morango ou maracujá' }),
        offer(venueId, base.ginTonica, { description: 'Gin, tônica e zimbro' }),
        offer(venueId, base.moscowMule, { description: 'Vodka, espuma de gengibre e limão' }),
      ],
    },
    {
      id: 'nao-alcoolicos',
      title: 'Não alcoólicos',
      items: [
        offer(venueId, base.refrigerante),
        offer(venueId, base.suco, { description: 'Laranja, abacaxi ou maracujá' }),
        offer(venueId, base.agua),
      ],
    },
  ];
}

/** Vouchers shown in the venue detail carousel. Amounts in integer cents. */
export const COUPONS: Coupon[] = [
  { id: 'cupom-19', valueInCents: 1_900, minimumInCents: 2_900 },
  { id: 'cupom-14', valueInCents: 1_400, minimumInCents: 2_400 },
  { id: 'cupom-5', valueInCents: 500, minimumInCents: 1_500 },
];
