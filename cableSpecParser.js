/**
 * FlowWijs Kabel Scraping Rules
 * ============================
 * 
 * Regex patterns en parsing logica voor Nederlandse elektro-materiaal specificaties.
 * Geoptimaliseerd voor Elektramat en vergelijkbare suppliers.
 */

class CableSpecs {
    constructor() {
        this.cable_type = null;
        this.diameter = null;          // in mm²
        this.conductors = null;        // aantal aders
        this.length = null;           // in meters
        this.quantity = null;         // aantal stuks/rollen
        this.outer_diameter = null;   // in mm (buitendiameter)
    }
}

class CableSpecParser {
    constructor() {
        // Nederlandse kabel types (meest voorkomend)
        this.cable_types = [
            'YMvK', 'XMvK', 'VMvK', 'NYAF', 'VVB', 'H07V-K', 'H07V-U', 
            'H05V-K', 'H05V-U', 'PFXP', 'J-Y(St)Y', 'UTP', 'FTP', 'SFTP',
            'H07RN-F', 'H05RN-F', 'NYM', 'NKT', 'AMS', 'AMKA'
        ];
        
        this._compilePatterns();
    }
    
    _compilePatterns() {
        // 1. DIAMETER PATTERNS (mm²)
        this.diameter_patterns = [
            // Standaard: "2.5mm²", "2,5 mm²", "16mm2" 
            /(\d+(?:[.,]\d+)?)\s*mm[²2]/gi,
            // In productnaam: "YMVK 3x2.5"
            /(\d+)x(\d+(?:[.,]\d+)?)/gi,
            // Alleen getal voor bekende kabels: "2.5" (context dependent)
            /\b(\d+(?:[.,]\d+)?)\b/g,
        ];
        
        // 2. CONDUCTOR PATTERNS (aantal aders)
        this.conductor_patterns = [
            // "3x2.5", "5G2.5" (G = mit Erdleiter)
            /(\d+)[xX×](\d+(?:[.,]\d+)?)/gi,
            /(\d+)G(\d+(?:[.,]\d+)?)/gi,
            // "3-aderig", "5 aders"
            /(\d+)[-\s]?ader(?:ig|s)?/gi,
            // "3C" (3 conductor)
            /(\d+)C\b/gi,
        ];
        
        // 3. LENGTH PATTERNS (meters)
        this.length_patterns = [
            // "100m", "500 meter", "1.5km"
            /(\d+(?:[.,]\d+)?)\s*(?:meter|m)\b/gi,
            /(\d+(?:[.,]\d+)?)\s*km/gi,  // convert to meters
            // "per meter" (dan is het 1 meter)
            /per\s+meter?/gi,
            // Ring/haspel indicaties
            /(?:ring|haspel|rol).*?(\d+)\s*m/gi,
        ];
        
        // 4. QUANTITY PATTERNS (aantal stuks/dozen/rollen)
        this.quantity_patterns = [
            // "per 10 stuks", "100 stuks", "doos à 25"
            /(?:per\s+)?(\d+)\s*(?:stuks?|st\.?|pcs?)/gi,
            /(?:doos|box).*?(\d+)/gi,
            /(\d+)\s*(?:stuks?|st\.?)\s*per/gi,
            // Verpakkingseenheden
            /verpakking\s*(\d+)/gi,
        ];
        
        // 5. OUTER DIAMETER (buitendiameter)
        this.outer_diameter_patterns = [
            // "Ø16mm", "diameter 20mm", "16/19/20mm"
            /[øØ∅](\d+(?:[.,]\d+)?)\s*mm/gi,
            /diameter\s*(\d+(?:[.,]\d+)?)\s*mm/gi,
            // Voor inbouwdozen: "Ø16/19/20mm" -> neem middelste
            /[øØ∅](\d+)\/(\d+)\/(\d+)mm/gi,
        ];
    }
    
    /**
     * Parse kabel specificaties uit titel en beschrijving
     * 
     * @param {string} title - Product titel
     * @param {string} description - Product beschrijving (optioneel)
     * @returns {CableSpecs} - Object met geparste waarden
     */
    parseCableSpecifications(title, description = "") {
        const specs = new CableSpecs();
        const text = `${title} ${description}`.trim();
        
        // 1. Detect cable type
        specs.cable_type = this._extractCableType(text);
        
        // 2. Extract diameter (mm²)
        specs.diameter = this._extractDiameter(text);
        
        // 3. Extract number of conductors
        specs.conductors = this._extractConductors(text);
        
        // 4. Extract length
        specs.length = this._extractLength(text);
        
        // 5. Extract quantity
        specs.quantity = this._extractQuantity(text);
        
        // 6. Extract outer diameter
        specs.outer_diameter = this._extractOuterDiameter(text);
        
        return specs;
    }
    
    _extractCableType(text) {
        for (const cableType of this.cable_types) {
            const regex = new RegExp(`\\b${cableType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (regex.test(text)) {
                return cableType;
            }
        }
        return null;
    }
    
    _extractDiameter(text) {
        // Probeer eerst expliciete mm² notaties
        for (let i = 0; i < 2; i++) { // Skip algemene pattern eerst
            const pattern = this.diameter_patterns[i];
            pattern.lastIndex = 0; // Reset regex
            const matches = [...text.matchAll(pattern)];
            
            if (matches.length > 0) {
                const match = matches[0];
                if (match.length > 2) {
                    // "3x2.5" format - return cross section
                    return this._cleanFloat(match[2]);
                } else {
                    return this._cleanFloat(match[1]);
                }
            }
        }
        
        return null;
    }
    
    _extractConductors(text) {
        for (const pattern of this.conductor_patterns) {
            pattern.lastIndex = 0; // Reset regex
            const matches = [...text.matchAll(pattern)];
            
            if (matches.length > 0) {
                const match = matches[0];
                if (match.length > 2) {
                    return parseInt(match[1]); // Eerste getal is conductor count
                } else {
                    return parseInt(match[1]);
                }
            }
        }
        return null;
    }
    
    _extractLength(text) {
        // Check voor "per meter" eerst
        this.length_patterns[2].lastIndex = 0;
        if (this.length_patterns[2].test(text)) {
            return 1.0;
        }
        
        // Zoek expliciete lengtes
        for (let i = 0; i < this.length_patterns.length; i++) {
            if (i === 2) continue; // Skip "per meter" pattern
            
            const pattern = this.length_patterns[i];
            pattern.lastIndex = 0; // Reset regex
            const matches = [...text.matchAll(pattern)];
            
            if (matches.length > 0) {
                let length = this._cleanFloat(matches[0][1]);
                if (i === 1) { // km pattern
                    length *= 1000; // Convert to meters
                }
                return length;
            }
        }
        
        return null;
    }
    
    _extractQuantity(text) {
        for (const pattern of this.quantity_patterns) {
            pattern.lastIndex = 0; // Reset regex
            const matches = [...text.matchAll(pattern)];
            
            if (matches.length > 0) {
                return parseInt(matches[0][1]);
            }
        }
        
        // Default quantity check
        const lowerText = text.toLowerCase();
        if (['per stuk', 'per meter', 'los'].some(word => lowerText.includes(word))) {
            return 1;
        }
        
        return null;
    }
    
    _extractOuterDiameter(text) {
        for (const pattern of this.outer_diameter_patterns) {
            pattern.lastIndex = 0; // Reset regex
            const matches = [...text.matchAll(pattern)];
            
            if (matches.length > 0) {
                const match = matches[0];
                if (match.length === 4) {
                    // "16/19/20mm" format - neem middelste waarde
                    return parseFloat(match[2]);
                } else {
                    return this._cleanFloat(match[1]);
                }
            }
        }
        return null;
    }
    
    _cleanFloat(value) {
        if (typeof value === 'number') {
            return value;
        }
        return parseFloat(String(value).replace(',', '.'));
    }
}

class ElektramatProductParser {
    constructor() {
        this.cable_parser = new CableSpecParser();
    }
    
    /**
     * Parse een compleet product van Elektramat
     * 
     * @param {Object} productData - Dict met scraped fields (title, url, price, etc.)
     * @returns {Object} - Enhanced product dict met geparste specificaties
     */
    parseProduct(productData) {
        // Start met originele data
        const enhancedProduct = { ...productData };
        
        // Parse kabel specs
        const specs = this.cable_parser.parseCableSpecifications(
            productData.title || '',
            productData.description || ''
        );
        
        // Voeg geparste specs toe met 'unknown' fallbacks voor Google Sheets
        enhancedProduct.cable_type = specs.cable_type || 'unknown';
        enhancedProduct.diameter_mm2 = specs.diameter || 'unknown';
        enhancedProduct.conductor_count = specs.conductors || 'unknown';
        enhancedProduct.length_meters = specs.length || 'unknown';
        enhancedProduct.quantity_per_unit = specs.quantity || 'unknown';
        enhancedProduct.outer_diameter_mm = specs.outer_diameter || 'unknown';
        enhancedProduct.parsed_at = new Date().toISOString();
        enhancedProduct.parsing_confidence = this._calculateConfidence(specs);
        
        return enhancedProduct;
    }
    
    _calculateConfidence(specs) {
        const fields = [
            specs.cable_type, 
            specs.diameter, 
            specs.conductors, 
            specs.length, 
            specs.quantity, 
            specs.outer_diameter
        ];
        const parsedCount = fields.filter(field => field !== null).length;
        return parsedCount / fields.length;
    }
}

/**
 * Validate geparste specs voor data quality
 * 
 * @param {CableSpecs} specs - Geparste specificaties
 * @returns {Array<string>} - Array van waarschuwingen
 */
function validateParsedSpecs(specs) {
    const warnings = [];
    
    // Diameter validations
    if (specs.diameter) {
        if (specs.diameter > 1000) {
            warnings.push(`Diameter ${specs.diameter}mm² lijkt te hoog`);
        }
        if (specs.diameter < 0.1) {
            warnings.push(`Diameter ${specs.diameter}mm² lijkt te laag`);
        }
    }
    
    // Conductor validations  
    if (specs.conductors) {
        if (specs.conductors > 50) {
            warnings.push(`${specs.conductors} aders lijkt veel`);
        }
        if (specs.conductors < 1) {
            warnings.push(`${specs.conductors} aders is ongeldig`);
        }
    }
    
    // Length validations
    if (specs.length) {
        if (specs.length > 10000) {
            warnings.push(`Lengte ${specs.length}m lijkt extreem`);
        }
    }
    
    return warnings;
}

// Test function
function testCableParser() {
    console.log("🧪 Testing Cable Parser...");
    const parser = new CableSpecParser();
    
    const testCases = [
        {
            input: 'YMvK kabel 3x2.5mm² per 100 meter',
            expected: {
                cable_type: 'YMvK',
                diameter: 2.5,
                conductors: 3,
                length: 100,
                quantity: null
            }
        },
        {
            input: 'ATTEMA inbouwdoos U50 Ø16/19/20mm per 10 stuks',
            expected: {
                cable_type: null,
                diameter: null,
                conductors: null,
                length: null,
                quantity: 10,
                outer_diameter: 19.0
            }
        },
        {
            input: 'XMvK 5G6 installatie kabel 500m haspel',
            expected: {
                cable_type: 'XMvK',
                diameter: 6.0,
                conductors: 5,
                length: 500,
                quantity: null
            }
        },
        {
            input: 'H07V-K 1x16mm2 blauw per meter',
            expected: {
                cable_type: 'H07V-K',
                diameter: 16.0,
                conductors: 1,
                length: 1.0,
                quantity: null
            }
        }
    ];
    
    testCases.forEach((test, i) => {
        const specs = parser.parseCableSpecifications(test.input);
        console.log(`\nTest ${i + 1}: ${test.input}`);
        console.log(`  Type: ${specs.cable_type}`);
        console.log(`  Diameter: ${specs.diameter}mm²`);
        console.log(`  Conductors: ${specs.conductors}`);
        console.log(`  Length: ${specs.length}m`);
        console.log(`  Quantity: ${specs.quantity}`);
        console.log(`  Outer Ø: ${specs.outer_diameter}mm`);
        
        // Validate
        const warnings = validateParsedSpecs(specs);
        if (warnings.length > 0) {
            console.log(`  ⚠️  Warnings: ${warnings.join(', ')}`);
        }
    });
}

module.exports = {
    CableSpecs,
    CableSpecParser,
    ElektramatProductParser,
    validateParsedSpecs,
    testCableParser
};