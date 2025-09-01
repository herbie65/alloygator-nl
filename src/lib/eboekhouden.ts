import 'server-only';

// E-boekhouden SOAP API client
export class EBoekhoudenClient {
  private readonly username: string;
  private readonly securityCode1: string;
  private readonly securityCode2: string;
  private readonly baseUrl = 'https://soap.e-boekhouden.nl/soap.asmx';

  constructor() {
    this.username = process.env.EBOEK_USERNAME || '';
    this.securityCode1 = process.env.EBOEK_SECURITY_CODE_1 || '';
    this.securityCode2 = process.env.EBOEK_SECURITY_CODE_2 || '';

    if (!this.username || !this.securityCode1 || !this.securityCode2) {
      throw new Error('E-boekhouden credentials not configured in environment variables');
    }
  }

  private async soapCall(action: string, body: string): Promise<string> {
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    ${body}
  </soap:Body>
</soap:Envelope>`;

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"http://www.e-boekhouden.nl/soap/${action}"`,
      },
      body: soapEnvelope,
    });

    if (!response.ok) {
      throw new Error(`SOAP call failed: ${response.status} ${response.statusText}`);
    }

    return await response.text();
  }

  private parseXmlResponse(xml: string, extractFields: string[]): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const field of extractFields) {
      const match = xml.match(new RegExp(`<${field}>(.*?)</${field}>`, 's'));
      if (match) {
        result[field] = match[1].trim();
      }
    }
    
    return result;
  }

  private checkForErrors(xml: string): void {
    const errorCode = xml.match(/<LastErrorCode>(.*?)<\/LastErrorCode>/)?.[1];
    const errorDesc = xml.match(/<LastErrorDescription>(.*?)<\/LastErrorDescription>/)?.[1];
    
    if (errorCode && errorCode !== '0') {
      throw new Error(`E-boekhouden error ${errorCode}: ${errorDesc || 'Unknown error'}`);
    }
  }

  // Test connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const sessionId = await this.openSession();
      await this.closeSession(sessionId);
      return { success: true, message: 'Verbinding succesvol getest' };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Onbekende fout bij testen verbinding' 
      };
    }
  }

  // Open session
  async openSession(): Promise<string> {
    const body = `
      <OpenSession xmlns="http://www.e-boekhouden.nl/soap">
        <Username>${this.username}</Username>
        <SecurityCode1>${this.securityCode1}</SecurityCode1>
        <SecurityCode2>${this.securityCode2}</SecurityCode2>
      </OpenSession>`;

    const xml = await this.soapCall('OpenSession', body);
    const result = this.parseXmlResponse(xml, ['SessionID', 'LastErrorCode', 'LastErrorDescription']);
    
    this.checkForErrors(xml);
    
    if (!result.SessionID) {
      throw new Error('Geen SessionID ontvangen van E-boekhouden');
    }
    
    return result.SessionID;
  }

  // Close session
  async closeSession(sessionId: string): Promise<void> {
    const body = `
      <CloseSession xmlns="http://www.e-boekhouden.nl/soap">
        <SessionID>${sessionId}</SessionID>
      </CloseSession>`;

    const xml = await this.soapCall('CloseSession', body);
    this.checkForErrors(xml);
  }

  // Get relations (klanten/leveranciers)
  async getRelations(sessionId: string): Promise<any[]> {
    const body = `
      <GetRelaties xmlns="http://www.e-boekhouden.nl/soap">
        <SessionID>${sessionId}</SessionID>
        <SecurityCode2>${this.securityCode2}</SecurityCode2>
      </GetRelaties>`;

    const xml = await this.soapCall('GetRelaties', body);
    this.checkForErrors(xml);
    
    // Parse relations from XML
    const relations: any[] = [];
    const relationMatches = xml.match(/<cRelatie>(.*?)<\/cRelatie>/gs);
    
    if (relationMatches) {
      for (const match of relationMatches) {
        const relation = this.parseXmlResponse(match, [
          'ID', 'Code', 'Bedrijf', 'Contactpersoon', 'Adres', 'Postcode', 
          'Plaats', 'Land', 'Telefoon', 'Email', 'BP', 'BTWNummer'
        ]);
        relations.push(relation);
      }
    }
    
    return relations;
  }

  // Add relation (klant/leverancier)
  async addRelation(sessionId: string, relation: {
    Code: string;
    Bedrijf?: string;
    Contactpersoon?: string;
    Email?: string;
    BP?: 'B' | 'P'; // B = Bedrijf, P = Persoon
    Adres?: string;
    Postcode?: string;
    Plaats?: string;
    Land?: string;
    Telefoon?: string;
    BTWNummer?: string;
  }): Promise<string> {
    const body = `
      <AddRelatie xmlns="http://www.e-boekhouden.nl/soap">
        <SessionID>${sessionId}</SessionID>
        <SecurityCode2>${this.securityCode2}</SecurityCode2>
        <oRel>
          <BP>${relation.BP || 'P'}</BP>
          <Code>${relation.Code}</Code>
          ${relation.Bedrijf ? `<Bedrijf>${relation.Bedrijf}</Bedrijf>` : ''}
          ${relation.Contactpersoon ? `<Contactpersoon>${relation.Contactpersoon}</Contactpersoon>` : ''}
          ${relation.Email ? `<Email>${relation.Email}</Email>` : ''}
          ${relation.Adres ? `<Adres>${relation.Adres}</Adres>` : ''}
          ${relation.Postcode ? `<Postcode>${relation.Postcode}</Postcode>` : ''}
          ${relation.Plaats ? `<Plaats>${relation.Plaats}</Plaats>` : ''}
          ${relation.Land ? `<Land>${relation.Land}</Land>` : ''}
          ${relation.Telefoon ? `<Telefoon>${relation.Telefoon}</Telefoon>` : ''}
          ${relation.BTWNummer ? `<BTWNummer>${relation.BTWNummer}</BTWNummer>` : ''}
        </oRel>
      </AddRelatie>`;

    const xml = await this.soapCall('AddRelatie', body);
    const result = this.parseXmlResponse(xml, ['Rel_ID', 'LastErrorCode', 'LastErrorDescription']);
    
    this.checkForErrors(xml);
    
    if (!result.Rel_ID) {
      throw new Error('Geen Rel_ID ontvangen bij toevoegen relatie');
    }
    
    return result.Rel_ID;
  }

  // Get articles (artikelen)
  async getArticles(sessionId: string): Promise<any[]> {
    const body = `
      <GetArtikelen xmlns="http://www.e-boekhouden.nl/soap">
        <SessionID>${sessionId}</SessionID>
        <SecurityCode2>${this.securityCode2}</SecurityCode2>
      </GetArtikelen>`;

    const xml = await this.soapCall('GetArtikelen', body);
    this.checkForErrors(xml);
    
    // Parse articles from XML
    const articles: any[] = [];
    const articleMatches = xml.match(/<cArtikel>(.*?)<\/cArtikel>/gs);
    
    if (articleMatches) {
      for (const match of articleMatches) {
        const article = this.parseXmlResponse(match, [
          'ID', 'ArtikelID', 'Code', 'Omschrijving', 'Groep', 'GroepOmschrijving',
          'PrijsExclBTW', 'PrijsInclBTW', 'BTWCode', 'BTWPercentage'
        ]);
        articles.push(article);
      }
    }
    
    return articles;
  }

  // Add article (artikel)
  async addArticle(sessionId: string, article: {
    ArtikelID: string;
    Code: string;
    Omschrijving: string;
    Groep?: string;
    PrijsExclBTW: number;
    BTWCode?: string;
  }): Promise<string> {
    const body = `
      <AddArtikel xmlns="http://www.e-boekhouden.nl/soap">
        <SessionID>${sessionId}</SessionID>
        <SecurityCode2>${this.securityCode2}</SecurityCode2>
        <oArt>
          <ArtikelID>${article.ArtikelID}</ArtikelID>
          <Code>${article.Code}</Code>
          <Omschrijving>${article.Omschrijving}</Omschrijving>
          ${article.Groep ? `<Groep>${article.Groep}</Groep>` : ''}
          <PrijsExclBTW>${article.PrijsExclBTW}</PrijsExclBTW>
          ${article.BTWCode ? `<BTWCode>${article.BTWCode}</BTWCode>` : ''}
        </oArt>
      </AddArtikel>`;

    const xml = await this.soapCall('AddArtikel', body);
    const result = this.parseXmlResponse(xml, ['Art_ID', 'LastErrorCode', 'LastErrorDescription']);
    
    this.checkForErrors(xml);
    
    if (!result.Art_ID) {
      throw new Error('Geen Art_ID ontvangen bij toevoegen artikel');
    }
    
    return result.Art_ID;
  }

  // Add invoice (factuur)
  async addInvoice(sessionId: string, invoice: {
    RelatieCode: string;
    Factuurnummer: string;
    Factuurdatum: string;
    Vervaldatum: string;
    Factuurregels: Array<{
      Aantal: number;
      Eenheid: string;
      Omschrijving: string;
      StukprijsExclBTW: number;
      BTWCode: string;
      TegenrekeningCode: string;
    }>;
    BTWCode?: string;
    TegenrekeningCode?: string;
  }): Promise<string> {
    const regels = invoice.Factuurregels.map(regel => `
      <cFactuurRegel>
        <Aantal>${regel.Aantal}</Aantal>
        <Eenheid>${regel.Eenheid}</Eenheid>
        <Omschrijving>${regel.Omschrijving}</Omschrijving>
        <StukprijsExclBTW>${regel.StukprijsExclBTW}</StukprijsExclBTW>
        <BTWCode>${regel.BTWCode}</BTWCode>
        <TegenrekeningCode>${regel.TegenrekeningCode}</TegenrekeningCode>
      </cFactuurRegel>
    `).join('');

    const body = `
      <AddFactuur xmlns="http://www.e-boekhouden.nl/soap">
        <SessionID>${sessionId}</SessionID>
        <SecurityCode2>${this.securityCode2}</SecurityCode2>
        <oFact>
          <RelatieCode>${invoice.RelatieCode}</RelatieCode>
          <Factuurnummer>${invoice.Factuurnummer}</Factuurnummer>
          <Factuurdatum>${invoice.Factuurdatum}</Factuurdatum>
          <Vervaldatum>${invoice.Vervaldatum}</Vervaldatum>
          ${invoice.BTWCode ? `<BTWCode>${invoice.BTWCode}</BTWCode>` : ''}
          ${invoice.TegenrekeningCode ? `<TegenrekeningCode>${invoice.TegenrekeningCode}</TegenrekeningCode>` : ''}
          <Factuurregels>
            ${regels}
          </Factuurregels>
        </oFact>
      </AddFactuur>`;

    const xml = await this.soapCall('AddFactuur', body);
    const result = this.parseXmlResponse(xml, ['Factuurnummer', 'LastErrorCode', 'LastErrorDescription']);
    
    this.checkForErrors(xml);
    
    if (!result.Factuurnummer) {
      throw new Error('Geen Factuurnummer ontvangen bij toevoegen factuur');
    }
    
    return result.Factuurnummer;
  }

  // Get ledgers (grootboek)
  async getLedgers(sessionId: string): Promise<any[]> {
    const body = `
      <GetGrootboekrekeningen xmlns="http://www.e-boekhouden.nl/soap">
        <SessionID>${sessionId}</SessionID>
        <SecurityCode2>${this.securityCode2}</SecurityCode2>
      </GetGrootboekrekeningen>`;

    const xml = await this.soapCall('GetGrootboekrekeningen', body);
    this.checkForErrors(xml);
    
    // Parse ledgers from XML
    const ledgers: any[] = [];
    const ledgerMatches = xml.match(/<cGrootboekrekening>(.*?)<\/cGrootboekrekening>/gs);
    
    if (ledgerMatches) {
      for (const match of ledgerMatches) {
        const ledger = this.parseXmlResponse(match, [
          'ID', 'Code', 'Omschrijving', 'Categorie', 'Groep'
        ]);
        ledgers.push(ledger);
      }
    }
    
    return ledgers;
  }
}

// Singleton instance
let eboekhoudenClient: EBoekhoudenClient | null = null;

export function getEBoekhoudenClient(): EBoekhoudenClient {
  if (!eboekhoudenClient) {
    eboekhoudenClient = new EBoekhoudenClient();
  }
  return eboekhoudenClient;
}
