# Referència dels Managers

Els Managers són els components centrals de la lògica de negoci de l'aplicació. Aquest document proporciona una referència completa de tots els managers implementats.

## Estructura dels Managers

```
js/managers/
├── CalendarManager.js    # Gestió de calendaris
├── CategoryManager.js    # Gestió de categories i catàleg
├── EventManager.js       # Gestió d'esdeveniments
├── ReplicaManager.js     # Sistema de replicació
└── ViewManager.js        # Control de vistes
```

---

## CalendarManager

**Responsabilitat**: Gestió completa del cicle de vida dels calendaris

### Constructor
```javascript
class CalendarManager {
    constructor() {
        // No té estat intern propi
        // Treballa directament amb AppStateManager
    }
}
```

### Mètodes Principals

#### `async addCalendar()`
Crea un nou calendari segons el tipus seleccionat.

**Flux d'execució:**
1. Obté el tipus seleccionat del modal
2. Processa segons tipus (FP/BTX/Altre)
3. Valida la configuració resultant
4. Crea l'estructura de dades
5. Actualitza l'estat global
6. Persisteix i re-renderitza

**Tipus de calendaris:**
```javascript
// FP: Formació Professional
calendarData = await this.processFPCalendar();

// BTX: Batxillerat  
calendarData = await this.processBTXCalendar();

// Altre: Personalitzat
calendarData = this.processAltreCalendar();
```

**Errors comuns:**
- Camps obligatoris buits
- Calendari amb ID duplicat
- Error carregant configuració de semestre

#### `async processFPCalendar()`
Processa la creació de calendaris de Formació Professional.

**Paràmetres d'entrada (DOM):**
- `cicleCode`: Codi del cicle (ex: DAM, DAW)
- `moduleCode`: Codi del mòdul (ex: M07B0)

**Configuració automàtica:**
```javascript
const fpConfig = new SemesterConfig('FP');
await fpConfig.initialize();

// Dates automàtiques
const startDate = fpConfig.getStartDate();
const endDate = fpConfig.getEndDate();
const paf1Date = fpConfig.getSemester()?.paf1Date;

// Nom generat
const calendarName = `FP_${cicle}_${module}_${code}`;
```

**Retorna:**
```javascript
{
    id: "FP_DAM_M07B0_2024-25_S1",
    name: "FP_DAM_M07B0_2024-25_S1", 
    startDate: "2024-09-16",
    endDate: "2025-01-24",
    type: "FP",
    paf1Date: "2024-12-16",
    config: SemesterConfig
}
```

#### `async processBTXCalendar()`
Similar a `processFPCalendar()` però per Batxillerat.

**Diferències clau:**
- Usa `config/btx-semestre.json`
- Format de nom: `BTX_{ASSIGNATURA}_{CODI}`
- Categories específiques de BTX

#### `processAltreCalendar()`
Processa calendaris personalitzats.

**Paràmetres d'entrada (DOM):**
- `calendarName`: Nom lliure
- `startDate`: Data d'inici
- `endDate`: Data de fi

**Validacions:**
- Dates no buides
- Data de fi posterior a la d'inici
- Nom de calendari no buit

#### `deleteCalendar(calendarId)`
Elimina un calendari amb confirmació de l'usuari.

**Flux:**
1. Mostra modal de confirmació
2. Si s'accepta, elimina de l'estat
3. Actualitza calendari actiu si cal
4. Persisteix i re-renderitza

**Seguretat:**
- Confirmació explícita de l'usuari
- Gestió del calendari actiu si s'elimina

#### `switchCalendar(calendarId)`
Canvia el calendari actiu.

**Accions:**
1. Valida que el calendari existeix
2. Actualitza `currentCalendarId`
3. Ajusta `currentDate` al rang del nou calendari
4. Torna a vista mensual
5. Persisteix i actualitza UI

#### `updateNavigationControls(calendar)`
Actualitza els botons de navegació segons el rang del calendari.

**Lògica:**
- Desabilita navegació anterior si s'està al començament
- Desabilita navegació següent si s'està al final
- Considera la vista actual (mes/setmana/dia)

### Gestió d'Importació

#### `importIcsToCalendar(calendarId)`
Importa esdeveniments ICS a un calendari tipus "Altre".

**Restriccions:**
- Només calendaris tipus "Altre"
- Crea categoria "Importats" automàticament
- Ordena esdeveniments per hora específica primer

**Processament:**
1. Crea categoria d'importació si no existeix
2. Afegeix esdeveniments amb IDs únics
3. Ordena per hora específica vs dia complet
4. Actualitza rang de dates del calendari si cal

#### `loadCalendarFile()`
Carrega un calendari des d'un fitxer JSON.

**Validacions:**
- Estructura JSON vàlida
- Camps obligatoris presents
- ID de calendari únic
- Codi de semestre per calendaris FP/BTX

**Migració automàtica:**
- Afegeix categories al catàleg global
- Actualitza comptadors si falten
- Compatibilitat amb versions anteriors

### Integració amb Altres Components

**Dependencies:**
- `AppStateManager`: Estat global dels calendaris
- `StorageManager`: Persistència de dades
- `SemesterConfig`: Configuració automàtica FP/BTX
- `ModalRenderer`: Tancament de modals
- `ViewManager`: Canvi de vistes
- `UIHelper`: Missatges d'usuari
- `DateHelper`: Manipulació de dates

**Triggers de re-renderització:**
```javascript
this.updateUI() {
    panelsRenderer.renderSavedCalendars();  // Llista de calendaris
    panelsRenderer.renderCategories();     // Categories disponibles  
    panelsRenderer.renderUnplacedEvents(); // Events de replicació
    viewManager.renderCurrentView();       // Vista principal
}
```

---

## ️ CategoryManager

**Responsabilitat**: Gestió del catàleg global de categories i sincronització entre calendaris

### Propietats de Classe
```javascript
class CategoryManager {
    constructor() {
        this.colors = [
            '#e53e3e', '#dd6b20', '#d69e2e', // Paleta predefinida
            // ... 20 colors en total
        ];
    }
}
```

### Mètodes de Categories

#### `addCategory()`
Afegeix una nova categoria al catàleg global i al calendari actiu.

**Flux complet:**
1. Valida el nom de la categoria
2. Comprova que no existeix al catàleg
3. Crea la categoria amb color aleatori
4. Afegeix al catàleg global (`AppStateManager.categoryTemplates`)
5. Afegeix al calendari actual
6. Persisteix i re-renderitza

**Validacions:**
- Nom no buit
- No duplicat al catàleg global
- Calendari actiu disponible

#### `createCategory(name)`
Factory method per crear objectes categoria.

**Estructura retornada:**
```javascript
{
    id: "FP_DAM_M07B0_C1",           // ID únic generat
    name: "Lliuraments",             // Nom donat per usuari
    color: "#e53e3e",                // Color aleatori
    isSystem: false                  // Sempre false per categories d'usuari
}
```

**Generació d'ID:**
- Usa `IdHelper.generateNextCategoryId()`
- Format: `{calendarId}_C{counter}`
- Garanteix unicitat global

#### `deleteCategory(element)`
Elimina una categoria del catàleg i de tots els calendaris.

**Procés de seguretat:**
1. Conta esdeveniments que usen la categoria
2. Mostra confirmació amb advertència si hi ha esdeveniments
3. Si s'accepta, elimina de tot arreu:
   - Catàleg global (`categoryTemplates`)
   - Tots els calendaris (`calendar.categories`)
   - Tots els esdeveniments que la usen

**Missatge de confirmació:**
```javascript
let message = `Estàs segur que vols eliminar la categoria "${category.name}"?`;

if (eventCount > 0) {
    message += `\n\nATENCIÓ: Aquesta categoria s'utilitza en ${eventCount} event(s) 
               en tots els calendaris. Tots aquests events seran eliminats.`;
}
```

#### `startEditCategory(element)` / `saveEditCategory(inputElement)`
Sistema d'edició in-line de categories.

**startEditCategory:**
1. Tanca altres edicions obertes
2. Canvia la categoria a mode edició
3. Mostra input en lloc de span
4. Selecciona el text per edició ràpida

**saveEditCategory:**
1. Valida el nou nom
2. Actualitza al catàleg global
3. Actualitza a tots els calendaris que la tenen
4. Persisteix canvis
5. Re-renderitza vistes afectades

**Gestió d'errors:**
- Si el nom és buit, restaura el nom original
- Escape cancel·la l'edició
- Enter confirma els canvis

### Utilitats

#### `generateRandomColor()`
Selecciona un color aleatori de la paleta predefinida.

**Implementació:**
```javascript
generateRandomColor() {
    return this.colors[Math.floor(Math.random() * this.colors.length)];
}
```

#### `categoryExistsInCatalog(name)`
Comprova si una categoria ja existeix al catàleg global.

**Comparació case-insensitive:**
```javascript
return appStateManager.categoryTemplates.some(template => 
    template.name.toLowerCase() === name.toLowerCase()
);
```

### Sincronització Global

**Concepte clau:** CategoryManager manté un catàleg global que es sincronitza entre tots els calendaris.

**Catàleg global (`categoryTemplates`):**
- Conté totes les categories d'usuari creades
- No conté categories del sistema (són específiques de cada calendari)
- Es sincronitza automàticament quan es carreguen calendaris

**Sincronització automàtica:**
- Quan es carrega un calendari, les seves categories s'afegeixen al catàleg
- Quan s'edita una categoria, el canvi s'aplica a tots els calendaris
- Quan s'elimina una categoria, desapareix de tot arreu

---

## EventManager

**Responsabilitat**: Gestió completa d'esdeveniments, validacions i drag & drop

### Mètodes CRUD d'Esdeveniments

#### `saveEvent()`
Crea o actualitza un esdeveniment.

**Flux dual:**
```javascript
if (appStateManager.editingEventId) {
    this.updateExistingEvent(calendar, eventData);  // Edició
} else {
    this.createNewEvent(calendar, eventData);       // Creació
}
```

**Validacions automàtiques:**
- Títol obligatori
- Data obligatòria i dins del rang del calendari
- Categoria obligatòria i vàlida

**Auto-gestió de categories:**
```javascript
this.ensureCategoryExists(calendar, categoryId);
// Si la categoria no existeix al calendari, l'afegeix automàticament
```

#### `createNewEvent(calendar, eventData)`
Factory per crear nous esdeveniments.

**Estructura creada:**
```javascript
const newEvent = {
    id: idHelper.generateNextEventId(appStateManager.currentCalendarId),
    title: eventData.title,
    date: eventData.date,
    categoryId: eventData.categoryId,
    description: eventData.description,
    isSystemEvent: false
};
```

#### `deleteEvent()`
Elimina un esdeveniment amb confirmació.

**Seguretat:**
- Només es pot eliminar l'esdeveniment en edició
- Confirmació explícita de l'usuari
- Actualització automàtica de la vista

#### `moveEvent(eventId, newDate)`
Mou un esdeveniment a una nova data via drag & drop.

**Validacions:**
- Només esdeveniments d'usuari (no del sistema)
- Data dins del rang del calendari
- Usa `DateValidationService` per validacions complexes

**Implementació immutable:**
```javascript
const newEvents = calendar.events.map(e => 
    e.id === eventId ? { ...e, date: newDate } : e
);
calendar.events = newEvents;
```

### Sistema de Drag & Drop

#### `makeEventDraggable(eventElement, event, dateStr)`
Configura un element DOM per ser arrossegable.

**Condicions:**
- Només esdeveniments d'usuari
- Configura `draggable="true"`
- Assigna event listeners per `dragstart` i `dragend`

**Gestió d'estat:**
```javascript
eventElement.addEventListener('dragstart', (e) => {
    appStateManager.draggedEvent = event;
    appStateManager.draggedFromDate = dateStr;
    eventElement.classList.add('dragging');
});
```

#### `makeDayDroppable(dayElement, dateStr)`
Configura un dia per rebre esdeveniments arrossegats.

**Validacions en temps real:**
- `dragover`: Valida si la data és vàlida
- Afegeix classes CSS per feedback visual (`drop-target` o `drop-invalid`)
- `drop`: Executa el moviment si és vàlid

**Casos especials:**
- Events de replicació: Usa validació per dies laborables
- Events normals: Usa validació estàndard de rang

### Gestió de Categories en Esdeveniments

#### `populateCategorySelect()`
Omple el desplegable de categories al modal d'esdeveniments.

**Fonts de categories:**
1. Categories del sistema del calendari (només informació)
2. Categories del catàleg global (per assignar a esdeveniments)

**Filtratge:**
- Esdeveniments d'usuari només poden usar categories no-sistema
- Categories del sistema són només per esdeveniments generats automàticament

#### `ensureCategoryExists(calendar, categoryId)`
Assegura que una categoria del catàleg existeixi al calendari actual.

**Auto-afegit:**
```javascript
if (!categoryExists) {
    const templateCategory = appStateManager.categoryTemplates.find(
        template => template.id === categoryId
    );
    if (templateCategory) {
        calendar.categories.push({ ...templateCategory });
    }
}
```

### Validacions Avançades

#### `validateEventData(title, date, categoryId, calendar)`
Validació completa de dades d'esdeveniment.

**Comprovacions:**
- Camps obligatoris no buits
- Data dins del rang del calendari
- Categoria vàlida i existent

#### `isValidEventMove(event, targetDate, calendar)`
Validació específica per moviments drag & drop.

**Regles especials:**
- Events del sistema no es poden moure
- Usa `DateValidationService.validateEventWithMessage()` per regles centralitzades
- Mostra missatges d'error automàtics

---

## ReplicaManager

**Responsabilitat**: Sistema de replicació d'esdeveniments entre calendaris

### Concepte de Replicació

La replicació permet copiar esdeveniments d'un calendari a un altre, adaptant-los automàticament a les dates laborables del calendari destí.

### Mètodes Principals

#### `openReplicationModal(sourceCalendarId)`
Obre el modal de replicació per un calendari origen.

**Preparació:**
1. Filtra calendaris disponibles (exclou l'origen)
2. Pobla el desplegable de calendaris destí
3. Configura el modal amb el calendari origen

#### `executeReplication()`
Executa la replicació entre calendaris seleccionats.

**Flux complet:**
1. Obté calendaris origen i destí
2. Filtra esdeveniments a replicar (només d'usuari)
3. Processa cada esdeveniment:
   - Crea nova instància amb ID únic
   - Busca data laborable equivalent al destí
   - Afegeix a esdeveniments no ubicats si no troba data vàlida
4. Actualitza estat i UI

**Lògica de dates:**
```javascript
// Busca data laborable equivalent
const equivalentDate = replicaService.findEquivalentWorkingDate(
    event.date, 
    sourceCalendar, 
    targetCalendar
);

if (equivalentDate) {
    // Afegeix directament al calendari destí
    targetCalendar.events.push(newEvent);
} else {
    // Afegeix a esdeveniments no ubicats
    appStateManager.unplacedEvents.push({
        event: newEvent,
        sourceCalendar: sourceCalendar
    });
}
```

#### `placeUnplacedEvent(eventIndex, targetDate)`
Col·loca un esdeveniment no ubicat en una data específica.

**Validacions:**
- Data dins del rang del calendari actiu
- Data és dia laborable vàlid
- Esdeveniment encara existeix a la llista de no ubicats

#### `dismissUnplacedEvent(eventIndex)`
Descarta un esdeveniment no ubicat.

**Accions:**
- Elimina de la llista d'esdeveniments no ubicats
- Actualitza UI automàticament
- Persisteix l'estat

### Gestió d'Esdeveniments No Ubicats

**Concepte:** Esdeveniments que no es poden col·locar automàticament durant la replicació.

**Causes comunes:**
- Calendari destí no té dies laborables equivalents
- Rang de dates del destí no cobreix l'equivalent
- Configuració de dies laborables diferent

**Gestió visual:**
- Panell lateral específic per esdeveniments no ubicats
- Drag & drop per col·locar-los manualment
- Opció de descartar si no són necessaris

### Integració amb Drag & Drop

#### `setupUnplacedEventsDragDrop()`
Configura els esdeveniments no ubicats per ser arrossegables.

**Funcionalitat especial:**
- `draggedFromDate = 'unplaced'`: Marca especial per identificar origen
- Validació diferent: Només dies laborables vàlids
- Auto-eliminació de la llista de no ubicats quan es col·loca

---

## 👁️ ViewManager

**Responsabilitat**: Control de vistes i navegació del calendari

### Gestió de Vistes

#### `changeView(viewType)`
Canvia la vista actual del calendari.

**Vistes disponibles:**
- `'month'`: Vista mensual (per defecte)
- `'week'`: Vista setmanal  
- `'day'`: Vista diària
- `'semester'`: Vista de tot el semestre
- `'global'`: Vista de tots els calendaris

**Actualització d'estat:**
```javascript
appStateManager.currentView = viewType;
this.updateViewButtons();      // Actualitza botons UI
this.renderCurrentView();      // Re-renderitza contingut
```

#### `renderCurrentView()`
Renderitza la vista actual segons `appStateManager.currentView`.

**Delegació a renderers específics:**
```javascript
switch (appStateManager.currentView) {
    case 'month': monthViewRenderer.render(); break;
    case 'week': weekViewRenderer.render(); break;
    case 'day': dayViewRenderer.render(); break;
    case 'semester': semesterViewRenderer.render(); break;
    case 'global': globalViewRenderer.render(); break;
}
```

#### `navigatePeriod(direction)`
Navega entre períodes segons la vista actual.

**Lògica per vista:**
- **Month**: Navega per mesos
- **Week**: Navega per setmanes  
- **Day**: Navega per dies
- **Semester/Global**: Navegació limitada o deshabilitada

**Validació de rang:**
- No permet navegar fora del rang del calendari actiu
- Actualitza controls de navegació automàticament

### Coordinació amb Altres Components

**Dependencies:**
- **AppStateManager**: Estat de vista i data actuals
- **CalendarManager**: Rang de dates del calendari actiu
- **Specific ViewRenderers**: Renderització especialitzada per vista
- **UIHelper**: Actualització de controls UI

**Triggers:**
- Canvi de calendari → Vista mensual per defecte
- Navegació → Actualització de data i re-renderització
- Canvi de vista → Actualització de botons i contingut

---

## Integració entre Managers

### Flux d'Interacció Típic

```
User Action
    ↓
Bootstrap (Event Delegation)
    ↓
Manager Específic
    ↓
AppStateManager (Update State)
    ↓
StorageManager (Persist)
    ↓
ViewManager (Re-render)
    ↓
UI Update
```

### Dependencies Creuades

**CalendarManager:**
- Usa `ViewManager` per canviar a vista mensual
- Usa `CategoryManager` indirectament via catàleg
- Coordina amb `StorageManager` per persistència

**EventManager:**
- Usa `CategoryManager` per auto-afegir categories
- Coordina amb `ReplicaManager` per esdeveniments especials
- Integra amb `ViewManager` per actualitzar vistes

**CategoryManager:**
- Impacta `EventManager` quan canvien categories
- Coordina amb `ViewManager` per re-renderitzar panells

**ReplicaManager:**
- Usa `EventManager` per validacions de drag & drop
- Coordina amb `ViewManager` per actualitzar panells d'esdeveniments no ubicats

### Patrons de Comunicació

**1. Estat Centralitzat:**
Tots els managers actualitzen `AppStateManager` com a única font de veritat.

**2. Re-renderització Coordinada:**
Canvis d'estat desencadenen re-renderització automàtica via `ViewManager`.

**3. Validacions Compartides:**
Services comuns (`DateValidationService`, `CategoryService`) per lògica reutilitzable.

**4. Persistència Automàtica:**
Tot canvi d'estat es persisteix automàticament via `StorageManager`.

---

Aquesta referència proporciona la base per entendre i modificar qualsevol aspecte dels Managers. Per implementacions específiques, consulta el codi font de cada manager amb aquesta documentació com a guia.

## Autoria

**Ismael Trascastro**  
**Correu**: itrascastro@ioc.cat  
**Web**: itrascastro.github.io

---
[← Arquitectura](Arquitectura-General) | [State Management →](state-Referència)