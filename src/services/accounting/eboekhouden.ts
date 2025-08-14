import 'server-only';

const SOAP_URL = 'https://soap.e-boekhouden.nl/soap.asmx';

function xml(tag: string) { 
  return (inner: string) =>
    `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                   xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                   xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>${inner}</soap:Body>
    </soap:Envelope>`; 
}

async function soapCall(action: string, body: string) {
  const res = await fetch(SOAP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': `"http://www.e-boekhouden.nl/soap/${action}"`,
    },
    body: xml(action)(body),
  });
  
  if (!res.ok) {
    throw new Error(`SOAP call failed: ${res.status} ${res.statusText}`);
  }
  
  const text = await res.text();
  return text;
}

export async function openSession() {
  const u = process.env.EBOEK_USERNAME!;
  const s1 = process.env.EBOEK_SECURITY_CODE_1!;
  const s2 = process.env.EBOEK_SECURITY_CODE_2!;
  
  if (!u || !s1 || !s2) {
    throw new Error('Missing e-Boekhouden credentials in environment variables');
  }
  
  const body = `
    <OpenSession xmlns="http://www.e-boekhouden.nl/soap">
      <Username>${u}</Username>
      <SecurityCode1>${s1}</SecurityCode1>
      <SecurityCode2>${s2}</SecurityCode2>
    </OpenSession>`;
    
  const xml = await soapCall('OpenSession', body);
  const sid = xml.match(/<SessionID>(.*?)<\/SessionID>/)?.[1];
  
  if (!sid) {
    const errorCode = xml.match(/<LastErrorCode>(.*?)<\/LastErrorCode>/)?.[1];
    const errorDesc = xml.match(/<LastErrorDescription>(.*?)<\/LastErrorDescription>/)?.[1];
    throw new Error(`No SessionID returned. Error: ${errorCode} - ${errorDesc}`);
  }
  
  return sid;
}

export async function closeSession(sessionId: string) {
  const body = `
    <CloseSession xmlns="http://www.e-boekhouden.nl/soap">
      <SessionID>${sessionId}</SessionID>
    </CloseSession>`;
    
  await soapCall('CloseSession', body);
}

export async function addRelatie(sessionId: string, rel: { 
  Code: string; 
  Bedrijf?: string; 
  Email?: string;
  BP?: 'B' | 'P';
  Adres?: string;
  Postcode?: string;
  Plaats?: string;
}) {
  const s2 = process.env.EBOEK_SECURITY_CODE_2!;
  const body = `
    <AddRelatie xmlns="http://www.e-boekhouden.nl/soap">
      <SessionID>${sessionId}</SessionID>
      <SecurityCode2>${s2}</SecurityCode2>
      <oRel>
        <BP>${rel.BP || 'P'}</BP>
        <Code>${rel.Code}</Code>
        ${rel.Bedrijf ? `<Bedrijf>${rel.Bedrijf}</Bedrijf>` : ''}
        ${rel.Email ? `<Email>${rel.Email}</Email>` : ''}
        ${rel.Adres ? `<Adres>${rel.Adres}</Adres>` : ''}
        ${rel.Postcode ? `<Postcode>${rel.Postcode}</Postcode>` : ''}
        ${rel.Plaats ? `<Plaats>${rel.Plaats}</Plaats>` : ''}
      </oRel>
    </AddRelatie>`;
    
  const xml = await soapCall('AddRelatie', body);
  const err = xml.match(/<LastErrorCode>(.*?)<\/LastErrorCode>/)?.[1];
  const relId = xml.match(/<Rel_ID>(.*?)<\/Rel_ID>/)?.[1];
  
  if (err && err !== '0') {
    const errorDesc = xml.match(/<LastErrorDescription>(.*?)<\/LastErrorDescription>/)?.[1];
    throw new Error(`AddRelatie failed: ${err} - ${errorDesc}`);
  }
  
  return { err, relId, raw: xml };
}

export async function addMemoriaal(sessionId: string, { 
  omschrijving, 
  datum, 
  regels 
}: {
  omschrijving: string; 
  datum: string;
  regels: Array<{ 
    Rekening: string; 
    Omschrijving: string; 
    Bedrag: string; 
    DebetCredit: 'D' | 'C';
    BTWCode?: string;
  }>
}) {
  const s2 = process.env.EBOEK_SECURITY_CODE_2!;
  const lines = regels.map(r => `
    <cMutReg>
      <Rekening>${r.Rekening}</Rekening>
      <Omschrijving>${r.Omschrijving}</Omschrijving>
      <BedragInvoer>${r.Bedrag}</BedragInvoer>
      <BTWCode>${r.BTWCode || 'GEEN'}</BTWCode>
      <DebetCredit>${r.DebetCredit}</DebetCredit>
    </cMutReg>`).join('');

  const body = `
    <AddMutatie xmlns="http://www.e-boekhouden.nl/soap">
      <SessionID>${sessionId}</SessionID>
      <SecurityCode2>${s2}</SecurityCode2>
      <oMut>
        <Soort>Memoriaal</Soort>
        <Datum>${datum}</Datum>
        <Rekening>MEMORIAAL</Rekening>
        <InExBTW>IN</InExBTW>
        <Omschrijving>${omschrijving}</Omschrijving>
        <Regels>${lines}</Regels>
      </oMut>
    </AddMutatie>`;
    
  const xml = await soapCall('AddMutatie', body);
  const err = xml.match(/<LastErrorCode>(.*?)<\/LastErrorCode>/)?.[1];
  const nr = xml.match(/<Mutatienummer>(.*?)<\/Mutatienummer>/)?.[1];
  
  if (err && err !== '0') {
    const errorDesc = xml.match(/<LastErrorDescription>(.*?)<\/LastErrorDescription>/)?.[1];
    throw new Error(`AddMutatie failed: ${err} - ${errorDesc}`);
  }
  
  return { err, mutatienummer: nr, raw: xml };
}

export async function addFactuur(sessionId: string, { 
  omschrijving, 
  datum, 
  relatieCode,
  regels 
}: {
  omschrijving: string; 
  datum: string;
  relatieCode: string;
  regels: Array<{ 
    Omschrijving: string; 
    BedragExclBTW: string; 
    BTW: string; 
    BTWCode: string;
    TegenrekeningCode: string;
    Referentie?: string;
  }>
}) {
  const s2 = process.env.EBOEK_SECURITY_CODE_2!;
  const lines = regels.map(r => `
    <cMutatieRegel>
      <BedragExclBTW>${r.BedragExclBTW}</BedragExclBTW>
      <BTW>${r.BTW}</BTW>
      <BedragInclBTW>${(parseFloat(r.BedragExclBTW) + parseFloat(r.BTW)).toFixed(2)}</BedragInclBTW>
      <BTWCode>${r.BTWCode}</BTWCode>
      <TegenrekeningCode>${r.TegenrekeningCode}</TegenrekeningCode>
      <Omschrijving>${r.Omschrijving}</Omschrijving>
      ${r.Referentie ? `<Referentie>${r.Referentie}</Referentie>` : ''}
    </cMutatieRegel>`).join('');

  const body = `
    <AddMutatie xmlns="http://www.e-boekhouden.nl/soap">
      <SessionID>${sessionId}</SessionID>
      <SecurityCode2>${s2}</SecurityCode2>
      <oMut>
        <Soort>FactuurVerstuurd</Soort>
        <Datum>${datum}</Datum>
        <Rekening>${relatieCode}</Rekening>
        <InExBTW>EX</InExBTW>
        <Omschrijving>${omschrijving}</Omschrijving>
        <MutatieRegels>${lines}</MutatieRegels>
      </oMut>
    </AddMutatie>`;
    
  const xml = await soapCall('AddMutatie', body);
  const err = xml.match(/<LastErrorCode>(.*?)<\/LastErrorCode>/)?.[1];
  const nr = xml.match(/<Mutatienummer>(.*?)<\/Mutatienummer>/)?.[1];
  
  if (err && err !== '0') {
    const errorDesc = xml.match(/<LastErrorDescription>(.*?)<\/LastErrorDescription>/)?.[1];
    throw new Error(`AddFactuur failed: ${err} - ${errorDesc}`);
  }
  
  return { err, mutatienummer: nr, raw: xml };
}

// Helper function to test connection
export async function testConnection() {
  try {
    const sessionId = await openSession();
    await closeSession(sessionId);
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
