// =================================================================
// CALENDAR MANAGER - GESTIÓ DE CALENDARIS
// =================================================================

// Classe per gestionar tots els calendaris de l'aplicació
class CalendarManager {
    constructor() {
        this.managerType = 'calendar';
    }
    
    // === GESTIÓ DE CALENDARIS ===
    
    // Crear o editar calendari
    saveCalendar() {
        const cicle = document.getElementById('cicleCode').value.trim().toUpperCase();
        const module = document.getElementById('moduleCode').value.trim().toUpperCase();
        
        if (!this.validateCalendarData(cicle, module)) {
            return;
        }
        
        // Usar dates fixes del IOC
        const startDate = IOC_SEMESTER_CONFIG.startDate;
        const endDate = IOC_SEMESTER_CONFIG.endDate;
        
        const calendarName = `${cicle}_${module}_${IOC_SEMESTER_CONFIG.semester}`;
        const calendarId = calendarName;
        
        if (this.calendarExists(calendarId) && appState.editingCalendarId !== calendarId) {
            showMessage("Ja existeix un calendari amb aquest cicle i mòdul per aquest semestre.", 'error');
            return;
        }
        
        this.createCalendarData(calendarId, calendarName, startDate, endDate);
        this.completeCalendarSave();
    }
    
    // Eliminar calendari
    deleteCalendar(calendarId) {
        const calendar = appState.calendars[calendarId];
        if (!calendar) return;

        showConfirmModal(
            `Estàs segur que vols eliminar el calendari "${calendar.name}"?\n\nAquesta acció no es pot desfer.`,
            'Eliminar calendari',
            () => {
                delete appState.calendars[calendarId];
                
                // Si era el calendari actiu, netejar selecció
                if (appState.currentCalendarId === calendarId) {
                    appState.currentCalendarId = null;
                }
                
                saveToStorage();
                updateUI();
                showMessage('Calendari eliminat correctament', 'success');
            }
        );
    }
    
    // Canviar calendari actiu
    switchCalendar(calendarId) {
        if (!calendarId || !appState.calendars[calendarId]) return;
        
        appState.currentCalendarId = calendarId;
        const activeCalendar = appState.calendars[calendarId];
        
        // Usar el renderitzador per parsejar la data correctament
        appState.currentDate = parseUTCDate(activeCalendar.startDate);
        
        saveToStorage();
        updateUI();
    }
    
    // === VALIDACIONS ===
    
    // Validar dades del calendari
    validateCalendarData(cicle, module) {
        if (!cicle || !module) {
            showMessage("Els camps Cicle i Mòdul són obligatoris.", 'error');
            return false;
        }
        return true;
    }
    
    // Verificar si el calendari existeix
    calendarExists(calendarId) {
        return !!appState.calendars[calendarId];
    }
    
    // === CREACIÓ DE CALENDARIS ===
    
    // Crear dades del calendari amb esdeveniments de sistema
    createCalendarData(calendarId, calendarName, startDate, endDate) {
        const systemEvents = this.generateSystemEvents(startDate, endDate);
        
        appState.calendars[calendarId] = {
            name: calendarName,
            startDate,
            endDate,
            eventCounter: 0,
            categoryCounter: 0,
            categories: [...defaultCategories],
            events: systemEvents
        };
        
        appState.currentCalendarId = calendarId;
        appState.currentDate = parseUTCDate(startDate);
    }
    
    // Generar esdeveniments de sistema per al calendari
    generateSystemEvents(startDate, endDate) {
        const systemEvents = [];
        
        // Afegir esdeveniments puntuals
        IOC_SEMESTER_TEMPLATE.events.forEach(event => {
            if (event.date >= startDate && event.date <= endDate) {
                systemEvents.push(event);
            }
        });
        
        // Afegir rangs d'esdeveniments (ex: vacances)
        IOC_SEMESTER_TEMPLATE.ranges.forEach(range => {
            let currentDate = parseUTCDate(range.startDate);
            const rangeEndDate = parseUTCDate(range.endDate);
            
            while (currentDate <= rangeEndDate) {
                const dateStr = dateToUTCString(currentDate);
                if (dateStr >= startDate && dateStr <= endDate) {
                    systemEvents.push({
                        id: `${range.idPrefix}_${dateStr}`,
                        title: range.title,
                        date: dateStr,
                        categoryId: range.categoryId,
                        isSystemEvent: range.isSystemEvent,
                        eventType: range.eventType,
                    });
                }
                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            }
        });
        
        return systemEvents;
    }
    
    // Completar desament del calendari
    completeCalendarSave() {
        saveToStorage();
        updateUI();
        closeModal('calendarSetupModal');
        showMessage('Calendari guardat correctament', 'success');
    }
    
    // === NAVEGACIÓ ===
    
    // Actualitzar controls de navegació segons el calendari
    updateNavigationControls(calendar) {
        const prevBtn = document.querySelector('.nav-arrow[data-direction="-1"]');
        const nextBtn = document.querySelector('.nav-arrow[data-direction="1"]');
        
        if (!prevBtn || !nextBtn || !calendar) return;
        
        const calendarStart = parseUTCDate(calendar.startDate);
        const calendarEnd = parseUTCDate(calendar.endDate);
        
        const prevMonthEnd = createUTCDate(
            appState.currentDate.getUTCFullYear(), 
            appState.currentDate.getUTCMonth(), 
            0
        );
        prevBtn.disabled = prevMonthEnd < calendarStart;
        
        const nextMonthStart = createUTCDate(
            appState.currentDate.getUTCFullYear(), 
            appState.currentDate.getUTCMonth() + 1, 
            1
        );
        nextBtn.disabled = nextMonthStart > calendarEnd;
    }
    
    // === CÀRREGA DE CALENDARIS ===
    
    // Carregar fitxer de calendari
    loadCalendarFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const calendarData = JSON.parse(e.target.result);
                        
                        // Validar estructura bàsica
                        if (!calendarData.name || !calendarData.startDate || !calendarData.endDate) {
                            throw new Error('Estructura del fitxer incorrecta');
                        }

                        // Crear nou calendari amb ID basat en el nom
                        const calendarId = calendarData.name;
                        appState.calendars[calendarId] = {
                            name: calendarData.name,
                            startDate: calendarData.startDate,
                            endDate: calendarData.endDate,
                            eventCounter: calendarData.eventCounter || 0,
                            categoryCounter: calendarData.categoryCounter || 0,
                            categories: calendarData.categories || [...defaultCategories],
                            events: calendarData.events || []
                        };
                        
                        // Migrar categories del fitxer carregat al catàleg
                        if (calendarData.categories) {
                            calendarData.categories
                                .filter(cat => !cat.isSystem)
                                .forEach(category => {
                                    const existsInCatalog = appState.categoryTemplates.some(template => 
                                        template.id === category.id
                                    );
                                    
                                    if (!existsInCatalog) {
                                        appState.categoryTemplates.push({
                                            id: category.id,
                                            name: category.name,
                                            color: category.color,
                                            isSystem: false
                                        });
                                        console.log(`[Carga] Añadida "${category.name}" al catálogo desde archivo`);
                                    }
                                });
                        }
                        
                        // Activar calendari carregat
                        appState.currentCalendarId = calendarId;
                        // Usar el renderitzador per parsejar la data correctament
                        appState.currentDate = parseUTCDate(calendarData.startDate);
                        
                        saveToStorage();
                        updateUI();
                        showMessage(`Calendari "${calendarData.name}" carregat correctament`, 'success');
                        
                    } catch (error) {
                        showMessage('Error carregant el fitxer: ' + error.message, 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
    
    // === INTERFÍCIE D'USUARI ===
    
    // Actualitzar tota la interfície
    updateUI() {
        panelsRenderer.renderSavedCalendars();
        panelsRenderer.renderCategories();
        panelsRenderer.renderUnplacedEvents();
        renderCalendar();
    }
}

// === INSTÀNCIA GLOBAL ===
const calendarManager = new CalendarManager();

// === FUNCIONS PÚBLIQUES ===
function saveCalendar() {
    calendarManager.saveCalendar();
}

function deleteCalendar(calendarId) {
    calendarManager.deleteCalendar(calendarId);
}

function switchCalendar(calendarId) {
    calendarManager.switchCalendar(calendarId);
}

function updateNavigationControls(calendar) {
    calendarManager.updateNavigationControls(calendar);
}

function updateUI() {
    calendarManager.updateUI();
}

// === INICIALITZACIÓ ===
function initializeCalendarManager() {
    console.log('[CalendarManager] ✅ Gestor de calendaris inicialitzat');
}