// Test script voor het configurable product systeem
// Voer dit uit in de browser console om te testen

console.log('🧪 Testing Configurable Product System...')

// Test 1: Check of Firebase service beschikbaar is
if (typeof FirebaseService !== 'undefined') {
  console.log('✅ FirebaseService is beschikbaar')
} else {
  console.log('❌ FirebaseService is niet beschikbaar')
}

// Test 2: Test attributen ophalen
async function testAttributes() {
  try {
    console.log('📋 Testing attributes...')
    const attributes = await FirebaseService.getProductAttributes()
    console.log('✅ Attributes loaded:', attributes.length)
    console.log('📝 Attributes:', attributes.map(a => ({ name: a.name, label: a.label, type: a.type })))
    return attributes
  } catch (error) {
    console.error('❌ Error loading attributes:', error)
    return []
  }
}

// Test 3: Test attribuutsets ophalen
async function testAttributeSets() {
  try {
    console.log('📋 Testing attribute sets...')
    const sets = await FirebaseService.getAttributeSets()
    console.log('✅ Attribute sets loaded:', sets.length)
    console.log('📝 Sets:', sets.map(s => ({ name: s.name, attributes: s.attributes?.length || 0 })))
    return sets
  } catch (error) {
    console.error('❌ Error loading attribute sets:', error)
    return []
  }
}

// Test 4: Test product variants ophalen
async function testProductVariants() {
  try {
    console.log('🔗 Testing product variants...')
    const variants = await FirebaseService.getProductVariants('')
    console.log('✅ Product variants loaded:', variants.length)
    console.log('📝 Variants:', variants.map(v => ({ name: v.name, sku: v.sku, color: v.color, size: v.size })))
    return variants
  } catch (error) {
    console.error('❌ Error loading product variants:', error)
    return []
  }
}

// Test 5: Test configurable products ophalen
async function testConfigurableProducts() {
  try {
    console.log('⚙️ Testing configurable products...')
    const products = await FirebaseService.getProducts()
    const configurableProducts = products.filter(p => p.is_configurable)
    console.log('✅ Configurable products found:', configurableProducts.length)
    console.log('📝 Configurable products:', configurableProducts.map(p => ({ 
      name: p.name, 
      sku: p.sku, 
      base_sku: p.base_sku,
      configurable_attributes: p.configurable_attributes?.length || 0
    })))
    return configurableProducts
  } catch (error) {
    console.error('❌ Error loading configurable products:', error)
    return []
  }
}

// Uitvoeren van alle tests
async function runAllTests() {
  console.log('🚀 Starting all tests...')
  
  const attributes = await testAttributes()
  const sets = await testAttributeSets()
  const variants = await testProductVariants()
  const configProducts = await testConfigurableProducts()
  
  console.log('\n📊 Test Results Summary:')
  console.log(`- Attributes: ${attributes.length}`)
  console.log(`- Attribute Sets: ${sets.length}`)
  console.log(`- Product Variants: ${variants.length}`)
  console.log(`- Configurable Products: ${configProducts.length}`)
  
  if (attributes.length > 0 && sets.length > 0) {
    console.log('🎉 Basic system is working!')
  } else {
    console.log('⚠️ System needs setup - missing attributes or attribute sets')
  }
}

// Start de tests
runAllTests()
