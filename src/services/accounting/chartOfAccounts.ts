// Centrale configuratie voor grootboekrekeningen en BTW-codes
export const COA = {
  debiteuren: '1300',        // Debiteuren
  omzetHoog:  '8000',        // Omzet hoog (21% BTW)
  omzetLaag:  '8001',        // Omzet laag (9% BTW) - indien nodig
  btwHoog:    '1630',        // Af te dragen BTW 21%
  btwLaag:    '1631',        // Af te dragen BTW 9%
  cogs:       '7000',        // Kostprijs verkopen
  voorraad:   '3000',        // Voorraad
  kruispost:  '1100',        // Kruispost (indien nodig)
};

export const BTW = {
  GEEN: 'GEEN',
  // Voor AddFactuur regels gebruik je e-Boekhouden BTW-codes
  FACTUUR: { 
    HOOG: 'HOOG_VERK_21', 
    LAAG: 'LAAG_VERK_9' 
  }
};

// Helper functie om BTW percentage naar BTW code te mappen
export function getBTWCode(percentage: number): string {
  switch (percentage) {
    case 21:
      return BTW.FACTUUR.HOOG;
    case 9:
      return BTW.FACTUUR.LAAG;
    case 0:
      return BTW.GEEN;
    default:
      return BTW.FACTUUR.HOOG; // Default naar hoog
  }
}

// Helper functie om BTW bedragen te berekenen
export function calculateBTWAmount(amountInclBTW: number, btwPercentage: number): { 
  amountExclBTW: number; 
  btwAmount: number 
} {
  const amountExclBTW = amountInclBTW / (1 + btwPercentage / 100);
  const btwAmount = amountInclBTW - amountExclBTW;
  
  return {
    amountExclBTW: Math.round(amountExclBTW * 100) / 100,
    btwAmount: Math.round(btwAmount * 100) / 100
  };
}
