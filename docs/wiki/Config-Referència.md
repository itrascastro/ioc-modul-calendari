# Config - Referència Tècnica

Aquesta referència documenta el sistema de configuració del Calendari IOC, que gestiona la càrrega dinàmica de configuracions semestrals, esdeveniments del sistema i paràmetres específics per a diferents tipus de calendaris.

## Visió General del Sistema de Configuració

El **sistema de configuració** implementa un carregador dinàmic que combina múltiples fonts de configuració JSON per proporcionar esdeveniments del sistema, categories per defecte i paràmetres específics segons el tipus de calendari.

### Arquitectura de Configuració

**Ubicació**: `js/config/`

**Fitxers de configuració**: `config/*.json`
**Patró principal**: Strategy Pattern amb Composition per combinar configuracions
**Càrrega dinàmica**: Configuracions carregades segons demanda i tipus de calendari

## SemesterConfig

### Propòsit i Responsabilitats

El **SemesterConfig** és el component central que gestiona la càrrega, validació i fusió de configuracions per a diferents tipus de calendaris, proporcionant una interfície unificada per accedir a esdeveniments del sistema i categories predefinides.

### API Pública

#### `loadConfig(calendarType)`

Carrega i fusiona configuracions per a un tipus específic de calendari.

```javascript
/**
 * Carrega configuració completa per tipus de calendari
 * @param {string} calendarType - Tipus de calendari (FP, BTX, ALTRO)
 * @returns {Promise<Object>} Configuració fusionada
 */
async loadConfig(calendarType) {
    try {
        // Carregar configuracions base
        const [commonConfig, specificConfig] = await Promise.all([
            this.loadCommonConfig(),
            this.loadSpecificConfig(calendarType)
        ]);
        
        // Fusionar configuracions
        const mergedConfig = this.mergeConfigurations(commonConfig, specificConfig);
        
        // Validar configuració resultant
        const validation = this.validateConfiguration(mergedConfig);
        if (!validation.isValid) {
            throw new Error(`Configuració invàlida: ${validation.errors.join(', ')}`);
        }
        
        // Processar configuració final
        return this.postProcessConfiguration(mergedConfig, calendarType);
        
    } catch (error) {
        console.error(`Error carregant configuració per ${calendarType}:`, error);
        return this.getFallbackConfiguration(calendarType);
    }
}
```

#### `loadCommonConfig()`

Carrega la configuració comuna que s'aplica a tots els tipus de calendaris.

```javascript
/**
 * Carrega configuració comuna (festius generals, etc.)
 * @returns {Promise<Object>} Configuració comuna
 */
async loadCommonConfig() {
    const configPath = 'config/common-semestre.json';
    
    try {
        const response = await fetch(configPath);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const config = await response.json();
        
        // Validar estructura base
        this.validateConfigStructure(config, 'common');
        
        return config;
        
    } catch (error) {
        console.warn(`No s'ha pogut carregar configuració comuna: ${error.message}`);
        return this.getDefaultCommonConfig();
    }
}
```

#### `loadSpecificConfig(calendarType)`

Carrega configuració específica per al tipus de calendari indicat.

```javascript
/**
 * Carrega configuració específica per tipus
 * @param {string} calendarType - Tipus de calendari
 * @returns {Promise<Object>} Configuració específica
 */
async loadSpecificConfig(calendarType) {
    const configMap = {
        'FP': 'config/fp-semestre.json',
        'BTX': 'config/btx-semestre.json'
    };
    
    const configPath = configMap[calendarType];
    
    if (!configPath) {
        // Tipus no reconegut, retornar configuració buida
        return this.getEmptySpecificConfig();
    }
    
    try {
        const response = await fetch(configPath);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const config = await response.json();
        
        // Validar estructura específica
        this.validateConfigStructure(config, calendarType);
        
        return config;
        
    } catch (error) {
        console.warn(`No s'ha pogut carregar configuració per ${calendarType}: ${error.message}`);
        return this.getDefaultSpecificConfig(calendarType);
    }
}
```

### Implementació de Fusió de Configuracions

#### Fusió Principal

```javascript
/**
 * Fusiona configuració comuna amb específica
 * @param {Object} commonConfig - Configuració comuna
 * @param {Object} specificConfig - Configuració específica
 * @returns {Object} Configuració fusionada
 */
mergeConfigurations(commonConfig, specificConfig) {
    const merged = {
        metadata: this.mergeMetadata(commonConfig, specificConfig),
        systemEvents: this.mergeSystemEvents(commonConfig, specificConfig),
        systemCategories: this.mergeSystemCategories(commonConfig, specificConfig),
        settings: this.mergeSettings(commonConfig, specificConfig)
    };
    
    return merged;
}
```

#### Fusió d'Esdeveniments del Sistema

```javascript
/**
 * Fusiona esdeveniments del sistema evitant duplicats
 * @param {Object} commonConfig - Configuració comuna
 * @param {Object} specificConfig - Configuració específica
 * @returns {Array} Esdeveniments fusionats
 */
mergeSystemEvents(commonConfig, specificConfig) {
    const commonEvents = commonConfig.systemEvents || [];
    const specificEvents = specificConfig.systemEvents || [];
    
    // Combinar esdeveniments
    const allEvents = [...commonEvents, ...specificEvents];
    
    // Eliminar duplicats per ID
    const uniqueEvents = this.deduplicateById(allEvents);
    
    // Ordenar per data
    return uniqueEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
}
```

#### Fusió de Categories del Sistema

```javascript
/**
 * Fusiona categories del sistema
 * @param {Object} commonConfig - Configuració comuna
 * @param {Object} specificConfig - Configuració específica
 * @returns {Array} Categories fusionades
 */
mergeSystemCategories(commonConfig, specificConfig) {
    const commonCategories = commonConfig.systemCategories || [];
    const specificCategories = specificConfig.systemCategories || [];
    
    // Les categories específiques tenen prioritat sobre les comunes
    const categoryMap = new Map();
    
    // Afegir categories comunes primer
    commonCategories.forEach(cat => {
        categoryMap.set(cat.id, cat);
    });
    
    // Sobreescriure amb categories específiques
    specificCategories.forEach(cat => {
        categoryMap.set(cat.id, cat);
    });
    
    return Array.from(categoryMap.values());
}
```

### Validació de Configuracions

#### Validació d'Estructura

```javascript
/**
 * Valida l'estructura d'una configuració
 * @param {Object} config - Configuració a validar
 * @param {string} type - Tipus de configuració
 * @returns {Object} Resultat de validació
 */
validateConfigStructure(config, type) {
    const validation = {
        isValid: true,
        errors: [],
        warnings: []
    };
    
    // Validacions comunes
    if (!config || typeof config !== 'object') {
        validation.isValid = false;
        validation.errors.push('Configuració ha de ser un objecte vàlid');
        return validation;
    }
    
    // Validar metadades
    if (config.metadata) {
        const metaValidation = this.validateMetadata(config.metadata);
        this.mergeValidationResults(validation, metaValidation);
    }
    
    // Validar esdeveniments del sistema
    if (config.systemEvents) {
        const eventsValidation = this.validateSystemEvents(config.systemEvents);
        this.mergeValidationResults(validation, eventsValidation);
    }
    
    // Validar categories del sistema
    if (config.systemCategories) {
        const categoriesValidation = this.validateSystemCategories(config.systemCategories);
        this.mergeValidationResults(validation, categoriesValidation);
    }
    
    // Validacions específiques per tipus
    const typeValidation = this.validateByType(config, type);
    this.mergeValidationResults(validation, typeValidation);
    
    return validation;
}
```

#### Validació d'Esdeveniments

```javascript
/**
 * Valida esdeveniments del sistema
 * @param {Array} events - Array d'esdeveniments a validar
 * @returns {Object} Resultat de validació
 */
validateSystemEvents(events) {
    const validation = {
        isValid: true,
        errors: [],
        warnings: []
    };
    
    if (!Array.isArray(events)) {
        validation.isValid = false;
        validation.errors.push('systemEvents ha de ser un array');
        return validation;
    }
    
    const eventIds = new Set();
    
    events.forEach((event, index) => {
        const eventPrefix = `Esdeveniment ${index + 1}`;
        
        // ID obligatori i únic
        if (!event.id) {
            validation.errors.push(`${eventPrefix}: ID obligatori`);
            validation.isValid = false;
        } else if (eventIds.has(event.id)) {
            validation.errors.push(`${eventPrefix}: ID duplicat (${event.id})`);
            validation.isValid = false;
        } else {
            eventIds.add(event.id);
        }
        
        // Títol obligatori
        if (!event.title) {
            validation.errors.push(`${eventPrefix}: Títol obligatori`);
            validation.isValid = false;
        }
        
        // Data vàlida
        if (!event.date) {
            validation.errors.push(`${eventPrefix}: Data obligatòria`);
            validation.isValid = false;
        } else if (!this.isValidDateFormat(event.date)) {
            validation.errors.push(`${eventPrefix}: Format de data invàlid (${event.date})`);
            validation.isValid = false;
        }
        
        // Categoria vàlida
        if (!event.categoryId) {
            validation.warnings.push(`${eventPrefix}: No té categoria assignada`);
        }
        
        // Marcador de sistema
        if (event.isSystemEvent !== true) {
            validation.warnings.push(`${eventPrefix}: No marcat com esdeveniment del sistema`);
        }
    });
    
    return validation;
}
```

#### Validació de Categories

```javascript
/**
 * Valida categories del sistema
 * @param {Array} categories - Array de categories a validar
 * @returns {Object} Resultat de validació
 */
validateSystemCategories(categories) {
    const validation = {
        isValid: true,
        errors: [],
        warnings: []
    };
    
    if (!Array.isArray(categories)) {
        validation.isValid = false;
        validation.errors.push('systemCategories ha de ser un array');
        return validation;
    }
    
    const categoryIds = new Set();
    const categoryNames = new Set();
    
    categories.forEach((category, index) => {
        const catPrefix = `Categoria ${index + 1}`;
        
        // ID obligatori i únic
        if (!category.id) {
            validation.errors.push(`${catPrefix}: ID obligatori`);
            validation.isValid = false;
        } else if (categoryIds.has(category.id)) {
            validation.errors.push(`${catPrefix}: ID duplicat (${category.id})`);
            validation.isValid = false;
        } else {
            categoryIds.add(category.id);
        }
        
        // Nom obligatori
        if (!category.name) {
            validation.errors.push(`${catPrefix}: Nom obligatori`);
            validation.isValid = false;
        } else if (categoryNames.has(category.name)) {
            validation.warnings.push(`${catPrefix}: Nom duplicat (${category.name})`);
        } else {
            categoryNames.add(category.name);
        }
        
        // Color vàlid
        if (!category.color) {
            validation.errors.push(`${catPrefix}: Color obligatori`);
            validation.isValid = false;
        } else if (!this.isValidColorFormat(category.color)) {
            validation.errors.push(`${catPrefix}: Format de color invàlid (${category.color})`);
            validation.isValid = false;
        }
        
        // Marcador de sistema
        if (category.isSystem !== true) {
            validation.warnings.push(`${catPrefix}: No marcada com categoria del sistema`);
        }
    });
    
    return validation;
}
```

### Configuracions per Defecte

#### Configuració Comuna per Defecte

```javascript
/**
 * Configuració comuna de fallback
 * @returns {Object} Configuració per defecte
 */
getDefaultCommonConfig() {
    return {
        metadata: {
            version: '1.0',
            type: 'common',
            description: 'Configuració comuna per defecte',
            lastModified: new Date().toISOString()
        },
        systemEvents: [
            {
                id: 'festiu_2025_01',
                title: 'Dia de Reis',
                date: '2025-01-06',
                categoryId: 'FESTIU_GENERIC',
                description: 'Festiu oficial',
                isSystemEvent: true
            },
            {
                id: 'festiu_2025_02',
                title: 'Festa del Treball',
                date: '2025-05-01',
                categoryId: 'FESTIU_GENERIC',
                description: 'Festiu oficial',
                isSystemEvent: true
            }
        ],
        systemCategories: [
            {
                id: 'FESTIU_GENERIC',
                name: 'FESTIU',
                color: '#e53e3e',
                isSystem: true
            },
            {
                id: 'IOC_GENERIC',
                name: 'IOC',
                color: '#3182ce',
                isSystem: true
            }
        ]
    };
}
```

#### Configuració Específica per Defecte

```javascript
/**
 * Configuració específica de fallback segons tipus
 * @param {string} calendarType - Tipus de calendari
 * @returns {Object} Configuració per defecte
 */
getDefaultSpecificConfig(calendarType) {
    const baseConfig = {
        metadata: {
            version: '1.0',
            type: calendarType,
            description: `Configuració ${calendarType} per defecte`,
            lastModified: new Date().toISOString()
        },
        systemEvents: [],
        systemCategories: []
    };
    
    switch (calendarType) {
        case 'FP':
            return {
                ...baseConfig,
                systemEvents: [
                    {
                        id: 'paf1_default',
                        title: 'PAF1 - Primera convocatòria',
                        date: '2024-12-16',
                        categoryId: 'PAF_GENERIC',
                        description: 'Prova d\'Avaluació Final',
                        isSystemEvent: true
                    }
                ],
                systemCategories: [
                    {
                        id: 'PAF_GENERIC',
                        name: 'PAF',
                        color: '#fd7f28',
                        isSystem: true
                    }
                ]
            };
            
        case 'BTX':
            return {
                ...baseConfig,
                systemEvents: [
                    {
                        id: 'examens_default',
                        title: 'Exàmens Finals',
                        date: '2025-01-20',
                        categoryId: 'EXAMENS_GENERIC',
                        description: 'Període d\'exàmens',
                        isSystemEvent: true
                    }
                ],
                systemCategories: [
                    {
                        id: 'EXAMENS_GENERIC',
                        name: 'EXAMENS',
                        color: '#805ad5',
                        isSystem: true
                    }
                ]
            };
            
        default:
            return baseConfig;
    }
}
```

### Utilitats de Configuració

#### Utilitats de Validació

```javascript
/**
 * Utilitats per validar formats
 */
class ConfigValidationUtils {
    static isValidDateFormat(dateString) {
        // Format esperat: YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateString)) {
            return false;
        }
        
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }
    
    static isValidColorFormat(colorString) {
        // Format hexadecimal: #RRGGBB
        const colorRegex = /^#[0-9A-Fa-f]{6}$/;
        return colorRegex.test(colorString);
    }
    
    static isValidId(idString) {
        // IDs han de ser alfanumèrics amb guions baixos
        const idRegex = /^[A-Za-z0-9_]+$/;
        return idRegex.test(idString);
    }
}
```

#### Cache de Configuracions

```javascript
/**
 * Sistema de cache per configuracions
 */
class ConfigurationCache {
    constructor() {
        this.cache = new Map();
        this.timestamps = new Map();
        this.ttl = 5 * 60 * 1000; // 5 minuts
    }
    
    get(key) {
        const timestamp = this.timestamps.get(key);
        
        if (timestamp && (Date.now() - timestamp) < this.ttl) {
            return this.cache.get(key);
        }
        
        // Cache expirat
        this.cache.delete(key);
        this.timestamps.delete(key);
        return null;
    }
    
    set(key, value) {
        this.cache.set(key, value);
        this.timestamps.set(key, Date.now());
    }
    
    clear() {
        this.cache.clear();
        this.timestamps.clear();
    }
    
    has(key) {
        return this.get(key) !== null;
    }
}
```

### Postprocessament de Configuracions

```javascript
/**
 * Postprocessament final de configuracions
 * @param {Object} config - Configuració fusionada
 * @param {string} calendarType - Tipus de calendari
 * @returns {Object} Configuració processada
 */
postProcessConfiguration(config, calendarType) {
    // Afegir metadades de processament
    config.metadata.processed = true;
    config.metadata.processedAt = new Date().toISOString();
    config.metadata.calendarType = calendarType;
    
    // Processar dates relatives si n'hi ha
    config.systemEvents = this.processRelativeDates(config.systemEvents);
    
    // Aplicar transformacions específiques del tipus
    config = this.applyTypeSpecificTransformations(config, calendarType);
    
    // Optimitzar per performance
    config = this.optimizeForPerformance(config);
    
    return config;
}

/**
 * Processa dates relatives en esdeveniments
 * @param {Array} events - Esdeveniments amb possibles dates relatives
 * @returns {Array} Esdeveniments amb dates absolutes
 */
processRelativeDates(events) {
    return events.map(event => {
        if (event.dateRelative) {
            // Processar dates relatives com "first-monday-september"
            event.date = this.resolveRelativeDate(event.dateRelative);
            delete event.dateRelative;
        }
        return event;
    });
}
```

### Gestió d'Errors i Fallbacks

```javascript
/**
 * Gestió robusta d'errors amb fallbacks
 */
class ConfigurationErrorHandler {
    static handleLoadError(error, context) {
        console.error(`Error carregant configuració (${context}):`, error);
        
        // Registrar error per monitoring
        this.logError(error, context);
        
        // Determinar estratègia de fallback
        return this.selectFallbackStrategy(error, context);
    }
    
    static selectFallbackStrategy(error, context) {
        if (error.name === 'NetworkError') {
            return 'cache'; // Usar configuració en cache
        } else if (error.name === 'SyntaxError') {
            return 'default'; // Usar configuració per defecte
        } else {
            return 'minimal'; // Configuració mínima
        }
    }
    
    static logError(error, context) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            context: context,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Enviar a sistema de logging si està disponible
        if (window.errorReporting) {
            window.errorReporting.logConfigError(errorLog);
        }
        
        // Guardar en localStorage per debugging
        try {
            const existingLogs = JSON.parse(localStorage.getItem('config-errors') || '[]');
            existingLogs.push(errorLog);
            
            // Mantenir només els últims 10 errors
            const recentLogs = existingLogs.slice(-10);
            localStorage.setItem('config-errors', JSON.stringify(recentLogs));
        } catch (storageError) {
            console.warn('No s\'ha pogut guardar error log:', storageError);
        }
    }
}
```

El sistema de configuració proporciona flexibilitat i robustesa per gestionar diferents tipus de calendaris i configuracions acadèmiques, amb validació completa i estratègies de fallback per assegurar la disponibilitat del sistema.

---
[← Import Referència](Import-Referència) | [Home](Home)