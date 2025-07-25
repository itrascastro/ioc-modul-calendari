# Referència de Helpers i Utilitats

Els helpers del Calendari IOC proporcionen funcionalitats transversals utilitzades per tots els components de l'aplicació. Aquestes classes d'utilitats encapsulen lògica reutilitzable per manipulació de dates, interfície d'usuari, colors, text i altres operacions comunes.

## Estructura dels Helpers

```
js/helpers/
├── DateHelper.js            # Manipulació i formatatge de dates
├── UIHelper.js              # Utilitats d'interfície d'usuari
├── ColorContrastHelper.js   # Càlcul de contrast de colors
├── TextHelper.js            # Manipulació i formatatge de text
├── IdHelper.js              # Generació d'identificadors únics
├── ThemeHelper.js           # Gestió de temes clar/fosc
├── DragDropHelper.js        # Funcionalitat de drag & drop
└── MenuHelper.js            # Gestió de menús contextuals
```

---

## DateHelper

**Responsabilitat**: Manipulació consistent de dates amb suport UTC complet

### Creació i Conversió de Dates

#### `createUTC(year, month, day)`
Crea una data UTC amb components específics.

```javascript
createUTC(year, month, day) {
    return new Date(Date.UTC(year, month, day));
}
```

**Paràmetres:**
- `year` (number): Any complet (ex: 2024)
- `month` (number): Mes (0-11, gener=0)
- `day` (number): Dia del mes (1-31)

**Retorna**: Objecte Date en UTC

#### `toUTCString(date)`
Converteix una data a string UTC format YYYY-MM-DD.

```javascript
toUTCString(date) {
    return date.toISOString().split('T')[0];
}
```

#### `parseUTC(dateStr)`
Parseja un string de data a objecte Date UTC.

```javascript
parseUTC(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return this.createUTC(year, month - 1, day);
}
```

### Formatatge i Presentació

#### `formatForDisplay(date)`
Formata una data per mostrar a l'usuari en català.

```javascript
formatForDisplay(date) {
    return date.toLocaleDateString('ca-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        timeZone: 'UTC'
    });
}
```

**Retorna**: String format "dd/mm/aaaa"

#### `getMonthName(date)`
Obté el nom del mes amb any en català.

**Retorna**: String format "novembre 2024"

#### `getDayHeaders()` / `getDayHeadersShort()`
Proporciona capçaleres per dies de la setmana.

```javascript
getDayHeaders() {
    return ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte', 'Diumenge'];
}

getDayHeadersShort() {
    return ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
}
```

### Càlculs Temporals

#### `getCalendarWeekNumber(date, calendarStartDateStr)`
Calcula el número de setmana dins d'un calendari acadèmic.

```javascript
getCalendarWeekNumber(date, calendarStartDateStr) {
    const calendarStartDate = this.parseUTC(calendarStartDateStr);
    const targetDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    
    const diffTime = targetDate - calendarStartDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.floor(diffDays / 7) + 1;
}
```

#### `isWeekday(dateStr)`
Verifica si una data és dia laborable (dilluns a divendres).

#### `addDays(date, days)` / `addMonths(date, months)`
Operacions aritmètiques amb dates.

#### `getWeekStartDate(date)`
Obté el dilluns de la setmana que conté la data.

---

## UIHelper

**Responsabilitat**: Utilitats per la interfície d'usuari i experiència d'usuari

### Sistema de Missatges

#### `showMessage(message, type)`
Mostra missatges toast a l'usuari.

```javascript
showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        background-color: ${this.getMessageColor(type)};
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}
```

**Tipus de missatges:**
- `success`: Verd, per operacions exitoses
- `error`: Vermell, per errors
- `warning`: Groc, per advertiments
- `info`: Blau, per informació general

### Gestió de Confirmacions

#### `confirmAction(message, callback)`
Mostra diàleg de confirmació personalitzat.

```javascript
confirmAction(message, callback) {
    const result = confirm(message);
    if (result && typeof callback === 'function') {
        callback();
    }
    return result;
}
```

### Utilitats de DOM

#### `scrollToElement(element, behavior)`
Fa scroll fins a un element específic.

#### `focusElement(selector)`
Posa focus en un element amb gestió d'errors.

#### `toggleElementVisibility(element, visible)`
Mostra o oculta elements amb suavitat.

---

## ColorContrastHelper

**Responsabilitat**: Càlcul de contrast de colors per accessibilitat

### Càlcul de Contrast

#### `getContrastStyle(backgroundColor)`
Determina el color de text òptim segons el fons.

```javascript
getContrastStyle(backgroundColor) {
    const luminance = this.getLuminance(backgroundColor);
    const textColor = luminance > 0.5 ? '#000000' : '#ffffff';
    
    return `background-color: ${backgroundColor}; color: ${textColor};`;
}
```

#### `getLuminance(color)`
Calcula la luminància relativa d'un color.

```javascript
getLuminance(color) {
    // Convertir hex a RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    // Aplicar correcció gamma
    const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
    
    // Calcular luminància
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}
```

#### `getContrastRatio(color1, color2)`
Calcula la ràtio de contrast entre dos colors.

**Retorna**: Valor entre 1 i 21 (21 = contrast màxim)

### Validació d'Accessibilitat

#### `meetsWCAGStandard(color1, color2, level)`
Verifica si dos colors compleixen estàndards WCAG.

```javascript
meetsWCAGStandard(color1, color2, level = 'AA') {
    const ratio = this.getContrastRatio(color1, color2);
    
    switch(level) {
        case 'AA': return ratio >= 4.5;
        case 'AAA': return ratio >= 7;
        default: return ratio >= 3;
    }
}
```

---

## TextHelper

**Responsabilitat**: Manipulació i formatatge de text

### Formatatge de Text

#### `truncateText(text, maxLength, suffix)`
Trunca text amb punts suspensius.

```javascript
truncateText(text, maxLength, suffix = '...') {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
}
```

#### `capitalizeFirst(text)`
Capitalitza la primera lletra.

#### `toCamelCase(text)` / `toKebabCase(text)`
Conversions de format de text.

### Validació de Text

#### `isValidEmail(email)`
Validació d'adreces de correu electrònic.

#### `sanitizeHTML(html)`
Neteja HTML per evitar XSS.

#### `stripHTML(html)`
Elimina etiquetes HTML.

---

## IdHelper

**Responsabilitat**: Generació d'identificadors únics

### Generació d'IDs

#### `generateNextEventId(calendarId)`
Genera el proper ID d'esdeveniment per un calendari.

```javascript
static generateNextEventId(calendarId) {
    const calendar = appStateManager.calendars[calendarId];
    calendar.eventCounter = (calendar.eventCounter || 0) + 1;
    return `${calendarId}_E${calendar.eventCounter}`;
}
```

#### `generateNextCategoryId(calendarId)`
Genera el proper ID de categoria.

```javascript
static generateNextCategoryId(calendarId) {
    const calendar = appStateManager.calendars[calendarId];
    calendar.categoryCounter = (calendar.categoryCounter || 0) + 1;
    return `${calendarId}_C${calendar.categoryCounter}`;
}
```

#### `generateUniqueId(prefix)`
Genera ID únic amb prefix opcional.

```javascript
static generateUniqueId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix}${timestamp}_${random}`;
}
```

### Validació d'IDs

#### `isValidCalendarId(id)`
Valida format d'ID de calendari.

#### `parseEventId(eventId)`
Extreu components d'un ID d'esdeveniment.

---

## ThemeHelper

**Responsabilitat**: Gestió de temes clar/fosc

### Gestió de Temes

#### `toggleTheme()`
Alterna entre tema clar i fosc.

```javascript
toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    const isDarkMode = body.classList.contains('dark-mode');
    document.getElementById('theme-toggle').textContent = 
        isDarkMode ? 'Canviar a Mode Clar' : 'Canviar a Mode Fosc';
}
```

#### `getSystemTheme()`
Detecta la preferència de tema del sistema.

```javascript
getSystemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 
           'dark' : 'light';
}
```

#### `loadSavedTheme()`
Carrega el tema segons preferències del sistema.

---

## DragDropHelper

**Responsabilitat**: Funcionalitat de drag & drop per esdeveniments

### Gestió de Drag & Drop

#### `initializeDragAndDrop()`
Configura els event listeners per drag & drop.

#### `handleDragStart(event)`
Gestiona l'inici d'arrossegament.

```javascript
handleDragStart(event) {
    if (!event.target.classList.contains('is-user-event')) return;
    
    const eventData = JSON.parse(event.target.getAttribute('data-event'));
    appStateManager.draggedEvent = eventData;
    appStateManager.draggedFromDate = eventData.date;
    
    event.target.style.opacity = '0.5';
    event.dataTransfer.effectAllowed = 'move';
}
```

#### `handleDragOver(event)` / `handleDrop(event)`
Gestiona els events de drag over i drop.

### Validació de Drop

#### `isValidDropTarget(element, draggedEvent)`
Verifica si un element és un target vàlid per drop.

#### `calculateDropDate(element)`
Calcula la data de destí basada en l'element target.

---

## MenuHelper

**Responsabilitat**: Gestió de menús contextuals i dropdowns

### Menús Contextuals

#### `showContextMenu(x, y, items)`
Mostra un menú contextual en coordenades específiques.

#### `hideContextMenu()`
Oculta menús contextuals actius.

#### `createMenuItem(label, action, icon)`
Crea elements de menú estandarditzats.

---

## Integració i Ús dels Helpers

### Instanciació Global

Els helpers s'instancien globalment per accés universal:

```javascript
// Bootstrap.js
const dateHelper = new DateHelper();
const uiHelper = new UIHelper();
const colorContrastHelper = new ColorContrastHelper();
const textHelper = new TextHelper();
const themeHelper = new ThemeHelper();
const dragDropHelper = new DragDropHelper();
const menuHelper = new MenuHelper();
```

### Patrons d'Ús Comuns

**En renderitzadors:**
```javascript
// Formatatge de dates
const displayDate = dateHelper.formatForDisplay(event.date);

// Contrast de colors
const style = colorContrastHelper.getContrastStyle(category.color);

// Truncament de text
const shortTitle = textHelper.truncateText(event.title, 25);
```

**En managers:**
```javascript
// Generació d'IDs
const newEventId = IdHelper.generateNextEventId(calendarId);

// Missatges d'usuari
uiHelper.showMessage('Esdeveniment creat correctament', 'success');

// Confirmacions
uiHelper.confirmAction('Eliminar aquest esdeveniments?', () => {
    this.deleteEvent(eventId);
});
```

### Principis de Disseny dels Helpers

**Stateless**: Els helpers no mantenen estat entre crides
**Pure Functions**: Mètodes predictibles amb la mateixa entrada/sortida
**Dependency-Free**: Independents d'altres components de l'aplicació
**Reutilitzables**: Utilitzables per qualsevol component de l'aplicació
**Testables**: Funcions aïllades fàcils de testejar

Aquests helpers proporcionen una base sòlida i reutilitzable per a totes les funcionalitats transversals de l'aplicació, mantenint el codi net i organitzat.

---
[← Views](views-Referència) | [Arquitectura General →](Arquitectura-General)