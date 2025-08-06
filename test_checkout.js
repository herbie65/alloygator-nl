// Test script om checkout met verzendmethoden te testen
const testCart = [
  {
    id: 1,
    name: "Set van 4 AlloyGators-Geel-12\"-19\"",
    price: 119.83,
    quantity: 1,
    vat_category: "standard"
  }
];

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