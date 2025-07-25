# Estructura del Codi

Aquest document proporciona una guia detallada sobre l'organització del codi del Calendari IOC, convencions utilitzades, i com navegar eficientment per la base de codi per trobar i modificar funcionalitats específiques.

## Visió General de l'Arquitectura

### Principis d'Organització

**Separació per responsabilitats**: Cada directori agrupa fitxers amb responsabilitats similars
**Nomenclatura consistent**: Noms predictibles que reflecteixen la funcionalitat
**Dependències clares**: Relacions explícites entre components
**Escalabilitat**: Estructura que permet créixer sense reorganitzacions majors

## Estructura de Directoris

### Directori Principal

```
ioc-modul-calendari/
├── index.html              # Punt d'entrada de l'aplicació
├── css/                    # Estils i presentació visual
├── js/                     # Lògica de l'aplicació
├── config/                 # Configuracions del sistema
├── docs/                   # Documentació del projecte
├── screenshots/            # Captures de pantalla
└── README.md              # Documentació bàsica
```

### Directori CSS

```
css/
├── base.css               # Estils base, variables CSS, reset
└── calendar.css           # Estils específics del calendari
```

**base.css**: Conté les variables CSS globals, reset de navegador i estils base
**calendar.css**: Estils específics per components del calendari (grid, esdeveniments, etc.)

### Directori JavaScript

```
js/
├── Bootstrap.js           # Punt d'entrada i coordinació general
├── managers/              # Gestors de lògica de negoci
├── state/                 # Gestió d'estat i persistència
├── ui/                    # Components d'interfície d'usuari
├── helpers/               # Utilitats i funcions auxiliars
├── services/              # Serveis de domini específic
├── export/                # Exportadors de dades
├── import/                # Importadors de dades
└── config/                # Configuració i constants
```

## Detall dels Directoris JavaScript

### js/managers/

**Responsabilitat**: Lògica de negoci principal de l'aplicació

```
managers/
├── CalendarManager.js     # Gestió de calendaris (CRUD, configuració)
├── EventManager.js        # Gestió d'esdeveniments (CRUD, validació)
├── CategoryManager.js     # Gestió de categories (catàleg, sincronització)
├── ReplicaManager.js      # Gestió de replicació entre calendaris
└── ViewManager.js         # Gestió de vistes i navegació
```

**Patró Manager**: Cada manager encapsula tota la lògica relacionada amb una entitat principal del domini.

### js/state/

**Responsabilitat**: Gestió centralitzada de l'estat de l'aplicació

```
state/
├── AppStateManager.js     # Estat global de l'aplicació (Singleton)
└── StorageManager.js      # Persistència i gestió de localStorage
```

**Singleton Pattern**: AppStateManager és l'única font de veritat per l'estat de l'aplicació.

### js/ui/

**Responsabilitat**: Components d'interfície d'usuari i renderització

```
ui/
├── ModalRenderer.js       # Gestió de modals i formularis
├── PanelsRenderer.js      # Renderització de panells laterals
└── views/                 # Renderitzadors de vistes específiques
    ├── CalendarRenderer.js     # Classe base per renderitzadors
    ├── MonthViewRenderer.js    # Vista mensual
    ├── WeekViewRenderer.js     # Vista setmanal
    ├── DayViewRenderer.js      # Vista diària
    ├── SemesterViewRenderer.js # Vista semestral
    └── GlobalViewRenderer.js   # Vista global de calendaris
```

**Patró d'Herència**: CalendarRenderer és la classe base, altres hereten funcionalitat comuna.

### js/helpers/

**Responsabilitat**: Utilitats reutilitzables sense estat

```
helpers/
├── DateHelper.js          # Manipulació i formatatge de dates
├── UIHelper.js            # Utilitats d'interfície d'usuari
├── ColorContrastHelper.js # Càlcul de contrast per accessibilitat
├── TextHelper.js          # Manipulació de text
├── IdHelper.js            # Generació d'identificadors únics
├── ThemeHelper.js         # Gestió de temes clar/fosc
├── DragDropHelper.js      # Funcionalitat de drag & drop
└── MenuHelper.js          # Gestió de menús contextuals
```

**Funcions Pure**: Els helpers no mantenen estat i retornen resultats predictibles.

### js/services/

**Responsabilitat**: Lògica de negoci especialitzada i algoritmes complexos

```
services/
├── CategoryService.js     # Servei centralitzat per gestió de categories
├── ReplicaService.js      # Algoritme de replicació proporcional
└── DateValidationService.js # Validació de dates i rangs
```

**Separació de Concerns**: Algoritmes complexos separats dels managers per reutilització.

### js/export/

**Responsabilitat**: Exportació de dades a diferents formats

```
export/
├── JsonExporter.js        # Exportació a format JSON nadiu
├── IcsExporter.js         # Exportació a format iCalendar
└── HtmlExporter.js        # Exportació a HTML estàtic
```

**Strategy Pattern**: Diferents estratègies d'exportació segons el format.

### js/import/

**Responsabilitat**: Importació de dades des de formats externs

```
import/
└── IcsImporter.js         # Importació des de fitxers ICS
```

**Extensibilitat**: Preparar per futurs importadors (JSON, CSV, etc.).

### js/config/

**Responsabilitat**: Configuracions i constants de l'aplicació

```
config/
└── SemesterConfig.js      # Carregador de configuració semestral
```

**Configuració Dinàmica**: Carrega configuracions JSON segons tipus de calendari.

## Convencions de Nomenclatura

### Fitxers i Classes

**Classes**: PascalCase amb nom descriptiu
```javascript
class CalendarManager { }    // ✓ Correcte
class calendarmanager { }    // ✗ Incorrecte
```

**Fitxers**: Mateix nom que la classe principal
```
CalendarManager.js           // ✓ Correcte
calendar-manager.js          // ✗ Incorrecte
```

### Funcions i Variables

**camelCase per funcions i variables**:
```javascript
const currentCalendar = getCurrentCalendar();    // ✓ Correcte
const current_calendar = get_current_calendar(); // ✗ Incorrecte
```

**Funcions descriptives**:
```javascript
validateEventDate()          // ✓ Correcte
validate()                   // ✗ Massa genèric
```

### Constants

**UPPER_SNAKE_CASE per constants**:
```javascript
const STORAGE_KEY = 'calendari-ioc-data';        // ✓ Correcte
const storageKey = 'calendari-ioc-data';         // ✗ Incorrecte
```

### Identificadors de DOM

**kebab-case per IDs i classes CSS**:
```html
<div id="calendar-container" class="main-panel">  <!-- ✓ Correcte -->
<div id="calendarContainer" class="mainPanel">    <!-- ✗ Incorrecte -->
```

## Flux de Dependències

### Ordre de Càrrega

L'ordre de càrrega dels scripts a `index.html` reflecteix les dependències:

```html
<!-- 1. Helpers (sense dependències) -->
<script src="js/helpers/DateHelper.js"></script>
<script src="js/helpers/UIHelper.js"></script>
<!-- ... altres helpers -->

<!-- 2. Services (depenen de helpers) -->
<script src="js/services/CategoryService.js"></script>
<script src="js/services/ReplicaService.js"></script>

<!-- 3. State (depèn de helpers i services) -->
<script src="js/state/AppStateManager.js"></script>
<script src="js/state/StorageManager.js"></script>

<!-- 4. Config (depèn de state i helpers) -->
<script src="js/config/SemesterConfig.js"></script>

<!-- 5. UI Components (depenen de tot l'anterior) -->
<script src="js/ui/views/CalendarRenderer.js"></script>
<!-- ... altres UI components -->

<!-- 6. Managers (depenen de tot l'anterior) -->
<script src="js/managers/CalendarManager.js"></script>
<!-- ... altres managers -->

<!-- 7. Bootstrap (coordina tot) -->
<script src="js/Bootstrap.js"></script>
```

### Regles de Dependències

**Bottom-up**: Capes inferiors no depenen de les superiors
**Helpers → Services → State → UI → Managers → Bootstrap**

**Prohibit**: 
- Helpers que depenen de Managers
- Services que depenen de UI Components
- Dependències circulars

## Patrons de Codi

### Instanciació Global

```javascript
// Declaració global d'instàncies (Bootstrap.js)
const dateHelper = new DateHelper();
const uiHelper = new UIHelper();
const appStateManager = new AppStateManager();
const calendarManager = new CalendarManager();
```

**Avantatges**: Accés global sense import/export complex
**Inconvenients**: Dependències implícites

### Gestió d'Events

```javascript
// Event delegation centralitzat (Bootstrap.js)
class Bootstrap {
    initializeEventListeners() {
        document.addEventListener('click', (e) => this.handleClick(e));
    }
    
    handleClick(event) {
        const target = event.target.closest('[data-action]');
        if (!target) return;
        
        const action = target.dataset.action;
        // Routing basat en data-action
    }
}
```

### Gestió d'Estat

```javascript
// Actualització d'estat coordinada
class CalendarManager {
    completeCalendarSave() {
        // 1. Lògica de negoci
        this.processCalendarData();
        
        // 2. Actualització d'estat
        appStateManager.calendars[id] = calendar;
        
        // 3. Persistència
        storageManager.saveToStorage();
        
        // 4. Actualització UI
        this.updateUI();
    }
}
```

## Localització de Funcionalitats

### Per Trobir Funcionalitat Específica

#### Creació de Calendaris
**Fitxers implicats**:
1. `CalendarManager.js:addCalendar()` - Lògica principal
2. `ModalRenderer.js:openNewCalendarModal()` - UI del modal
3. `SemesterConfig.js` - Configuració automàtica

#### Gestió d'Esdeveniments
**Fitxers implicats**:
1. `EventManager.js` - CRUD d'esdeveniments
2. `ModalRenderer.js:openEventModal()` - Modal d'esdeveniments
3. `DateValidationService.js` - Validacions

#### Sistema de Categories
**Fitxers implicats**:
1. `CategoryManager.js` - Gestió local de categories
2. `CategoryService.js` - Catàleg global
3. `PanelsRenderer.js:renderCategories()` - Renderització

#### Replicació
**Fitxers implicats**:
1. `ReplicaManager.js` - Orquestració UI
2. `ReplicaService.js` - Algoritme de replicació
3. `PanelsRenderer.js:renderUnplacedEvents()` - Events no ubicats

### Per Modificar Aspectes Específics

#### Estils Visuals
- **Colors globals**: `css/base.css` (variables CSS)
- **Layout calendari**: `css/calendar.css`
- **Components UI**: Classes específiques a cada CSS

#### Lògica de Negoci
- **Regles de validació**: Services específics
- **Workflow**: Managers corresponents
- **Algoritmes**: Services especialitzats

#### Configuració
- **Esdeveniments sistema**: `config/*.json`
- **Categories per defecte**: `config/*.json`
- **Constants aplicació**: `js/config/`

## Bones Pràctiques de Codi

### Comentaris

```javascript
/**
 * Genera el proper ID únic per un esdeveniment
 * @param {string} calendarId - ID del calendari contenidor
 * @returns {string} ID únic format: calendariId_E##
 */
static generateNextEventId(calendarId) {
    // Implementació
}
```

### Gestió d'Errors

```javascript
try {
    const result = this.processData(data);
    uiHelper.showMessage('Operació completada', 'success');
    return result;
} catch (error) {
    console.error('[ComponentName] Error:', error);
    uiHelper.showMessage('Error processat dades', 'error');
    return null;
}
```

### Validacions

```javascript
validateInput(input) {
    // Validacions ràpides primer
    if (!input) return false;
    if (typeof input !== 'string') return false;
    
    // Validacions complexes després
    return this.complexValidation(input);
}
```

## Extensibilitat

### Afegir Noves Funcionalitats

**Nou Manager**:
1. Crear fitxer a `js/managers/`
2. Seguir patró dels managers existents
3. Afegir a ordre de càrrega a `index.html`
4. Instanciar globalment a `Bootstrap.js`

**Nova Vista**:
1. Crear renderitzador a `js/ui/views/`
2. Heretar de `CalendarRenderer`
3. Registrar a `ViewManager.js`
4. Afegir controls UI necessaris

**Nou Format Export**:
1. Crear exporter a `js/export/`
2. Implementar mètodes estàndard
3. Integrar amb UI existent

Aquesta estructura proporciona una base sòlida per al desenvolupament eficient i mantenible del Calendari IOC.

---
[← Guia d'Instal·lació Dev](Guia-d-Instal·lació-Dev) | [Punts d'Extensió Crítics →](Punts-d-Extensió-Crítics)