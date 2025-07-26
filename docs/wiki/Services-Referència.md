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

**Ubicació**: `js/services/` (i subcarpetes especialitzades)

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

## Services de Replicació

### Arquitectura de Replicació

Els **services de replicació** implementen diferents algoritmes de replicació d'esdeveniments entre calendaris segons el tipus de calendari origen i destí. Utilitzen el patró **Factory** per seleccionar automàticament l'algoritme més adequat.

**Ubicació**: `js/services/replica/`

#### Estructura Jeràrquica

```
js/services/replica/
├── ReplicaService.js           # Classe base amb mètodes comuns
├── EstudiReplicaService.js     # Algoritme per calendaris FP/BTX
├── GenericReplicaService.js    # Algoritme per calendaris "Altre"
└── ReplicaServiceFactory.js    # Factory per selecció automàtica
```

### ReplicaService (Classe Base)

#### Propòsit i Responsabilitats

La **classe base ReplicaService** proporciona mètodes comuns per tots els algoritmes de replicació, incloent anàlisi d'espai útil, càlcul de confiança i detecció de PAF.

#### Mètodes Comuns

##### `analyzeWorkableSpace(calendar)`

Analitza l'espai útil disponible en un calendari considerant tipus, esdeveniments del sistema i festius.

```javascript
/**
 * Analitza l'espai útil disponible en un calendari
 * @param {Object} calendar - Calendari a analitzar
 * @returns {Array} Array de dates disponibles en format string
 */
analyzeWorkableSpace(calendar) {
    const espaiUtil = [];
    const dataFiAvalucions = this.findPAF1(calendar);
    
    // Esdeveniments que ocupen l'espai (sistema IOC, festius, etc.)
    const occupiedBySystem = new Set(
        calendar.events
            .filter(e => e.isSystemEvent)
            .map(e => e.date)
    );
    
    // Iterar dia a dia segons tipus de calendari
    let currentDate = dateHelper.parseUTC(calendar.startDate);
    const endDate = dateHelper.parseUTC(dataFiAvalucions);
    
    while (currentDate <= endDate) {
        const dateStr = dateHelper.toUTCString(currentDate);
        
        // Per calendaris "Altre": tots els dies excepte els ocupats pel sistema
        // Per calendaris FP/BTX: només dies laborals que no estan ocupats pel sistema
        const isValidDay = calendar.type === 'Altre' 
            ? !occupiedBySystem.has(dateStr)
            : dateHelper.isWeekday(dateStr) && !occupiedBySystem.has(dateStr);
        
        if (isValidDay) {
            espaiUtil.push(dateStr);
        }
        
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    
    return espaiUtil;
}
```

##### `calculateProportionalConfidence(indexOrigen, indexIdeal, indexFinal, factor)`

Calcula la confiança d'una replicació basada en la proximitat entre posició ideal i final.

```javascript
/**
 * Calcula confiança basada en proximitat de posicions
 * @param {number} indexOrigen - Índex original
 * @param {number} indexIdeal - Índex ideal calculat
 * @param {number} indexFinal - Índex final assignat
 * @param {number} factor - Factor de proporció/compressió
 * @returns {number} Percentatge de confiança (70-99)
 */
calculateProportionalConfidence(indexOrigen, indexIdeal, indexFinal, factor) {
    let confidence = 95; // Base alta
    
    // Penalització per diferència entre ideal i final
    const diferencia = Math.abs(indexIdeal - indexFinal);
    if (diferencia > 0) {
        confidence -= Math.min(diferencia * 2, 15); // Màxim -15%
    }
    
    // Bonificació per factors "nets" (prop de 1.0)
    if (Math.abs(factor - 1.0) < 0.1) {
        confidence += 3; // Replicació gairebé directa
    }
    
    return Math.max(Math.min(confidence, 99), 70);
}
```

##### `findPAF1(calendar)`

Detecta la data de fi d'avaluacions (PAF1) per determinar l'espai útil del calendari.

```javascript
/**
 * Detecta data de fi d'avaluacions PAF1
 * @param {Object} calendar - Calendari a analitzar
 * @returns {string} Data PAF1 o data de fi del calendari
 */
findPAF1(calendar) {
    // Per calendaris FP i BTX: usar paf1Date directe
    if ((calendar.type === 'FP' || calendar.type === 'BTX') && calendar.paf1Date) {
        return calendar.paf1Date;
    }
    
    // Per calendaris "Altre": buscar esdeveniments PAF
    const pafEvents = calendar.events.filter(event => {
        // Buscar per ID de categoria del sistema
        if (event.categoryId === 'SYS_CAT_3') return true;
        
        // Buscar per títol que contingui "PAF1"
        if (event.title.toUpperCase().includes('PAF1')) return true;
        
        return false;
    });
    
    if (pafEvents.length > 0) {
        const sortedPafEvents = pafEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        const firstPaf = sortedPafEvents[0];
        return firstPaf.date;
    }
    
    // Fallback: usar final de calendari
    return calendar.endDate;
}
```

### EstudiReplicaService

#### Propòsit i Responsabilitats

L'**EstudiReplicaService** implementa l'algoritme de replicació per calendaris d'estudi (FP/BTX), mantenint 100% de compatibilitat amb el comportament anterior. Està optimitzat per calendaris amb restriccions acadèmiques.

#### Característiques Específiques

- **Només dies laborables**: Replicació únicament en dies de dilluns a divendres
- **Un esdeveniment per dia**: Cada dia pot tenir màxim un esdeveniment replicat
- **Cerca radial de slots**: Algoritme de cerca per trobar el slot lliure més proper
- **Detecció automàtica de PAF**: Utilitza dates PAF1 per delimitar període útil

#### Algoritme Principal

```javascript
/**
 * Algoritme de replicació per calendaris d'estudi
 * @param {Object} sourceCalendar - Calendari origen
 * @param {Object} targetCalendar - Calendari destí
 * @returns {Object} Resultat amb events ubicats i no ubicats
 */
replicate(sourceCalendar, targetCalendar) {
    // Filtrar esdeveniments del professor
    const professorEvents = sourceCalendar.events
        .filter(event => !event.isSystemEvent)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Construir espais útils (només dies laborables)
    const espaiUtilOrigen = this.analyzeWorkableSpace(sourceCalendar);
    const espaiUtilDesti = this.analyzeWorkableSpace(targetCalendar);
    
    // Calcular factor de proporció
    const factorProporcio = espaiUtilDesti.length / espaiUtilOrigen.length;
    
    // Mapa d'ocupació del destí (control d'un event per dia)
    const ocupacioEspaiDesti = new Map(espaiUtilDesti.map(date => [date, 'LLIURE']));
    
    const placedEvents = [];
    const unplacedEvents = [];
    
    // Processament esdeveniment per esdeveniment
    professorEvents.forEach(event => {
        const indexOrigen = espaiUtilOrigen.indexOf(event.date);
        
        if (indexOrigen === -1) {
            unplacedEvents.push({
                event: { ...event, replicationConfidence: 0 },
                sourceCalendar,
                reason: "Esdeveniment no està en espai útil d'origen"
            });
            return;
        }
        
        // Calcular posició ideal
        const indexIdeal = Math.round(indexOrigen * factorProporcio);
        
        // Buscar slot lliure més proper
        const indexFinal = this.findNearestFreeSlot(ocupacioEspaiDesti, indexIdeal);
        
        if (indexFinal === -1) {
            unplacedEvents.push({
                event: { ...event, replicationConfidence: 0 },
                sourceCalendar,
                reason: "Sense slots lliures disponibles"
            });
            return;
        }
        
        // Marcar slot com ocupat
        const newDate = espaiUtilDesti[indexFinal];
        ocupacioEspaiDesti.set(newDate, 'OCUPAT');
        
        // Crear esdeveniment replicat
        const replicatedEvent = {
            ...event,
            id: idHelper.generateNextEventId(appStateManager.currentCalendarId),
            date: newDate,
            isReplicated: true,
            originalDate: event.date,
            replicationConfidence: this.calculateProportionalConfidence(indexOrigen, indexIdeal, indexFinal, factorProporcio)
        };
        
        placedEvents.push({
            event: replicatedEvent,
            newDate: newDate,
            sourceCalendar: sourceCalendar,
            originalDate: event.date,
            confidence: replicatedEvent.replicationConfidence
        });
    });
    
    return { placed: placedEvents, unplaced: unplacedEvents };
}
```

### GenericReplicaService

#### Propòsit i Responsabilitats

El **GenericReplicaService** implementa un algoritme optimitzat per calendaris genèrics tipus "Altre", centrat en la preservació d'agrupacions d'esdeveniments per dia i màxima eficiència de col·locació.

#### Característiques Específiques

- **Tots els dies de la setmana**: Inclou caps de setmana si no estan ocupats pel sistema
- **Múltiples esdeveniments per dia**: Preserva agrupacions d'esdeveniments del mateix dia
- **Estratègies adaptatives**: Còpia directa, expansió o compressió segons relació d'espais
- **Optimització de storage**: Algoritme més eficient que redueix problemàtiques d'emmagatzematge

#### Estratègies de Replicació

##### 1. Còpia Directa (Espais Idèntics)

```javascript
/**
 * Còpia directa dia a dia quan espais són idèntics
 * @param {Map} eventsByDay - Esdeveniments agrupats per dia
 * @param {Array} espaiOrigen - Dies útils del calendari origen
 * @param {Array} espaiDesti - Dies útils del calendari destí
 * @returns {Object} Resultat amb 100% d'esdeveniments ubicats
 */
mapDirectly(eventsByDay, espaiOrigen, espaiDesti, sourceCalendar) {
    const placedEvents = [];
    
    for (const [originalDate, dayEvents] of eventsByDay) {
        const indexOrigen = espaiOrigen.indexOf(originalDate);
        const newDate = espaiDesti[indexOrigen]; // Mateixa posició
        
        // Replicar tots els esdeveniments del grup al mateix dia destí
        dayEvents.forEach(event => {
            const replicatedEvent = {
                ...event,
                date: newDate,
                isReplicated: true,
                originalDate: event.date,
                replicationConfidence: 99 // Màxima confiança
            };
            
            placedEvents.push({
                event: replicatedEvent,
                newDate: newDate,
                sourceCalendar: sourceCalendar
            });
        });
    }
    
    return { placed: placedEvents, unplaced: [] };
}
```

##### 2. Expansió (Espai Destí Major)

```javascript
/**
 * Expansió amb distribució proporcional quan hi ha més espai
 * @param {Map} eventsByDay - Esdeveniments agrupats per dia
 * @param {Array} espaiOrigen - Dies útils del calendari origen
 * @param {Array} espaiDesti - Dies útils del calendari destí
 * @returns {Object} Resultat amb esdeveniments distribuïts
 */
expandGroups(eventsByDay, espaiOrigen, espaiDesti, sourceCalendar) {
    const placedEvents = [];
    const factorExpansio = espaiDesti.length / espaiOrigen.length;
    
    for (const [originalDate, dayEvents] of eventsByDay) {
        const indexOrigen = espaiOrigen.indexOf(originalDate);
        
        // Calcular posició expandida
        const indexExpandit = Math.round(indexOrigen * factorExpansio);
        const indexFinal = Math.min(indexExpandit, espaiDesti.length - 1);
        const newDate = espaiDesti[indexFinal];
        
        // Preservar agrupació: tots els events del dia van al mateix dia destí
        dayEvents.forEach(event => {
            placedEvents.push({
                event: {
                    ...event,
                    date: newDate,
                    isReplicated: true,
                    originalDate: event.date,
                    replicationConfidence: this.calculateProportionalConfidence(indexOrigen, indexExpandit, indexFinal, factorExpansio)
                },
                newDate: newDate,
                sourceCalendar: sourceCalendar
            });
        });
    }
    
    return { placed: placedEvents, unplaced: [] };
}
```

##### 3. Compressió (Espai Destí Menor)

```javascript
/**
 * Compressió amb gestió de col·lisions quan hi ha menys espai
 * @param {Map} eventsByDay - Esdeveniments agrupats per dia
 * @param {Array} espaiOrigen - Dies útils del calendari origen  
 * @param {Array} espaiDesti - Dies útils del calendari destí
 * @returns {Object} Resultat amb alguns esdeveniments possiblement no ubicats
 */
compressGroups(eventsByDay, espaiOrigen, espaiDesti, factorCompressio, sourceCalendar) {
    const placedEvents = [];
    const unplacedEvents = [];
    const usedDates = new Set(); // Control de col·lisions
    
    for (const [originalDate, dayEvents] of eventsByDay) {
        const indexOrigen = espaiOrigen.indexOf(originalDate);
        
        // Calcular posició comprimida
        let indexComprimit = Math.round(indexOrigen * factorCompressio);
        let indexFinal = Math.min(indexComprimit, espaiDesti.length - 1);
        
        // Buscar data lliure si ja està ocupada
        while (usedDates.has(espaiDesti[indexFinal]) && indexFinal < espaiDesti.length - 1) {
            indexFinal++;
        }
        
        if (indexFinal >= espaiDesti.length || usedDates.has(espaiDesti[indexFinal])) {
            // No hi ha espai: marcar com no ubicats
            dayEvents.forEach(event => {
                unplacedEvents.push({
                    event: { ...event, replicationConfidence: 0 },
                    sourceCalendar,
                    reason: "Sense espai disponible en compressió"
                });
            });
            continue;
        }
        
        const newDate = espaiDesti[indexFinal];
        usedDates.add(newDate);
        
        // Preservar agrupació: tots els events del grup al mateix dia
        dayEvents.forEach(event => {
            placedEvents.push({
                event: {
                    ...event,
                    date: newDate,
                    isReplicated: true,
                    originalDate: event.date,
                    replicationConfidence: this.calculateProportionalConfidence(indexOrigen, indexComprimit, indexFinal, factorCompressio)
                },
                newDate: newDate,
                sourceCalendar: sourceCalendar
            });
        });
    }
    
    return { placed: placedEvents, unplaced: unplacedEvents };
}
```

### ReplicaServiceFactory

#### Propòsit i Responsabilitats

El **ReplicaServiceFactory** implementa el patró Factory per seleccionar automàticament el servei de replicació més adequat segons els tipus de calendaris origen i destí.

#### Lògica de Selecció

```javascript
/**
 * Selecciona el servei de replicació adequat segons tipus de calendaris
 * @param {Object} sourceCalendar - Calendari origen
 * @param {Object} targetCalendar - Calendari destí
 * @returns {ReplicaService} Instància del servei adequat
 */
static getService(sourceCalendar, targetCalendar) {
    const sourceType = sourceCalendar.type || 'Altre';
    const targetType = targetCalendar.type || 'Altre';
    
    // Si qualsevol dels calendaris és "Altre", usar GenericReplicaService
    if (sourceType === 'Altre' || targetType === 'Altre') {
        return new GenericReplicaService();
    } 
    
    // Si ambdós són calendaris d'estudi (FP, BTX), usar EstudiReplicaService
    return new EstudiReplicaService();
}
```

#### Funcionalitats Adicionals

##### Informació de Servei

```javascript
/**
 * Obté informació sobre el tipus de servei seleccionat
 * @param {Object} sourceCalendar - Calendari origen
 * @param {Object} targetCalendar - Calendari destí
 * @returns {Object} Informació detallada del servei
 */
static getServiceInfo(sourceCalendar, targetCalendar) {
    const sourceType = sourceCalendar?.type || 'Altre';
    const targetType = targetCalendar?.type || 'Altre';
    
    if (sourceType === 'Altre' || targetType === 'Altre') {
        return {
            serviceType: 'GenericReplicaService',
            description: 'Servei optimitzat per calendaris genèrics amb preservació d\'agrupacions',
            features: [
                'Suport per tots els dies de la setmana',
                'Múltiples esdeveniments per dia',
                'Preservació d\'agrupacions per dia',
                'Estratègies de còpia directa, expansió i compressió'
            ]
        };
    } else {
        return {
            serviceType: 'EstudiReplicaService',
            description: 'Servei per calendaris d\'estudi amb restriccions acadèmiques',
            features: [
                'Només dies laborables',
                'Un esdeveniment per dia màxim',
                'Detecció automàtica de PAF',
                'Cerca radial de slots lliures'
            ]
        };
    }
}
```

##### Validació de Compatibilitat

```javascript
/**
 * Valida compatibilitat entre calendaris per replicació
 * @param {Object} sourceCalendar - Calendari origen
 * @param {Object} targetCalendar - Calendari destí
 * @returns {Object} Resultat de validació amb recomanacions
 */
static validateCompatibility(sourceCalendar, targetCalendar) {
    const validation = {
        isCompatible: true,
        warnings: [],
        recommendations: []
    };
    
    const sourceType = sourceCalendar?.type || 'Altre';
    const targetType = targetCalendar?.type || 'Altre';
    
    if (sourceType === 'Altre' && targetType !== 'Altre') {
        validation.recommendations.push('Replicació d\'Altre a estudi pot generar esdeveniments no ubicats en caps de setmana');
    }
    
    if (sourceType === 'Altre' && targetType === 'Altre') {
        validation.recommendations.push('Replicació òptima: ambdós calendaris són tipus Altre');
    }
    
    return validation;
}
```

### Ús dels Services de Replicació

#### Integració amb ReplicaManager

Els services de replicació s'integren automàticament mitjançant el **ReplicaManager**, que utilitza el Factory per seleccionar el servei adequat:

```javascript
// En ReplicaManager.js
executeReplication() {
    // Seleccionar servei automàticament
    const replicaService = ReplicaServiceFactory.getService(sourceCalendar, targetCalendar);
    
    // Executar replicació amb servei seleccionat
    const result = replicaService.replicate(sourceCalendar, targetCalendar);
    
    // Processar resultat estàndard
    result.placed.forEach(placedItem => {
        // Aplicar esdeveniments replicats
    });
    
    if (result.unplaced.length > 0) {
        // Gestionar esdeveniments no ubicats
        appStateManager.unplacedEvents = result.unplaced;
    }
}
```

#### Exemple d'Ús Directe

```javascript
// Ús directe dels services (per testing o funcionalitats avançades)

// 1. Selecció automàtica via Factory
const service = ReplicaServiceFactory.getService(sourceCalendar, targetCalendar);
const result = service.replicate(sourceCalendar, targetCalendar);

// 2. Ús directe d'un servei específic
const genericService = new GenericReplicaService();
const result = genericService.replicate(calendarAltre1, calendarAltre2);

// 3. Validació prèvia de compatibilitat
const validation = ReplicaServiceFactory.validateCompatibility(source, target);
if (validation.isCompatible) {
    // Procedir amb replicació
} else {
    console.warn('Incompatible calendars:', validation.warnings);
}
```

### Avantatges de la Nova Arquitectura

#### 1. Separació de Responsabilitats

- **ReplicaService**: Funcionalitats comunes i utils
- **EstudiReplicaService**: Lògica específica per calendaris acadèmics
- **GenericReplicaService**: Optimització per calendaris genèrics
- **ReplicaServiceFactory**: Selecció intel·ligent automàtica

#### 2. Mantenibilitat i Extensibilitat

```javascript
// Exemple d'extensió: nou servei per calendaris corporatius
class CorporateReplicaService extends ReplicaService {
    replicate(sourceCalendar, targetCalendar) {
        // Lògica específica per calendaris corporatius
        // - Respectar horaris laborals
        // - Evitar festius empresarials
        // - Integració amb sistemas externs
    }
}

// Registrar al Factory
// ReplicaServiceFactory.register('corporate', CorporateReplicaService);
```

#### 3. Optimització de Rendiment

- **Reducció problemàtiques storage**: GenericReplicaService usa menys memòria temporal
- **Algoritmes especialitzats**: Cada servei està optimitzat per al seu domini
- **Lazy loading**: Els serveis es creen només quan es necessiten

#### 4. Testing i Debugging

```javascript
// Tests unitaris per cada servei de manera independent
describe('GenericReplicaService', () => {
    test('should preserve event groupings in direct copy', () => {
        const service = new GenericReplicaService();
        const result = service.replicate(sourceCalendar, targetCalendar);
        
        // Verificar que els grups d'esdeveniments es preserven
        expect(result.placed.length).toBe(347);
        expect(result.unplaced.length).toBe(0);
    });
});

describe('EstudiReplicaService', () => {
    test('should maintain FP calendar compatibility', () => {
        const service = new EstudiReplicaService();
        const result = service.replicate(fpCalendar, btxCalendar);
        
        // Verificar compatibilitat 100% amb comportament anterior
        expect(result.placed.every(item => dateHelper.isWeekday(item.newDate))).toBe(true);
    });
});
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
serviceRegistry.register('replicaFactory', ReplicaServiceFactory);
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