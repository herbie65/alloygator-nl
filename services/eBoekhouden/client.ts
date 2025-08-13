import { createClientAsync } from 'strong-soap';

// e-Boekhouden SOAP Configuration
const WSDL_URL = 'https://soap.e-boekhouden.nl/soap.asmx?wsdl';
const ENDPOINT = 'https://soap.e-boekhouden.nl/soap.asmx';

// Types for e-Boekhouden SOAP operations
export interface eBoekhoudenSession {
  client: any;
  sessionId: string;
}

export interface eBoekhoudenRelatie {
  Code: string;
  Bedrijf: string;
  BP: 'B' | 'P'; // B = Bedrijf, P = Particulier
  Naam?: string;
  Adres?: string;
  Postcode?: string;
  Plaats?: string;
  Land?: string;
  Telefoon?: string;
  Email?: string;
  BTWNummer?: string;
  KvKNummer?: string;
}

export interface eBoekhoudenMutatieRegel {
  BedragExclBTW: number;
  BTW: number;
  BedragInclBTW: number;
  BTWCode: string;
  TegenrekeningCode: string;
  Omschrijving: string;
  Referentie?: string;
}

export interface eBoekhoudenMutatie {
  Soort: string; // FactuurVerstuurd, GeldOntvangen, Memoriaal, etc.
  Datum: string; // YYYY-MM-DD
  RelatieCode: string;
  Factuurnummer?: string;
  Omschrijving: string;
  InExBTW: 'IN' | 'EX';
  MutatieRegels: {
    cMutatieRegel: eBoekhoudenMutatieRegel[];
  };
  Boekstuk?: string;
  Referentie?: string;
}

export interface eBoekhoudenGrootboekRekening {
  ID: number;
  Code: string;
  Omschrijving: string;
  Categorie: string;
  Groep: string;
}

export interface eBoekhoudenArtikel {
  ID: number;
  Code: string;
  Omschrijving: string;
  PrijsExclBTW: number;
  BTWCode: string;
  Voorraad: number;
}

export class eBoekhoudenClient {
  private client: any = null;

  constructor() {
    // Initialize SOAP client
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      this.client = await createClientAsync(WSDL_URL, {
        endpoint: ENDPOINT,
        wsdl_headers: {},
        wsdl_options: {}
      });
      console.log('✅ e-Boekhouden SOAP client initialized');
    } catch (error) {
      console.error('❌ Failed to initialize e-Boekhouden SOAP client:', error);
      throw error;
    }
  }

  /**
   * Open a new session with e-Boekhouden
   */
  async openSession(): Promise<eBoekhoudenSession> {
    if (!this.client) {
      await this.initializeClient();
    }

    const username = process.env.EBOEKHOUDEN_USERNAME;
    const securityCode1 = process.env.EBOEKHOUDEN_SECURITY_CODE_1;
    const securityCode2 = process.env.EBOEKHOUDEN_SECURITY_CODE_2;

    if (!username || !securityCode1 || !securityCode2) {
      throw new Error('e-Boekhouden credentials not configured');
    }

    return new Promise((resolve, reject) => {
      this.client.OpenSession({
        Username: username,
        SecurityCode1: securityCode1,
        SecurityCode2: securityCode2
      }, (err: any, result: any) => {
        if (err) {
          console.error('❌ OpenSession failed:', err);
          reject(new Error(`Failed to open e-Boekhouden session: ${err.message}`));
          return;
        }

        const sessionId = result?.OpenSessionResult?.SessionID;
        if (!sessionId) {
          reject(new Error('No session ID received from e-Boekhouden'));
          return;
        }

        console.log('✅ e-Boekhouden session opened:', sessionId);
        resolve({ client: this.client, sessionId });
      });
    });
  }

  /**
   * Close an active session
   */
  async closeSession(client: any, sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      client.CloseSession({
        SessionID: sessionId
      }, (err: any, result: any) => {
        if (err) {
          console.error('❌ CloseSession failed:', err);
          reject(new Error(`Failed to close e-Boekhouden session: ${err.message}`));
          return;
        }

        console.log('✅ e-Boekhouden session closed:', sessionId);
        resolve();
      });
    });
  }

  /**
   * Add or update a relation (customer/supplier)
   */
  async addRelatie(session: eBoekhoudenSession, relatie: eBoekhoudenRelatie): Promise<string> {
    return new Promise((resolve, reject) => {
      session.client.AddRelatie({
        SessionID: session.sessionId,
        oRel: relatie
      }, (err: any, result: any) => {
        if (err) {
          console.error('❌ AddRelatie failed:', err);
          reject(new Error(`Failed to add relation: ${err.message}`));
          return;
        }

        const relatieId = result?.AddRelatieResult?.Rel_ID;
        if (!relatieId) {
          reject(new Error('No relation ID received from e-Boekhouden'));
          return;
        }

        console.log('✅ Relation added/updated:', relatie.Code, 'ID:', relatieId);
        resolve(relatieId);
      });
    });
  }

  /**
   * Add a mutation (transaction) to e-Boekhouden
   */
  async addMutatie(session: eBoekhoudenSession, mutatie: eBoekhoudenMutatie): Promise<string> {
    return new Promise((resolve, reject) => {
      session.client.AddMutatie({
        SessionID: session.sessionId,
        oMut: mutatie
      }, (err: any, result: any) => {
        if (err) {
          console.error('❌ AddMutatie failed:', err);
          reject(new Error(`Failed to add mutation: ${err.message}`));
          return;
        }

        const mutatieId = result?.AddMutatieResult?.Mut_ID;
        if (!mutatieId) {
          reject(new Error('No mutation ID received from e-Boekhouden'));
          return;
        }

        console.log('✅ Mutation added:', mutatie.Soort, 'ID:', mutatieId);
        resolve(mutatieId);
      });
    });
  }

  /**
   * Get all chart of accounts (grootboekrekeningen)
   */
  async getGrootboekRekeningen(session: eBoekhoudenSession): Promise<eBoekhoudenGrootboekRekening[]> {
    return new Promise((resolve, reject) => {
      session.client.GetGrootboekRekeningen({
        SessionID: session.sessionId
      }, (err: any, result: any) => {
        if (err) {
          console.error('❌ GetGrootboekRekeningen failed:', err);
          reject(new Error(`Failed to get chart of accounts: ${err.message}`));
          return;
        }

        const rekeningen = result?.GetGrootboekRekeningenResult?.cGrootboekRekening || [];
        console.log(`✅ Retrieved ${rekeningen.length} chart of accounts`);
        resolve(rekeningen);
      });
    });
  }

  /**
   * Get all articles (artikelen)
   */
  async getArtikelen(session: eBoekhoudenSession): Promise<eBoekhoudenArtikel[]> {
    return new Promise((resolve, reject) => {
      session.client.GetArtikelen({
        SessionID: session.sessionId
      }, (err: any, result: any) => {
        if (err) {
          console.error('❌ GetArtikelen failed:', err);
          reject(new Error(`Failed to get articles: ${err.message}`));
          return;
        }

        const artikelen = result?.GetArtikelenResult?.cArtikel || [];
        console.log(`✅ Retrieved ${artikelen.length} articles`);
        resolve(artikelen);
      });
    });
  }

  /**
   * Get all relations (relaties)
   */
  async getRelaties(session: eBoekhoudenSession): Promise<any[]> {
    return new Promise((resolve, reject) => {
      session.client.GetRelaties({
        SessionID: session.sessionId
      }, (err: any, result: any) => {
        if (err) {
          console.error('❌ GetRelaties failed:', err);
          reject(new Error(`Failed to get relations: ${err.message}`));
          return;
        }

        const relaties = result?.GetRelatiesResult?.cRelatie || [];
        console.log(`✅ Retrieved ${relaties.length} relations`);
        resolve(relaties);
      });
    });
  }

  /**
   * Test connection by opening and closing a session
   */
  async testConnection(): Promise<boolean> {
    try {
      const session = await this.openSession();
      await this.closeSession(session.client, session.sessionId);
      return true;
    } catch (error) {
      console.error('❌ e-Boekhouden connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const eBoekhoudenClientInstance = new eBoekhoudenClient();
