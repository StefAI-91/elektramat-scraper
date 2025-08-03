/**
 * FlowWijs Schakelmateriaal Parser
 * ===============================
 *
 * Specialized parser voor Nederlandse schakelmateriaal specificaties.
 * Covers: schakelaars, stopcontacten, dimmers, frames, modules, etc.
 * 
 * JavaScript port of the comprehensive Python parser
 */

// Switch Types (Enum equivalent)
const SwitchType = {
    SINGLE: "enkelpolig",
    DOUBLE: "dubbelpolig", 
    CROSSOVER: "wisselschakelaar",
    INTERMEDIATE: "kruisschakelaar",
    PUSH_BUTTON: "drukknop",
    DIMMER: "dimmer",
    SERIES: "serieschakelaar"
};

// Socket Types (Enum equivalent)
const SocketType = {
    SCHUKO: "schuko",
    FRENCH: "frans",
    USB: "usb",
    DATA: "data",
    PHONE: "telefoon",
    TV_SAT: "tv/sat"
};

/**
 * Gestructureerde schakelmateriaal specificaties
 */
class SwitchingSpecs {
    constructor() {
        // Basic identification
        this.product_type = null;  // "schakelaar", "stopcontact", "dimmer", etc.
        this.switch_type = null;
        this.socket_type = null;
        
        // Technical specs
        this.voltage = null;  // 230V, 400V
        this.current = null;  // 16A, 20A
        this.power = null;    // Voor dimmers/LED: 400W, 600W
        
        // Physical properties
        this.poles = null;    // aantal polen (1, 2, 3)
        this.positions = null; // aantal standen
        this.mounting_depth = null;  // inbouwdiepte in mm
        
        // Design & compatibility
        this.color = null;    // wit, zwart, rvs, etc.
        this.finish = null;   // mat, glanzend, geborsteld
        this.series = null;   // Gira E2, Jung A500, etc.
        this.frame_slots = null;  // 1-voudig, 2-voudig, etc.
        
        // Features
        this.led_indication = null;
        this.child_protection = null;
        this.ip_rating = null;  // IP44, IP65
        this.smart_compatible = null;
        
        // Packaging
        this.quantity = null;
        this.includes_frame = null;
    }
}

/**
 * Parser voor Nederlandse schakelmateriaal
 */
class SwitchingMaterialParser {
    constructor() {
        this._compilePatterns();
        this._loadVocabularies();
    }
    
    _compilePatterns() {
        // 1. PRODUCT TYPE PATTERNS
        this.product_type_patterns = {
            'schakelaar': /\b(?:schakelaar|switch|schak\.?)\b/gi,
            'stopcontact': /\b(?:stopcontact|socket|wandcontactdoos|wcd)\b/gi,
            'dimmer': /\b(?:dimmer|dim\.?)\b/gi,
            'drukknop': /\b(?:drukknop|druktoets|push.*?button)\b/gi,
            'frame': /\b(?:frame|afdekframe|afdekking)\b/gi,
            'module': /\b(?:module|inzet|mechanism)\b/gi,
            'blindplaat': /\b(?:blindplaat|blind.*?plate|afdekplaat)\b/gi,
        };
        
        // 2. SWITCH TYPE PATTERNS
        this.switch_type_patterns = {};
        this.switch_type_patterns[SwitchType.SINGLE] = /\b(?:enkelpolig|1[-\s]?polig|single)\b/gi;
        this.switch_type_patterns[SwitchType.DOUBLE] = /\b(?:dubbelpolig|2[-\s]?polig|double)\b/gi;
        this.switch_type_patterns[SwitchType.CROSSOVER] = /\b(?:wissel|crossover|cross)\b/gi;
        this.switch_type_patterns[SwitchType.INTERMEDIATE] = /\b(?:kruis|intermediate|kruisschakelaar)\b/gi;
        this.switch_type_patterns[SwitchType.PUSH_BUTTON] = /\b(?:druk|push|druktoets|bel)\b/gi;
        this.switch_type_patterns[SwitchType.SERIES] = /\b(?:serie|series)\b/gi;
        
        // 3. VOLTAGE/CURRENT PATTERNS  
        this.electrical_patterns = {
            'voltage': /(\d+)\s*[Vv](?:olt)?/g,
            'current': /(\d+)\s*[Aa](?:mp|mpère)?/g,
            'power': /(\d+)\s*[Ww](?:att)?/g,
        };
        
        // 4. FRAME/MOUNTING PATTERNS
        this.frame_patterns = [
            // "1-voudig", "2 voudig", "3-voudige"
            /(\d+)[-\s]?voudig/g,
            // "1 gang", "2-gang"
            /(\d+)[-\s]?gang/g,
            // "1-vaks", "2 vaks"  
            /(\d+)[-\s]?vaks?/g,
            // "single", "double", "triple"
            /\b(single|double|triple|quad)\b/g,
        ];
        
        // 5. COLOR PATTERNS
        this.color_patterns = [
            /\b(wit|white|weiss)\b/gi,
            /\b(zwart|black|schwarz|antraciet)\b/gi,
            /\b(grijs|grey?|gray)\b/gi,
            /\b(rvs|inox|stainless|steel)\b/gi,
            /\b(brons|bronze|brons[e]?)\b/gi,
            /\b(goud|gold|messing|brass)\b/gi,
            /\b(aluminium|alu|silver)\b/gi,
        ];
        
        // 6. SERIES/DESIGN PATTERNS
        this.series_patterns = [
            // Gira series - handle both "Gira E2" and "Gira series"
            /gira\s*(e2|e3|e22|event|esprit|classix|studio)/gi,
            // Jung series  
            /jung\s*(a\d+|as\d+|cd\d+|ls\d+)/gi,
            // Berker series
            /berker\s*(\w+)/gi,
            // Generic series
            /\b(\w+\s+(?:serie|series|line))\b/gi,
        ];
        
        // 7. FEATURE PATTERNS
        this.feature_patterns = {
            'led_indication': /\b(?:led|lamp|verlichting|glow)\b/gi,
            'child_protection': /\b(?:kinderveilig|child.*?proof|veilig)\b/gi,
            'smart': /\b(?:smart|wifi|zigbee|z-wave|app)\b/gi,
            'waterproof': /\b(?:spatwater|waterproof|ip\d+)\b/gi,
        };
        
        // 8. IP RATING PATTERN
        this.ip_pattern = /\bip\s*(\d{2})\b/gi;
        
        // 9. MOUNTING DEPTH PATTERN
        this.depth_pattern = /(?:inbouwdiepte|depth).*?(\d+(?:[.,]\d+)?)\s*mm/gi;
    }
    
    _loadVocabularies() {
        // Nederlandse schakelmateriaal termen
        this.dutch_terms = {
            'enkelpolig': SwitchType.SINGLE,
            'dubbelpolig': SwitchType.DOUBLE,
            'wissel': SwitchType.CROSSOVER,
            'kruis': SwitchType.INTERMEDIATE,
            'druk': SwitchType.PUSH_BUTTON,
            'serie': SwitchType.SERIES,
        };
        
        // Socket type mapping
        this.socket_terms = {
            'schuko': SocketType.SCHUKO,
            'frans': SocketType.FRENCH,
            'usb': SocketType.USB,
            'data': SocketType.DATA,
            'rj45': SocketType.DATA,
            'telefoon': SocketType.PHONE,
            'tv': SocketType.TV_SAT,
            'sat': SocketType.TV_SAT,
            'antenne': SocketType.TV_SAT,
        };
        
        // Color normalization
        this.color_mapping = {
            'wit': 'wit', 'white': 'wit', 'weiss': 'wit',
            'zwart': 'zwart', 'black': 'zwart', 'schwarz': 'zwart', 'antraciet': 'zwart',
            'grijs': 'grijs', 'grey': 'grijs', 'gray': 'grijs',
            'rvs': 'rvs', 'inox': 'rvs', 'stainless': 'rvs', 'steel': 'rvs',
            'brons': 'brons', 'bronze': 'brons',
            'goud': 'goud', 'gold': 'goud', 'messing': 'goud', 'brass': 'goud',
            'aluminium': 'aluminium', 'alu': 'aluminium', 'silver': 'aluminium',
        };
    }
    
    /**
     * Parse schakelmateriaal specificaties
     * 
     * @param {string} title - Product titel
     * @param {string} description - Product beschrijving
     * @param {string} breadcrumbs - Breadcrumb pad voor context
     * @returns {SwitchingSpecs} - Object met geparste waarden
     */
    parseSwitchingMaterial(title, description = "", breadcrumbs = "") {
        const specs = new SwitchingSpecs();
        const text = `${breadcrumbs} ${title} ${description}`.trim();
        
        // 1. Identify product type
        specs.product_type = this._extractProductType(text);
        
        // 2. Extract switch type (if applicable)
        specs.switch_type = this._extractSwitchType(text);
        
        // 3. Extract socket type (if applicable)
        specs.socket_type = this._extractSocketType(text);
        
        // 4. Extract electrical specifications
        specs.voltage = this._extractVoltage(text);
        specs.current = this._extractCurrent(text);
        specs.power = this._extractPower(text);
        
        // 5. Extract physical properties
        specs.poles = this._extractPoles(text);
        specs.frame_slots = this._extractFrameSlots(text);
        specs.mounting_depth = this._extractMountingDepth(text);
        
        // 6. Extract design properties
        specs.color = this._extractColor(text);
        specs.series = this._extractSeries(text);
        
        // 7. Extract features
        specs.led_indication = this._hasFeature(text, 'led_indication');
        specs.child_protection = this._hasFeature(text, 'child_protection');
        specs.smart_compatible = this._hasFeature(text, 'smart');
        specs.ip_rating = this._extractIpRating(text);
        
        // 8. Extract packaging info
        specs.quantity = this._extractQuantity(text);
        specs.includes_frame = this._includesFrame(text);
        
        return specs;
    }
    
    _extractProductType(text) {
        for (const [productType, pattern] of Object.entries(this.product_type_patterns)) {
            if (pattern.test(text)) {
                return productType;
            }
        }
        return null;
    }
    
    _extractSwitchType(text) {
        for (const [switchType, pattern] of Object.entries(this.switch_type_patterns)) {
            if (pattern.test(text)) {
                return switchType;  
            }
        }
        return null;
    }
    
    _extractSocketType(text) {
        const textLower = text.toLowerCase();
        for (const [term, socketType] of Object.entries(this.socket_terms)) {
            if (textLower.includes(term)) {
                return socketType;
            }
        }
        return null;
    }
    
    _extractVoltage(text) {
        this.electrical_patterns.voltage.lastIndex = 0; // Reset regex
        const matches = this.electrical_patterns.voltage.exec(text);
        if (matches && matches[1]) {
            const voltage = parseInt(matches[1]);
            // Normalize common voltages
            if ([220, 230, 240].includes(voltage)) {
                return 230;
            } else if ([380, 400].includes(voltage)) {
                return 400;
            }
            return voltage;
        }
        return null;
    }
    
    _extractCurrent(text) {
        this.electrical_patterns.current.lastIndex = 0; // Reset regex
        const matches = this.electrical_patterns.current.exec(text);
        return (matches && matches[1]) ? parseInt(matches[1]) : null;
    }
    
    _extractPower(text) {
        this.electrical_patterns.power.lastIndex = 0; // Reset regex
        const matches = this.electrical_patterns.power.exec(text);
        return (matches && matches[1]) ? parseInt(matches[1]) : null;
    }
    
    _extractPoles(text) {
        // Look for explicit pole mentions
        const poleMatches = text.match(/(\d+)[-\s]?polig/gi);
        if (poleMatches && poleMatches[0]) {
            const numberMatch = poleMatches[0].match(/\d+/);
            if (numberMatch) {
                return parseInt(numberMatch[0]);
            }
        }
        
        // Infer from switch type
        const textLower = text.toLowerCase();
        if (textLower.includes('enkelpolig') || textLower.includes('single')) {
            return 1;
        } else if (textLower.includes('dubbelpolig') || textLower.includes('double')) {
            return 2;
        }
        
        return null;
    }
    
    _extractFrameSlots(text) {
        for (const pattern of this.frame_patterns) {
            pattern.lastIndex = 0; // Reset regex
            const matches = pattern.exec(text);
            if (matches && matches[1]) {
                const match = matches[1];
                if (/^\d+$/.test(match)) {
                    return parseInt(match);
                } else {
                    // Handle text numbers  
                    const textNumbers = {
                        'single': 1, 'double': 2, 'triple': 3, 'quad': 4
                    };
                    return textNumbers[match.toLowerCase()] || null;
                }
            }
        }
        return null;
    }
    
    _extractMountingDepth(text) {
        this.depth_pattern.lastIndex = 0; // Reset regex
        const matches = this.depth_pattern.exec(text);
        if (matches && matches[1]) {
            return parseFloat(matches[1].replace(',', '.'));
        }
        return null;
    }
    
    _extractColor(text) {
        for (const pattern of this.color_patterns) {
            const matches = text.match(pattern);
            if (matches && matches[0]) {
                const color = matches[0].toLowerCase();
                return this.color_mapping[color] || color;
            }
        }
        return null;
    }
    
    _extractSeries(text) {
        for (const pattern of this.series_patterns) {
            pattern.lastIndex = 0; // Reset regex
            const matches = pattern.exec(text);
            if (matches && matches[1]) {
                return matches[1].trim();
            }
        }
        return null;
    }
    
    _hasFeature(text, feature) {
        if (feature in this.feature_patterns) {
            return this.feature_patterns[feature].test(text);
        }
        return null;
    }
    
    _extractIpRating(text) {
        this.ip_pattern.lastIndex = 0; // Reset regex
        const matches = this.ip_pattern.exec(text);
        return (matches && matches[1]) ? `IP${matches[1]}` : null;
    }
    
    _extractQuantity(text) {
        const quantityPatterns = [
            /(?:per\s+)?(\d+)\s*(?:stuks?|st\.?|pcs?)/gi,
            /(\d+)\s*stuks?\s*per/gi,
            /verpakking\s*(\d+)/gi,
        ];
        
        for (const pattern of quantityPatterns) {
            pattern.lastIndex = 0; // Reset regex
            const matches = pattern.exec(text);
            if (matches && matches[1]) {
                return parseInt(matches[1]);
            }
        }
        
        const textLower = text.toLowerCase();
        return ['per stuk', 'los'].some(word => textLower.includes(word)) ? 1 : null;
    }
    
    _includesFrame(text) {
        const textLower = text.toLowerCase();
        if (['inclusief frame', 'met frame', 'incl. frame'].some(term => textLower.includes(term))) {
            return true;
        } else if (['exclusief frame', 'zonder frame', 'excl. frame'].some(term => textLower.includes(term))) {
            return false;
        }
        return null;
    }
}

/**
 * Enhanced product parser combining cable + switching material
 */
class ElektramatSwitchingParser {
    constructor() {
        this.switching_parser = new SwitchingMaterialParser();
    }
    
    /**
     * Parse een compleet schakelmateriaal product van Elektramat
     * 
     * @param {Object} productData - Dict met scraped fields (title, url, price, etc.)
     * @returns {Object} - Enhanced product dict met geparste specificaties
     */
    parseProduct(productData) {
        // Start met originele data
        const enhancedProduct = { ...productData };
        
        // Parse switching specs
        const specs = this.switching_parser.parseSwitchingMaterial(
            productData.title || '',
            productData.description || '',
            productData.breadcrumb || ''
        );
        
        // Voeg geparste specs toe met 'unknown' fallbacks voor Google Sheets
        enhancedProduct.product_type = specs.product_type || 'unknown';
        enhancedProduct.switch_type = specs.switch_type || 'unknown';
        enhancedProduct.socket_type = specs.socket_type || 'unknown';
        enhancedProduct.voltage = specs.voltage || 'unknown';
        enhancedProduct.current = specs.current || 'unknown';
        enhancedProduct.power = specs.power || 'unknown';
        enhancedProduct.poles = specs.poles || 'unknown';
        enhancedProduct.frame_slots = specs.frame_slots || 'unknown';
        enhancedProduct.mounting_depth = specs.mounting_depth || 'unknown';
        enhancedProduct.switching_color = specs.color || 'unknown';
        enhancedProduct.series = specs.series || 'unknown';
        enhancedProduct.led_indication = specs.led_indication !== null ? specs.led_indication : 'unknown';
        enhancedProduct.child_protection = specs.child_protection !== null ? specs.child_protection : 'unknown';
        enhancedProduct.ip_rating = specs.ip_rating || 'unknown';
        enhancedProduct.smart_compatible = specs.smart_compatible !== null ? specs.smart_compatible : 'unknown';
        enhancedProduct.switching_quantity = specs.quantity || 'unknown';
        enhancedProduct.includes_frame = specs.includes_frame !== null ? specs.includes_frame : 'unknown';
        enhancedProduct.parsed_at = new Date().toISOString();
        enhancedProduct.switching_parsing_confidence = this._calculateConfidence(specs);
        
        return enhancedProduct;
    }
    
    _calculateConfidence(specs) {
        const fields = [
            specs.product_type,
            specs.switch_type, 
            specs.socket_type,
            specs.voltage,
            specs.current,
            specs.power,
            specs.poles,
            specs.frame_slots,
            specs.color,
            specs.series,
            specs.quantity
        ];
        const parsedCount = fields.filter(field => field !== null).length;
        return parsedCount / fields.length;
    }
}

/**
 * Test function voor schakelmateriaal parser
 */
function testSwitchingParser() {
    console.log("🧪 Testing Switching Material Parser...");
    const parser = new SwitchingMaterialParser();
    
    const testCases = [
        {
            input: 'Gira E2 enkelpolige schakelaar wit 16A 230V',
            expected: {
                product_type: 'schakelaar',
                switch_type: SwitchType.SINGLE,
                voltage: 230,
                current: 16,
                color: 'wit',
                series: 'E2'
            }
        },
        {
            input: 'Jung A500 2-voudig afdekframe antraciet mat',
            expected: {
                product_type: 'frame',
                frame_slots: 2,
                color: 'zwart',
                series: 'A500'
            }
        },
        {
            input: 'Berker S.1 dimmer LED 400W universeel wit glanzend',
            expected: {
                product_type: 'dimmer',
                power: 400,
                color: 'wit',
                series: 'S.1'
            }
        },
        {
            input: 'EMAT schuko stopcontact met randaarde kinderveilig IP44',
            expected: {
                product_type: 'stopcontact',
                socket_type: SocketType.SCHUKO,
                child_protection: true,
                ip_rating: 'IP44'
            }
        },
        {
            input: 'Busch-Jaeger Reflex SI wisselschakelaar 3-voudig rvs per 5 stuks',
            expected: {
                product_type: 'schakelaar',
                switch_type: SwitchType.CROSSOVER,
                frame_slots: 3,
                color: 'rvs',
                quantity: 5
            }
        }
    ];
    
    testCases.forEach((test, i) => {
        const specs = parser.parseSwitchingMaterial(test.input);
        console.log(`\nTest ${i + 1}: ${test.input}`);
        console.log(`  Type: ${specs.product_type}`);
        console.log(`  Switch Type: ${specs.switch_type}`);
        console.log(`  Socket Type: ${specs.socket_type}`);
        console.log(`  Voltage: ${specs.voltage}V`);
        console.log(`  Current: ${specs.current}A`);
        console.log(`  Power: ${specs.power}W`);
        console.log(`  Poles: ${specs.poles}`);
        console.log(`  Frame Slots: ${specs.frame_slots}`);
        console.log(`  Color: ${specs.color}`);
        console.log(`  Series: ${specs.series}`);
        console.log(`  LED: ${specs.led_indication}`);
        console.log(`  Child Safe: ${specs.child_protection}`);
        console.log(`  IP Rating: ${specs.ip_rating}`);
        console.log(`  Quantity: ${specs.quantity}`);
    });
}

module.exports = {
    SwitchType,
    SocketType,
    SwitchingSpecs,
    SwitchingMaterialParser,
    ElektramatSwitchingParser,
    testSwitchingParser
};