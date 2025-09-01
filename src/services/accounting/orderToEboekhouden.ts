import { getEBoekhoudenClient } from '@/lib/eboekhouden';
import { FirebaseService } from '@/lib/firebase';

export interface OrderToEboekhoudenData {
  orderId: string;
  customerCode: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  items: Array<{
    quantity: number;
    unit: string;
    description: string;
    unitPriceExclVat: number;
    vatCode: string;
    ledgerCode: string;
  }>;
  vatCode?: string;
  ledgerCode?: string;
}

export class OrderToEboekhoudenService {
  private static client = getEBoekhoudenClient();

  /**
   * Export een order naar E-boekhouden
   */
  static async exportOrder(orderId: string): Promise<{ success: boolean; message: string; invoiceNumber?: string }> {
    try {
      // Haal order op uit Firebase
      const order = await FirebaseService.getOrder(orderId);
      if (!order) {
        throw new Error(`Order ${orderId} niet gevonden`);
      }

      // Haal klant op
      const customer = await FirebaseService.getCustomer(order.customer_id);
      if (!customer) {
        throw new Error(`Klant ${order.customer_id} niet gevonden`);
      }

      // Genereer factuurnummer
      const invoiceNumber = `F${new Date().getFullYear()}${String(orderId).padStart(6, '0')}`;
      
      // Bereken vervaldatum (30 dagen na factuurdatum)
      const invoiceDate = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Converteer order items naar E-boekhouden formaat
      const invoiceItems = order.items.map(item => ({
        quantity: item.quantity,
        unit: 'stuk',
        description: item.name,
        unitPriceExclVat: parseFloat(item.price) / 1.21, // Excl. BTW (21%)
        vatCode: 'HOOG', // 21% BTW
        ledgerCode: '8000' // Omzet hoog
      }));

      // Voeg verzendkosten toe als aparte regel
      if (order.shipping_cost && order.shipping_cost > 0) {
        invoiceItems.push({
          quantity: 1,
          unit: 'stuk',
          description: 'Verzendkosten',
          unitPriceExclVat: parseFloat(order.shipping_cost) / 1.21,
          vatCode: 'HOOG',
          ledgerCode: '8000'
        });
      }

      // Open E-boekhouden sessie
      const sessionId = await this.client.openSession();

      try {
        // Controleer of klant al bestaat in E-boekhouden
        const relations = await this.client.getRelations(sessionId);
        const existingRelation = relations.find(r => r.Email === customer.email);

        let customerCode: string;
        if (existingRelation) {
          customerCode = existingRelation.Code;
        } else {
          // Voeg nieuwe klant toe aan E-boekhouden
          const relationData = {
            Code: `K${Date.now()}`, // Unieke code
            Bedrijf: customer.company_name || undefined,
            Contactpersoon: customer.name,
            Email: customer.email,
            BP: customer.company_name ? 'B' : 'P', // B = Bedrijf, P = Persoon
            Adres: customer.address,
            Postcode: customer.postal_code,
            Plaats: customer.city,
            Land: customer.country || 'NL',
            Telefoon: customer.phone,
            BTWNummer: customer.vat_number
          };

          const relationId = await this.client.addRelation(sessionId, relationData);
          customerCode = relationData.Code;
        }

        // Voeg factuur toe aan E-boekhouden
        const invoiceData = {
          RelatieCode: customerCode,
          Factuurnummer: invoiceNumber,
          Factuurdatum: invoiceDate,
          Vervaldatum: dueDate,
          Factuurregels: invoiceItems,
          BTWCode: 'HOOG',
          TegenrekeningCode: '1300' // Debiteuren
        };

        const eboekhoudenInvoiceNumber = await this.client.addInvoice(sessionId, invoiceData);

        // Update order in Firebase met E-boekhouden referentie
        await FirebaseService.updateOrder(orderId, {
          eboekhouden_invoice_number: eboekhoudenInvoiceNumber,
          eboekhouden_exported_at: new Date().toISOString(),
          eboekhouden_customer_code: customerCode
        });

        return {
          success: true,
          message: `Factuur succesvol geëxporteerd naar E-boekhouden (${eboekhoudenInvoiceNumber})`,
          invoiceNumber: eboekhoudenInvoiceNumber
        };

      } finally {
        await this.client.closeSession(sessionId);
      }

    } catch (error) {
      console.error('Error exporting order to E-boekhouden:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Onbekende fout bij exporteren'
      };
    }
  }

  /**
   * Export meerdere orders naar E-boekhouden
   */
  static async exportMultipleOrders(orderIds: string[]): Promise<Array<{ orderId: string; success: boolean; message: string; invoiceNumber?: string }>> {
    const results = [];

    for (const orderId of orderIds) {
      try {
        const result = await this.exportOrder(orderId);
        results.push({
          orderId,
          success: result.success,
          message: result.message,
          invoiceNumber: result.invoiceNumber
        });
      } catch (error) {
        results.push({
          orderId,
          success: false,
          message: error instanceof Error ? error.message : 'Onbekende fout'
        });
      }
    }

    return results;
  }

  /**
   * Controleer of een order al geëxporteerd is naar E-boekhouden
   */
  static async isOrderExported(orderId: string): Promise<boolean> {
    try {
      const order = await FirebaseService.getOrder(orderId);
      return !!(order?.eboekhouden_invoice_number);
    } catch (error) {
      return false;
    }
  }
}
