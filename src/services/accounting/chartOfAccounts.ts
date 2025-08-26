// Geen hardcoded grootboekrekeningen meer - deze komen uit de database
// TODO: Vervang door database calls naar chart_of_accounts collection
export const COA = {
  debiteuren: '',        // Debiteuren
  omzetHoog:  '',        // Omzet hoog (BTW uit database)
  omzetLaag:  '',        // Omzet laag (BTW uit database) - indien nodig
  btwHoog:    '',        // Af te dragen BTW (percentage uit database)
  btwLaag:    '',        // Af te dragen BTW (percentage uit database)
  cogs:       '',        // Kostprijs verkopen
  voorraad:   '',        // Voorraad
  kruispost:  '',        // Kruispost (indien nodig)
};

export const BTW = {
  GEEN: 'GEEN',
  // Voor AddFactuur regels gebruik je e-Boekhouden BTW-codes - komen uit database
  FACTUUR: { 
    HOOG: '', // BTW percentage uit database
    LAAG: ''  // BTW percentage uit database
  }
};

// Helper functie om BTW percentage naar BTW code te mappen
export function getBTWCode(percentage: number): string {
  // TODO: Vervang door database lookup naar BTW codes
  // Voorlopig gebruiken we generieke codes
  if (percentage === 0) {
    return BTW.GEEN;
  } else if (percentage > 15) {
    return 'HOOG_VERK'; // Hoog tarief
  } else if (percentage > 0) {
    return 'LAAG_VERK'; // Laag tarief
  } else {
    return BTW.GEEN;
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
