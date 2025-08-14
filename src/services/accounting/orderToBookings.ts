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
  
  order.items.forEach(item => {
    const btwPercentage = item.vat_rate || 21;
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
      Omschrijving: `BTW 21% ${order.order_number || order.id}`,
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
