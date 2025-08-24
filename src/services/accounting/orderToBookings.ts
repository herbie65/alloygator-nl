import { COA, BTW, getBTWCode, calculateBTWAmount } from './chartOfAccounts';

export interface OrderItem {
  name: string;
  price: number;
  vat_rate?: number;
  sku?: string;
  product_id?: string;
}

export interface Customer {
  id: string;
  company_name?: string;
  email?: string;
  address?: string;
  postal_code?: string;
  city?: string;
}

export interface Order {
  id: string;
  order_number?: string;
  customer_id: string;
  items: OrderItem[];
  total_amount: number;
  payment_status: string;
  created_at: string;
}

export interface BookingRule {
  Rekening: string;
  Omschrijving: string;
  Bedrag: string;
  DebetCredit: 'D' | 'C';
  BTWCode: string;
}

export interface OrderBookings {
  verkoop: {
    omschrijving: string;
    datum: string;
    regels: BookingRule[];
  };
  cogsVoorraad: {
    omschrijving: string;
    datum: string;
    regels: BookingRule[];
  };
}

// Pure functie die van een order naar 2 addMemoriaal payloads mapt
export function mapOrderToBookings(order: Order, customer: Customer): OrderBookings {
  const datum = new Date(order.created_at).toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Bereken totaal BTW bedrag
  let totalBTW = 0;
  let totalExclBTW = 0;
  let btwPercentage = 0; // Default BTW percentage
  
  order.items.forEach(item => {
    btwPercentage = item.vat_rate || 0; // Geen hardcoded fallback meer
    const { amountExclBTW, btwAmount } = calculateBTWAmount(item.price, btwPercentage);
    totalExclBTW += amountExclBTW;
    totalBTW += btwAmount;
  });
  
  // Verkoopregels (1300 D / 8000 C / 1630 of 1631 C)
  const verkoopRegels: BookingRule[] = [
    {
      Rekening: COA.debiteuren,
      Omschrijving: `Debiteuren ${customer.company_name || customer.email || customer.id}`,
      Bedrag: order.total_amount.toFixed(2),
      DebetCredit: 'D',
      BTWCode: BTW.GEEN
    },
    {
      Rekening: COA.omzetHoog, // We gebruiken voorlopig alleen hoog, kan later uitgebreid worden
      Omschrijving: `Omzet ${order.order_number || order.id}`,
      Bedrag: totalExclBTW.toFixed(2),
      DebetCredit: 'C',
      BTWCode: BTW.GEEN
    },
    {
      Rekening: COA.btwHoog, // We gebruiken voorlopig alleen hoog, kan later uitgebreid worden
      Omschrijving: `BTW ${btwPercentage}% ${order.order_number || order.id}`,
      Bedrag: totalBTW.toFixed(2),
      DebetCredit: 'C',
      BTWCode: BTW.GEEN
    }
  ];
  
  // COGS/Voorraad (7000 D / 3000 C) - voorlopig geschat op 50% van omzet
  const estimatedCost = totalExclBTW * 0.5; // Dit kan later dynamisch worden gemaakt
  
  const cogsVoorraadRegels: BookingRule[] = [
    {
      Rekening: COA.cogs,
      Omschrijving: `COGS ${order.order_number || order.id}`,
      Bedrag: estimatedCost.toFixed(2),
      DebetCredit: 'D',
      BTWCode: BTW.GEEN
    },
    {
      Rekening: COA.voorraad,
      Omschrijving: `Voorraad ${order.order_number || order.id}`,
      Bedrag: estimatedCost.toFixed(2),
      DebetCredit: 'C',
      BTWCode: BTW.GEEN
    }
  ];
  
  return {
    verkoop: {
      omschrijving: `Verkoop ${order.order_number || order.id}`,
      datum,
      regels: verkoopRegels
    },
    cogsVoorraad: {
      omschrijving: `COGS/Voorraad ${order.order_number || order.id}`,
      datum,
      regels: cogsVoorraadRegels
    }
  };
}

// Helper functie om te controleren of debet = credit
export function validateBookingBalance(regels: BookingRule[]): boolean {
  let debet = 0;
  let credit = 0;
  
  regels.forEach(regel => {
    const bedrag = parseFloat(regel.Bedrag);
    if (regel.DebetCredit === 'D') {
      debet += bedrag;
    } else {
      credit += bedrag;
    }
  });
  
  // Afronding op 2 decimalen
  return Math.abs(debet - credit) < 0.01;
}

// NIEUW: Flexibele normalisatie + mapping voor wisselende order-schema's
// Deze laat de bestaande functie met rust en voegt alleen functionaliteit toe
export function normalizeOrderForAccounting(rawOrder: any): Order {
  const createdAt =
    rawOrder.paidAt ||
    rawOrder.paid_at ||
    rawOrder.created_at ||
    rawOrder.createdAt ||
    new Date().toISOString();

  // Bepaal total incl. BTW
  const itemsArray: any[] = Array.isArray(rawOrder.items) ? rawOrder.items : [];
  const computedTotalFromItems = itemsArray.reduce((sum, it) => {
    const unit = Number(it.price || it.price_incl || 0);
    const qty = Number(it.quantity || 1);
    return sum + unit * qty;
  }, 0);

  const totalAmount = Number(
    rawOrder.total_amount ??
    rawOrder.total ??
    computedTotalFromItems
  ) || 0;

  // Normaliseer items: zorg voor price incl. BTW en vat_rate, quantity
  const normalizedItems = itemsArray.map((it) => ({
    name: it.name,
    price: Number(it.price || it.price_incl || 0),
    vat_rate: Number(it.vat_rate ?? it.vat ?? 0), // Geen hardcoded fallback meer
    sku: it.sku,
    product_id: it.product_id,
    quantity: Number(it.quantity || 1),
  }));

  return {
    id: String(rawOrder.id),
    order_number: rawOrder.order_number || rawOrder.orderNumber || String(rawOrder.id),
    customer_id: rawOrder.customer_id || rawOrder.customerId || rawOrder.customer?.id || '',
    items: normalizedItems,
    total_amount: totalAmount,
    payment_status: rawOrder.payment_status || 'open',
    created_at: typeof createdAt === 'string' ? createdAt : new Date(createdAt).toISOString(),
  } as Order;
}

// Zelfde output als mapOrderToBookings, maar robuust voor wisselende schemas + quantities
export function mapOrderToBookingsFlexible(rawOrder: any, customer: Customer): OrderBookings {
  const order = normalizeOrderForAccounting(rawOrder);

  const datum = new Date(order.created_at).toISOString().split('T')[0]; // YYYY-MM-DD

  let totalBTW = 0;
  let totalExclBTW = 0;
  let btwPercentage = 0; // Default BTW percentage

  order.items.forEach((item: any) => {
    btwPercentage = item.vat_rate || 0; // Geen hardcoded fallback meer
    const qty = Number(item.quantity || 1);
    const { amountExclBTW, btwAmount } = calculateBTWAmount(item.price, btwPercentage);
    totalExclBTW += amountExclBTW * qty;
    totalBTW += btwAmount * qty;
  });

  const verkoopRegels: BookingRule[] = [
    {
      Rekening: COA.debiteuren,
      Omschrijving: `Debiteuren ${customer.company_name || customer.email || customer.id}`,
      Bedrag: order.total_amount.toFixed(2),
      DebetCredit: 'D',
      BTWCode: BTW.GEEN,
    },
    {
      Rekening: COA.omzetHoog,
      Omschrijving: `Omzet ${order.order_number || order.id}`,
      Bedrag: totalExclBTW.toFixed(2),
      DebetCredit: 'C',
      BTWCode: BTW.GEEN,
    },
    {
      Rekening: COA.btwHoog,
      Omschrijving: `BTW ${btwPercentage}% ${order.order_number || order.id}`,
      Bedrag: totalBTW.toFixed(2),
      DebetCredit: 'C',
      BTWCode: BTW.GEEN,
    },
  ];

  // Houd COGS conservatief (50% van omzet excl.) — zelfde aanname als bestaande functie
  const estimatedCost = totalExclBTW * 0.5;
  const cogsVoorraadRegels: BookingRule[] = [
    {
      Rekening: COA.cogs,
      Omschrijving: `COGS ${order.order_number || order.id}`,
      Bedrag: estimatedCost.toFixed(2),
      DebetCredit: 'D',
      BTWCode: BTW.GEEN,
    },
    {
      Rekening: COA.voorraad,
      Omschrijving: `Voorraad ${order.order_number || order.id}`,
      Bedrag: estimatedCost.toFixed(2),
      DebetCredit: 'C',
      BTWCode: BTW.GEEN,
    },
  ];

  return {
    verkoop: {
      omschrijving: `Verkoop ${order.order_number || order.id}`,
      datum,
      regels: verkoopRegels,
    },
    cogsVoorraad: {
      omschrijving: `COGS/Voorraad ${order.order_number || order.id}`,
      datum,
      regels: cogsVoorraadRegels,
    },
  };
}
