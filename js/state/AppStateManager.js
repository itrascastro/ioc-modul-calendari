/**
 * =================================================================
 * APP STATE - GESTIÓ CENTRALITZADA DE L'ESTAT DE L'APLICACIÓ
 * =================================================================
 * 
 * @file        AppStateManager.js
 * @description Gestió de l'estat global de l'aplicació i variables auxiliars
 * @author      Ismael Trascastro <itrascastro@ioc.cat>
 * @version     1.0.0
 * @date        2025-01-16
 * @project     Calendari Mòdul IOC
 * @repository  https://github.com/itrascastro/ioc-modul-calendari
 * @license     MIT
 * 
 * Aquest fitxer forma part del projecte Calendari Mòdul IOC,
 * una aplicació web per gestionar calendaris acadèmics.
 * 
 * =================================================================
 */

// === CLASSE APPSTATEMANAGER ===

class AppStateManager {
    constructor() {
        // Estat principal de l'aplicació
        this.appState = {
            calendars: {},
            currentCalendarId: null,
            editingCalendarId: null,
            editingEventId: null,
            currentDate: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)),
            currentView: 'month',  // Vista actual: month, day, week, semester
            categoryTemplates: [],  // Catálogo global de categorías de usuario
            unplacedEvents: [] // Eventos no ubicados en replicación
        };

        // Variables de drag & drop
        this.draggedEvent = null;
        this.draggedFromDate = null;

        // Variables de selección
        this.selectedCalendarId = null;
        this.selectedCategoryId = null;
    }

    // Obtenir el calendari actual
    getCurrentCalendar() {
        if (!this.appState.currentCalendarId || !this.appState.calendars[this.appState.currentCalendarId]) {
            this.appState.currentCalendarId = Object.keys(this.appState.calendars)[0] || null;
        }
        return this.appState.currentCalendarId ? this.appState.calendars[this.appState.currentCalendarId] : null;
    }

    // Obtenir l'ID del calendari seleccionat
    getSelectedCalendarId() {
        return this.selectedCalendarId;
    }

    // Obtenir l'ID de la categoria seleccionada
    getSelectedCategoryId() {
        return this.selectedCategoryId;
    }

    // Netejar l'estat de drag & drop
    cleanupDragState() {
        this.draggedEvent = null;
        this.draggedFromDate = null;
        
        // Netejar totes les classes de drop
        document.querySelectorAll('.drop-target, .drop-invalid').forEach(el => {
            el.classList.remove('drop-target', 'drop-invalid');
        });
    }

    // Establir el calendari seleccionat
    setSelectedCalendarId(calendarId) {
        this.selectedCalendarId = calendarId;
    }

    // Establir la categoria seleccionada
    setSelectedCategoryId(categoryId) {
        this.selectedCategoryId = categoryId;
    }

    // Netejar la selecció de categoria
    clearSelectedCategoryId() {
        this.selectedCategoryId = null;
    }

    // Resetejar l'estat de l'aplicació
    resetAppState() {
        this.appState = {
            calendars: {},
            currentCalendarId: null,
            editingCalendarId: null,
            editingEventId: null,
            currentDate: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)),
            categoryTemplates: [],
            unplacedEvents: []
        };
        
        // Resetejar variables auxiliars
        this.draggedEvent = null;
        this.draggedFromDate = null;
        this.selectedCalendarId = null;
        this.selectedCategoryId = null;
    }

    // Obtenir informació de l'estat actual
    getStateInfo() {
        return {
            calendarsCount: Object.keys(this.appState.calendars).length,
            currentCalendarId: this.appState.currentCalendarId,
            currentDate: this.appState.currentDate,
            categoryTemplatesCount: this.appState.categoryTemplates.length,
            unplacedEventsCount: this.appState.unplacedEvents.length,
            hasDraggedEvent: !!this.draggedEvent,
            selectedCalendarId: this.selectedCalendarId,
            selectedCategoryId: this.selectedCategoryId
        };
    }

    // Validar l'estat de l'aplicació
    validateAppState() {
        if (!this.appState || typeof this.appState !== 'object') {
            console.error('[AppState] Estat principal no vàlid');
            return false;
        }
        
        if (!this.appState.calendars || typeof this.appState.calendars !== 'object') {
            console.error('[AppState] Calendaris no vàlids');
            return false;
        }
        
        if (!Array.isArray(this.appState.categoryTemplates)) {
            console.error('[AppState] Plantilles de categories no vàlides');
            return false;
        }
        
        if (!Array.isArray(this.appState.unplacedEvents)) {
            console.error('[AppState] Events no ubicats no vàlids');
            return false;
        }
        
        return true;
    }

    // === GETTERS I SETTERS PER A ACCÉS DIRECTE A PROPIETATS ===
    
    // Calendaris
    get calendars() {
        return this.appState.calendars;
    }
    
    set calendars(value) {
        this.appState.calendars = value;
    }
    
    // ID del calendari actual
    get currentCalendarId() {
        return this.appState.currentCalendarId;
    }
    
    set currentCalendarId(value) {
        this.appState.currentCalendarId = value;
    }
    
    // Data actual
    get currentDate() {
        return this.appState.currentDate;
    }
    
    set currentDate(value) {
        this.appState.currentDate = value;
    }
    
    // Vista actual
    get currentView() {
        return this.appState.currentView;
    }
    
    set currentView(value) {
        this.appState.currentView = value;
    }
    
    // Plantilles de categories
    get categoryTemplates() {
        return this.appState.categoryTemplates;
    }
    
    set categoryTemplates(value) {
        this.appState.categoryTemplates = value;
    }
    
    // Esdeveniments no ubicats
    get unplacedEvents() {
        return this.appState.unplacedEvents;
    }
    
    set unplacedEvents(value) {
        this.appState.unplacedEvents = value;
    }
    
    // ID del calendari en edició
    get editingCalendarId() {
        return this.appState.editingCalendarId;
    }
    
    set editingCalendarId(value) {
        this.appState.editingCalendarId = value;
    }
    
    // ID de l'esdeveniment en edició
    get editingEventId() {
        return this.appState.editingEventId;
    }
    
    set editingEventId(value) {
        this.appState.editingEventId = value;
    }
    
    // === MIGRACIONS ===
    
    // Migrar plantilles de categories des de calendaris existents
    migrateCategoryTemplates() {
        console.log('[Migració] Sincronitzant catàleg de categories...');
        
        Object.values(this.appState.calendars).forEach(calendar => {
            if (calendar.categories) {
                calendar.categories
                    .filter(cat => !cat.isSystem) // Només categories d'usuari
                    .forEach(category => {
                        // Verificar si ja existeix al catàleg
                        const existingTemplate = this.appState.categoryTemplates.find(t => t.id === category.id);
                        
                        if (!existingTemplate) {
                            // Afegir nova plantilla
                            this.appState.categoryTemplates.push({
                                id: category.id,
                                name: category.name,
                                color: category.color,
                                isSystem: false,
                                createdAt: new Date().toISOString(),
                                usageCount: 1
                            });
                        } else {
                            // Actualitzar plantilla existent
                            existingTemplate.name = category.name;
                            existingTemplate.color = category.color;
                            existingTemplate.usageCount = (existingTemplate.usageCount || 0) + 1;
                        }
                    });
            }
        });
        
        // EL CATÀLEG NOMÉS CONTÉ CATEGORIES D'USUARI
        // Les categories de sistema es mantenen només als calendaris individuals
        // NO afegim categories per defecte al catàleg global
        
        console.log(`[Migració] Catàleg sincronitzat amb ${this.appState.categoryTemplates.length} categories`);
    }
}

// === INSTÀNCIA GLOBAL ===

// Crear instància global de AppStateManager
const appStateManager = new AppStateManager();