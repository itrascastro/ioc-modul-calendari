# Services - Referència Tècnica

Aquesta referència documenta els serveis especialitzats del Calendari IOC, que encapsulen lògica de negoci complexa i algoritmes específics del domini, proporcionant funcionalitats reutilitzables i desacoblades.

## Visió General dels Services

Els **services** implementen lògica de negoci especialitzada que és massa complexa per als managers o massa específica per als helpers. Segueixen principis de responsabilitat única i són fàcilment testejables i reutilitzables.

### Arquitectura dels Services

**Principis de disseny:**
- Responsabilitat única i ben definida
- Stateless (sense estat intern)
- Reutilitzables entre diferents components
- Fàcils de testejar de manera aïllada
- APIs clares i documentades

**Ubicació**: `js/services/`

## CategoryService

### Propòsit i Responsabilitats

El **CategoryService** gestiona el catàleg global de categories, proporcionant funcionalitats de sincronització, deduplicació i gestió de categories del sistema vs categories d'usuari.

### API Pública

#### `synchronizeWithGlobal(localCategories)`

Sincronitza categories locals amb el catàleg global, aplicant estratègies de fusió intel·ligent.

```javascript
/**
 * Sincronitza categories locals amb el catàleg global
 * @param {Array} localCategories - Categories locals del calendari
 * @returns {Array} Categories sincronitzades
 */
static synchronizeWithGlobal(localCategories) {
    const globalCatalog = this.getGlobalCatalog();
    const mergedCategories = [];
    
    // Afegir categories locals al catàleg global
    localCategories.forEach(localCat => {
        const existingGlobal = this.findMatchingCategory(localCat, globalCatalog);
        
        if (existingGlobal) {
            // Actualitzar categoria existent si cal
            mergedCategories.push(this.mergeCategoryData(localCat, existingGlobal));
        } else {
            // Afegir nova categoria al catàleg
            this.addToGlobalCatalog(localCat);
            mergedCategories.push(localCat);
        }
    });
    
    return mergedCategories;
}
```

#### `addToGlobalCatalog(category)`

Afegeix una categoria al catàleg global, evitant duplicats.

```javascript
/**
 * Afegeix categoria al catàleg global
 * @param {Object} category - Categoria a afegir
 * @returns {boolean} True si s'ha afegit, false si ja existia
 */
static addToGlobalCatalog(category) {
    const catalog = this.getGlobalCatalog();
    const existing = this.findMatchingCategory(category, catalog);
    
    if (existing) {
        return false; // Ja existeix
    }
    
    catalog.push({
        id: category.id,
        name: category.name,
        color: category.color,
        isSystem: category.isSystem || false,
        usageCount: 1,
        lastUsed: new Date().toISOString()
    });
    
    this.saveGlobalCatalog(catalog);
    return true;
}
```

#### `findMatchingCategory(category, catalog)`

Troba una categoria coincident al catàleg basat en nom i color.

```javascript
/**
 * Troba categoria coincident per nom i color
 * @param {Object} category - Categoria a buscar
 * @param {Array} catalog - Catàleg on buscar
 * @returns {Object|null} Categoria coincident o null
 */
static findMatchingCategory(category, catalog) {
    return catalog.find(catItem => 
        catItem.name.toLowerCase() === category.name.toLowerCase() &&
        catItem.color === category.color
    ) || null;
}
```

#### `getGlobalCatalog()`

Obté el catàleg global de categories de localStorage.

```javascript
/**
 * Obté el catàleg global de categories
 * @returns {Array} Catàleg global de categories
 */
static getGlobalCatalog() {
    try {
        const stored = localStorage.getItem('global-category-catalog');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading global catalog:', error);
        return [];
    }
}
```

#### `cleanupGlobalCatalog()`

Neteja categories no utilitzades del catàleg global.

```javascript
/**
 * Neteja categories obsoletes del catàleg global
 * @param {number} maxAgeInDays - Edat màxima en dies
 * @returns {number} Nombre de categories eliminades
 */
static cleanupGlobalCatalog(maxAgeInDays = 365) {
    const catalog = this.getGlobalCatalog();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeInDays);
    
    const filteredCatalog = catalog.filter(category => {
        // Mantenir categories del sistema
        if (category.isSystem) return true;
        
        // Mantenir categories usades recentment
        const lastUsed = new Date(category.lastUsed);
        return lastUsed > cutoffDate;
    });
    
    const removedCount = catalog.length - filteredCatalog.length;
    this.saveGlobalCatalog(filteredCatalog);
    
    return removedCount;
}
```

### Algoritmes Interns

#### Estratègia de Fusió de Categories

```javascript
/**
 * Fusiona dades de categories local i global
 * @param {Object} localCategory - Categoria local
 * @param {Object} globalCategory - Categoria del catàleg global
 * @returns {Object} Categoria fusionada
 */
static mergeCategoryData(localCategory, globalCategory) {
    return {
        id: localCategory.id,
        name: localCategory.name,
        color: localCategory.color,
        isSystem: localCategory.isSystem || globalCategory.isSystem,
        usageCount: (globalCategory.usageCount || 0) + 1,
        lastUsed: new Date().toISOString()
    };
}
```

## ReplicaService

### Propòsit i Responsabilitats

El **ReplicaService** implementa l'algoritme de replicació proporcional d'esdeveniments entre calendaris, gestionant la distribució intel·ligent i el seguiment d'esdeveniments no ubicats.

### API Pública

#### `replicateEventsProportionally(sourceEvents, targetCalendars)`

Replica esdeveniments de manera proporcional entre calendaris de destinació.

```javascript
/**
 * Replica esdeveniments de manera proporcional
 * @param {Array} sourceEvents - Esdeveniments a replicar
 * @param {Array} targetCalendars - Calendaris de destinació
 * @returns {Object} Resultat de la replicació
 */
static replicateEventsProportionally(sourceEvents, targetCalendars) {
    const result = {
        replicated: 0,
        unplaced: [],
        distribution: {}
    };
    
    // Calcular proporcions
    const proportions = this.calculateProportions(targetCalendars);
    
    // Distribuir esdeveniments
    sourceEvents.forEach(event => {
        const distribution = this.distributeEventProportionally(event, targetCalendars, proportions);
        
        if (distribution.placed) {
            result.replicated++;
            const calendarId = distribution.targetCalendar;
            result.distribution[calendarId] = (result.distribution[calendarId] || 0) + 1;
        } else {
            result.unplaced.push({
                originalEvent: event,
                reason: distribution.reason
            });
        }
    });
    
    return result;
}
```

#### `calculateProportions(calendars)`

Calcula les proporcions de distribució basades en el nombre d'esdeveniments existents.

```javascript
/**
 * Calcula proporcions de distribució entre calendaris
 * @param {Array} calendars - Calendaris de destinació
 * @returns {Object} Proporcions per calendari
 */
static calculateProportions(calendars) {
    const totalEvents = calendars.reduce((sum, cal) => sum + cal.events.length, 0);
    
    if (totalEvents === 0) {
        // Distribució equitativa si no hi ha esdeveniments
        const equalProportion = 1 / calendars.length;
        return calendars.reduce((proportions, cal) => {
            proportions[cal.id] = equalProportion;
            return proportions;
        }, {});
    }
    
    // Proporcions inversament proporcionals a la càrrega actual
    const maxEvents = Math.max(...calendars.map(cal => cal.events.length));
    const weightedTotal = calendars.reduce((sum, cal) => {
        const weight = maxEvents - cal.events.length + 1;
        return sum + weight;
    }, 0);
    
    return calendars.reduce((proportions, cal) => {
        const weight = maxEvents - cal.events.length + 1;
        proportions[cal.id] = weight / weightedTotal;
        return proportions;
    }, {});
}
```

#### `distributeEventProportionally(event, calendars, proportions)`

Distribueix un esdeveniment individual segons les proporcions calculades.

```javascript
/**
 * Distribueix un esdeveniment segons proporcions
 * @param {Object} event - Esdeveniment a distribuir
 * @param {Array} calendars - Calendaris disponibles
 * @param {Object} proportions - Proporcions de distribució
 * @returns {Object} Resultat de la distribució
 */
static distributeEventProportionally(event, calendars, proportions) {
    // Ordenar calendaris per proporció (menor càrrega primer)
    const sortedCalendars = calendars.sort((a, b) => 
        proportions[b.id] - proportions[a.id]
    );
    
    // Intentar ubicar l'esdeveniment
    for (const calendar of sortedCalendars) {
        if (this.canPlaceEventInCalendar(event, calendar)) {
            return {
                placed: true,
                targetCalendar: calendar.id,
                proportion: proportions[calendar.id]
            };
        }
    }
    
    // No s'ha pogut ubicar
    return {
        placed: false,
        reason: 'No suitable calendar found'
    };
}
```

#### `canPlaceEventInCalendar(event, calendar)`

Verifica si un esdeveniment es pot ubicar en un calendari específic.

```javascript
/**
 * Verifica si un esdeveniment es pot ubicar en un calendari
 * @param {Object} event - Esdeveniment a verificar
 * @param {Object} calendar - Calendari de destinació
 * @returns {boolean} True si es pot ubicar
 */
static canPlaceEventInCalendar(event, calendar) {
    // Verificar compatibilitat de tipus
    if (!this.isTypeCompatible(event, calendar)) {
        return false;
    }
    
    // Verificar disponibilitat de categoria
    if (!this.isCategoryAvailable(event.categoryId, calendar)) {
        return false;
    }
    
    // Verificar conflictes de data
    if (this.hasDateConflict(event, calendar)) {
        return false;
    }
    
    return true;
}
```

### Algoritmes de Distribució

#### Algoritme Proporcional Avançat

```javascript
/**
 * Algoritme de distribució proporcional amb pesos dinàmics
 * @param {Array} events - Esdeveniments a distribuir
 * @param {Array} calendars - Calendaris de destinació
 * @param {Object} options - Opcions de configuració
 * @returns {Object} Resultat detallat de la distribució
 */
static advancedProportionalDistribution(events, calendars, options = {}) {
    const weights = this.calculateDynamicWeights(calendars, options);
    const result = { distributions: [], unplaced: [] };
    
    events.forEach(event => {
        const placement = this.findOptimalPlacement(event, calendars, weights);
        
        if (placement.success) {
            result.distributions.push(placement);
            // Actualitzar pesos dinàmicament
            weights[placement.calendarId] *= options.decayFactor || 0.95;
        } else {
            result.unplaced.push({
                event,
                reasons: placement.reasons
            });
        }
    });
    
    return result;
}
```

## DateValidationService

### Propòsit i Responsabilitats

El **DateValidationService** proporciona validacions complexes de dates, considerant regles de negoci específiques, festius i restriccions acadèmiques.

### API Pública

#### `validateEventDate(date, calendarType, constraints)`

Valida si una data és vàlida per a un esdeveniment en un tipus de calendari específic.

```javascript
/**
 * Valida data d'esdeveniment segons tipus de calendari
 * @param {string|Date} date - Data a validar
 * @param {string} calendarType - Tipus de calendari (FP, BTX, ALTRO)
 * @param {Object} constraints - Restriccions adicionals
 * @returns {Object} Resultat de la validació
 */
static validateEventDate(date, calendarType, constraints = {}) {
    const validationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
    };
    
    const dateObj = new Date(date);
    
    // Validacions bàsiques
    if (!this.isValidDate(dateObj)) {
        validationResult.isValid = false;
        validationResult.errors.push('Data invàlida');
        return validationResult;
    }
    
    // Validacions específiques per tipus
    const typeValidation = this.validateByCalendarType(dateObj, calendarType);
    this.mergeValidationResults(validationResult, typeValidation);
    
    // Validacions de constraintes
    if (constraints) {
        const constraintValidation = this.validateConstraints(dateObj, constraints);
        this.mergeValidationResults(validationResult, constraintValidation);
    }
    
    // Validacions de festius
    const holidayValidation = this.validateHolidays(dateObj);
    this.mergeValidationResults(validationResult, holidayValidation);
    
    return validationResult;
}
```

#### `isWorkingDay(date, calendarType)`

Determina si una data és un dia lectiu segons el tipus de calendari.

```javascript
/**
 * Verifica si una data és dia lectiu
 * @param {Date} date - Data a verificar
 * @param {string} calendarType - Tipus de calendari
 * @returns {boolean} True si és dia lectiu
 */
static isWorkingDay(date, calendarType = 'ALTRO') {
    // Verificar dia de la setmana
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Diumenge o dissabte
        return false;
    }
    
    // Verificar festius oficials
    if (this.isOfficialHoliday(date)) {
        return false;
    }
    
    // Verificar períodes no lectius específics del tipus
    if (this.isNonLectivePeriod(date, calendarType)) {
        return false;
    }
    
    return true;
}
```

#### `getNextWorkingDay(date, calendarType)`

Obté el proper dia lectiu a partir d'una data donada.

```javascript
/**
 * Obté el proper dia lectiu
 * @param {Date} date - Data de partida
 * @param {string} calendarType - Tipus de calendari
 * @returns {Date} Proper dia lectiu
 */
static getNextWorkingDay(date, calendarType = 'ALTRO') {
    let nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    while (!this.isWorkingDay(nextDay, calendarType)) {
        nextDay.setDate(nextDay.getDate() + 1);
        
        // Protecció contra bucle infinit
        const maxIterations = 365;
        if (nextDay.getTime() - date.getTime() > maxIterations * 24 * 60 * 60 * 1000) {
            throw new Error('No working day found within one year');
        }
    }
    
    return nextDay;
}
```

#### `validateDateRange(startDate, endDate, constraints)`

Valida un rang de dates segons restriccions específiques.

```javascript
/**
 * Valida un rang de dates
 * @param {Date} startDate - Data d'inici
 * @param {Date} endDate - Data de fi
 * @param {Object} constraints - Restriccions del rang
 * @returns {Object} Resultat de la validació
 */
static validateDateRange(startDate, endDate, constraints = {}) {
    const validation = {
        isValid: true,
        errors: [],
        warnings: []
    };
    
    // Validar ordre de dates
    if (startDate >= endDate) {
        validation.isValid = false;
        validation.errors.push('La data de fi ha de ser posterior a la d\'inici');
    }
    
    // Validar duració màxima
    if (constraints.maxDurationDays) {
        const durationDays = (endDate - startDate) / (24 * 60 * 60 * 1000);
        if (durationDays > constraints.maxDurationDays) {
            validation.isValid = false;
            validation.errors.push(`La duració no pot superar ${constraints.maxDurationDays} dies`);
        }
    }
    
    // Validar que no sobrepassa límits semestrals
    if (constraints.semesterBounds) {
        const { start: semesterStart, end: semesterEnd } = constraints.semesterBounds;
        
        if (startDate < semesterStart || endDate > semesterEnd) {
            validation.warnings.push('El rang surt dels límits del semestre');
        }
    }
    
    return validation;
}
```

### Validacions Específiques

#### Validacions per Tipus de Calendari

```javascript
/**
 * Validacions específiques segons tipus de calendari
 * @param {Date} date - Data a validar
 * @param {string} calendarType - Tipus de calendari
 * @returns {Object} Resultat de validació específica
 */
static validateByCalendarType(date, calendarType) {
    const validation = { isValid: true, errors: [], warnings: [] };
    
    switch (calendarType) {
        case 'FP':
            return this.validateFPDate(date);
        case 'BTX':
            return this.validateBTXDate(date);
        case 'ALTRO':
            return this.validateOtherDate(date);
        default:
            validation.warnings.push('Tipus de calendari desconegut');
    }
    
    return validation;
}
```

#### Validacions de Festius

```javascript
/**
 * Valida contra festius oficials i períodes no lectius
 * @param {Date} date - Data a validar
 * @returns {Object} Resultat de validació de festius
 */
static validateHolidays(date) {
    const validation = { isValid: true, errors: [], warnings: [] };
    
    if (this.isOfficialHoliday(date)) {
        validation.warnings.push('La data coincideix amb un festiu oficial');
    }
    
    if (this.isLocalHoliday(date)) {
        validation.warnings.push('La data coincideix amb un festiu local');
    }
    
    return validation;
}
```

## Utilitats Comunes dels Services

### Service Registry Pattern

```javascript
/**
 * Registre centralitzat de serveis
 */
class ServiceRegistry {
    constructor() {
        this.services = new Map();
    }
    
    register(name, service) {
        this.services.set(name, service);
    }
    
    get(name) {
        const service = this.services.get(name);
        if (!service) {
            throw new Error(`Service ${name} not found`);
        }
        return service;
    }
    
    has(name) {
        return this.services.has(name);
    }
}

// Instància global
const serviceRegistry = new ServiceRegistry();

// Registrar serveis
serviceRegistry.register('category', CategoryService);
serviceRegistry.register('replica', ReplicaService);
serviceRegistry.register('dateValidation', DateValidationService);
```

### Error Handling Comú

```javascript
/**
 * Classe base per errors de serveis
 */
class ServiceError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = 'ServiceError';
        this.code = code;
        this.details = details;
    }
}

/**
 * Wrapper per gestió d'errors en serveis
 */
function withErrorHandling(serviceMethod, context = '') {
    return function(...args) {
        try {
            const result = serviceMethod.apply(this, args);
            
            // Si és una Promise, capturar errors asíncrons
            if (result && typeof result.catch === 'function') {
                return result.catch(error => {
                    console.error(`Service error in ${context}:`, error);
                    throw new ServiceError(
                        `Error in ${context}: ${error.message}`,
                        'SERVICE_ERROR',
                        { originalError: error, context, args }
                    );
                });
            }
            
            return result;
        } catch (error) {
            console.error(`Service error in ${context}:`, error);
            throw new ServiceError(
                `Error in ${context}: ${error.message}`,
                'SERVICE_ERROR',
                { originalError: error, context, args }
            );
        }
    };
}
```

### Performance Monitoring

```javascript
/**
 * Monitorització de rendiment per serveis
 */
class ServicePerformanceMonitor {
    constructor() {
        this.metrics = new Map();
    }
    
    startTiming(serviceName, methodName) {
        const key = `${serviceName}.${methodName}`;
        this.metrics.set(key, performance.now());
    }
    
    endTiming(serviceName, methodName) {
        const key = `${serviceName}.${methodName}`;
        const startTime = this.metrics.get(key);
        
        if (startTime) {
            const duration = performance.now() - startTime;
            console.log(`${key} took ${duration.toFixed(2)}ms`);
            this.metrics.delete(key);
            return duration;
        }
        
        return null;
    }
    
    wrapMethod(service, methodName) {
        const original = service[methodName];
        const monitor = this;
        
        service[methodName] = function(...args) {
            monitor.startTiming(service.constructor.name, methodName);
            const result = original.apply(this, args);
            monitor.endTiming(service.constructor.name, methodName);
            return result;
        };
    }
}
```

Els services proporcionen una capa d'abstracció potent per a lògica de negoci complexa, facilitant el manteniment, testing i reutilització de funcionalitats especialitzades del Calendari IOC.

---
[← Testing i Debugging](Testing-i-Debugging) | [Export Referència →](Export-Referència)