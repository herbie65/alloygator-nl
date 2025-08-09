// Script om producten toe te voegen via de admin interface
// Dit script simuleert het toevoegen van producten via de admin pagina

const testProducts = [
  {
    name: "AlloyGator Set Compleet",
    description: "Complete set voor velgbescherming inclusief alle benodigde onderdelen",
    price: 89.99,
    cost_price: 45.00,
    vat_category: "standard",
    category: "alloygator-set",
    sku: "AG-SET-001",
    ean_code: "8712345678901",
    stock_quantity: 50,
    weight: 2.5,
    dimensions: "30x20x10 cm",
    material: "Rubber en kunststof",
    color: "Zwart",
    warranty: "2 jaar",
    instructions: "Inclusief gedetailleerde montage-instructies",
    features: ["Eenvoudige montage", "Duurzaam materiaal", "Complete set"],
    specifications: {
      "Inhoud": "4 velgbeschermers, montagehulpmiddelen, instructies",
      "Compatibiliteit": "Alle standaard velgen",
      "Materiaal": "Hoogwaardig rubber"
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: "AlloyGator Velgbeschermer Enkel",
    description: "Individuele velgbeschermer voor losse aanschaf",
    price: 24.99,
    cost_price: 12.50,
    vat_category: "standard",
    category: "velgbeschermers",
    sku: "AG-VB-001",
    ean_code: "8712345678902",
    stock_quantity: 100,
    weight: 0.5,
    dimensions: "15x10x5 cm",
    material: "Rubber",
    color: "Zwart",
    warranty: "1 jaar",
    instructions: "Eenvoudige montage op velg",
    features: ["Flexibel materiaal", "Weerbestendig", "Eenvoudige montage"],
    specifications: {
      "Materiaal": "Hoogwaardig rubber",
      "Compatibiliteit": "Alle standaard velgen",
      "Weerbestendigheid": "UV-bestendig"
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: "Montagehulpmiddel Set",
    description: "Professionele hulpmiddelen voor eenvoudige montage",
    price: 19.99,
    cost_price: 8.00,
    vat_category: "standard",
    category: "montagehulpmiddelen",
    sku: "AG-MH-001",
    ean_code: "8712345678903",
    stock_quantity: 75,
    weight: 0.8,
    dimensions: "20x15x8 cm",
    material: "Kunststof en metaal",
    color: "Grijs",
    warranty: "1 jaar",
    instructions: "Inclusief gebruiksinstructies",
    features: ["Professionele kwaliteit", "Duurzaam", "Eenvoudig in gebruik"],
    specifications: {
      "Inhoud": "Montagegereedschap, instructies",
      "Materiaal": "Hoogwaardig kunststof en metaal",
      "Geschikt voor": "Alle AlloyGator producten"
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: "AlloyGator Accessoires Pakket",
    description: "Extra accessoires voor optimale velgbescherming",
    price: 34.99,
    cost_price: 17.50,
    vat_category: "standard",
    category: "accessoires",
    sku: "AG-ACC-001",
    ean_code: "8712345678904",
    stock_quantity: 30,
    weight: 1.2,
    dimensions: "25x18x12 cm",
    material: "Rubber en kunststof",
    color: "Zwart/Grijs",
    warranty: "1 jaar",
    instructions: "Inclusief montage-instructies",
    features: ["Extra bescherming", "Eenvoudige montage", "Duurzaam"],
    specifications: {
      "Inhoud": "Extra beschermingsonderdelen, montagehulpmiddelen",
      "Compatibiliteit": "Alle AlloyGator sets",
      "Materiaal": "Hoogwaardig rubber en kunststof"
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

console.log('Test producten die toegevoegd kunnen worden via de admin interface:');
console.log('');

testProducts.forEach((product, index) => {
  console.log(`${index + 1}. ${product.name}`);
  console.log(`   Prijs: €${product.price}`);
  console.log(`   Categorie: ${product.category}`);
  console.log(`   Voorraad: ${product.stock_quantity}`);
  console.log(`   SKU: ${product.sku}`);
  console.log('');
});

console.log('Instructies:');
console.log('1. Ga naar /admin/products');
console.log('2. Klik op "+ Nieuw Product"');
console.log('3. Vul de gegevens in volgens bovenstaande producten');
console.log('4. Klik op "Opslaan"');
console.log('');
console.log('Of gebruik de CSV import functie om alle producten tegelijk toe te voegen.');
