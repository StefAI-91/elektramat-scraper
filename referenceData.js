const fs = require('fs');
const path = require('path');

class ReferenceData {
  constructor() {
    this.brands = [];
    this.colors = [];
    this.brandVariations = new Map();
    this.colorMappings = new Map();
    this.loadReferenceData();
  }

  loadReferenceData() {
    try {
      const referencePath = path.join(__dirname, 'reference.md');
      const content = fs.readFileSync(referencePath, 'utf8');
      
      // Parse the markdown file
      const lines = content.split('\n');
      let currentSection = null;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('##')) {
          currentSection = trimmedLine.replace('##', '').trim().toLowerCase();
          continue;
        }
        
        if (trimmedLine && currentSection) {
          if (currentSection === 'merken') {
            this.brands.push(trimmedLine);
            // Create variations for fuzzy matching
            this.createBrandVariations(trimmedLine);
          } else if (currentSection === 'kleuren') {
            this.colors.push(trimmedLine);
            // Create color mappings
            this.createColorMappings(trimmedLine);
          }
        }
      }
      
      console.log(`✅ Loaded ${this.brands.length} brands and ${this.colors.length} colors`);
    } catch (error) {
      console.error('❌ Failed to load reference data:', error.message);
    }
  }

  createBrandVariations(brand) {
    // Store original brand
    const normalized = this.normalizeBrand(brand);
    
    // Common variations
    const variations = [
      brand,
      brand.toLowerCase(),
      brand.toUpperCase(),
      normalized,
      brand.replace(/[\s-]/g, ''), // Remove spaces and hyphens
      brand.replace(/[\s-]/g, '').toLowerCase()
    ];
    
    // Map all variations to the normalized brand name
    variations.forEach(variation => {
      this.brandVariations.set(variation, normalized);
    });
  }

  normalizeBrand(brand) {
    // Normalize brand names to consistent format
    // First letter uppercase, rest as-is
    return brand.split(/\s+/)
      .map(word => {
        // Keep acronyms in uppercase (e.g., ABB, ETI)
        if (word.length <= 3 && word === word.toUpperCase()) {
          return word;
        }
        // Otherwise, capitalize first letter
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  createColorMappings(color) {
    const normalized = color.toLowerCase();
    
    // Dutch to English mappings
    const translations = {
      'zwart': 'black',
      'wit': 'white',
      'grijs': 'grey',
      'bruin': 'brown',
      'blauw': 'blue',
      'groen': 'green',
      'geel': 'yellow',
      'oranje': 'orange',
      'rood': 'red',
      'zilver': 'silver',
      'goud': 'gold',
      'brons': 'bronze',
      'aluminium': 'aluminum',
      'edelstaal': 'stainless steel',
      'antraciet': 'anthracite',
      'crème': 'cream',
      'creme': 'cream',
      'zuiver': 'pure',
      'glans': 'glossy',
      'glanzend': 'glossy',
      'mat': 'matte'
    };
    
    // Create English version
    let englishVersion = normalized;
    Object.entries(translations).forEach(([dutch, english]) => {
      englishVersion = englishVersion.replace(new RegExp(dutch, 'gi'), english);
    });
    
    // Store mappings
    this.colorMappings.set(normalized, {
      original: color,
      normalized: normalized,
      english: englishVersion,
      display: this.formatColorName(color)
    });
  }

  formatColorName(color) {
    // Format color name for display (Title Case)
    return color.split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Find brand in text using fuzzy matching
  findBrand(text) {
    if (!text) return null;
    
    const normalizedText = text.toLowerCase();
    
    // First, try exact match with variations
    for (const [variation, normalizedBrand] of this.brandVariations) {
      if (normalizedText.includes(variation.toLowerCase())) {
        return {
          found: normalizedBrand,
          confidence: 1.0,
          original: variation
        };
      }
    }
    
    // If no exact match, try fuzzy matching
    const words = text.split(/[\s,.-]+/);
    for (const word of words) {
      const match = this.fuzzyMatchBrand(word);
      if (match) {
        return match;
      }
    }
    
    return null;
  }

  fuzzyMatchBrand(word) {
    const threshold = 0.8; // 80% similarity required
    
    for (const brand of this.brands) {
      const similarity = this.calculateSimilarity(word.toLowerCase(), brand.toLowerCase());
      if (similarity >= threshold) {
        return {
          found: this.normalizeBrand(brand),
          confidence: similarity,
          original: word
        };
      }
    }
    
    return null;
  }

  calculateSimilarity(str1, str2) {
    // Levenshtein distance-based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Find and normalize color
  findColor(text) {
    if (!text) return null;
    
    const normalizedText = text.toLowerCase();
    const foundColors = [];
    
    // Check each known color
    for (const color of this.colors) {
      if (normalizedText.includes(color.toLowerCase())) {
        const colorData = this.colorMappings.get(color.toLowerCase());
        foundColors.push({
          found: colorData.display,
          normalized: colorData.normalized,
          english: colorData.english,
          confidence: 1.0
        });
      }
    }
    
    // Return the most specific color (longest match)
    if (foundColors.length > 0) {
      return foundColors.reduce((a, b) => 
        a.normalized.length > b.normalized.length ? a : b
      );
    }
    
    return null;
  }

  // Extract all reference data from text
  extractReferenceData(text) {
    return {
      brand: this.findBrand(text),
      color: this.findColor(text)
    };
  }
}

module.exports = new ReferenceData();