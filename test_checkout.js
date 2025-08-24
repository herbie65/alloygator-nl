// Test script om checkout met verzendmethoden te testen
// Geen hardcoded test data meer - gebruik echte producten uit de database
const testCart = [];

// Voeg test cart toe aan localStorage
if (typeof window !== 'undefined') {
  localStorage.setItem('alloygator-cart', JSON.stringify(testCart));
  console.log('Test cart toegevoegd:', testCart);
  
  // Navigeer naar checkout
  window.location.href = '/checkout';
} else {
  console.log('Dit script moet in de browser worden uitgevoerd');
  console.log('Voer deze code uit in de browser console:');
  console.log(`
    localStorage.setItem('alloygator-cart', '${JSON.stringify(testCart)}');
    window.location.href = '/checkout';
  `);
} 