// =================================================================
// CORE.JS - COORDINACIÓ CENTRAL DE L'APLICACIÓ CALENDARI IOC
// =================================================================

// === GESTOR D'ACCIONS CENTRALITZAT ===
function handleAction(e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    e.preventDefault();
    const action = target.dataset.action;
    
    switch (action) {
        case 'toggle-theme': toggleTheme(); break;
        case 'open-calendar-setup': openCalendarSetupModal(); break;
        case 'close-modal': closeModal(target.dataset.modal); break;
        case 'save-calendar': saveCalendar(); break;
        case 'navigate-period': navigatePeriod(parseInt(target.dataset.direction)); break;
        case 'switch-calendar': switchCalendar(target.closest('.calendar-list-item').dataset.calendarId); break;
        case 'add-event': openEventModal(null, target.closest('.day-cell').dataset.date); break;
        case 'open-event-modal': openEventModal(JSON.parse(target.dataset.event)); break;
        case 'save-event': saveEvent(); break;
        case 'delete-event': deleteEvent(); break;
        case 'add-category': addCategory(); break;
        case 'start-edit-category': startEditCategory(target); break;
        case 'save-edit-category': saveEditCategory(target); break;
        case 'delete-category': deleteCategory(target); break;
        case 'load-calendar-file': loadCalendarFile(); break;
        case 'show-unplaced-events': showUnplacedEventsPanel(); break;
        case 'place-unplaced-event': placeUnplacedEvent(target.dataset.eventIndex, target.dataset.date); break;
        case 'dismiss-unplaced-event': dismissUnplacedEvent(target.dataset.eventIndex); break;
        case 'toggle-actions-menu': toggleActionsMenu(target); break;
        case 'open-calendar-actions-modal': openCalendarActionsModal(target.dataset.calendarId); break;
        case 'open-color-picker-modal': openColorPickerModal(target.dataset.categoryId, target); break;
        case 'select-color': selectCategoryColor(target.dataset.color); break;
        case 'save-calendar-json': saveCalendarJSON(getSelectedCalendarId()); break;
        case 'export-calendar-ics': exportCalendarICS(getSelectedCalendarId()); break;
        case 'export-calendar-html': exportCalendarHTML(getSelectedCalendarId()); break;
        case 'delete-calendar': deleteCalendar(getSelectedCalendarId()); break;
        case 'replicate-calendar': openReplicationModal(getSelectedCalendarId()); break;
        case 'execute-replication': executeReplication(); break;
        default: console.warn(`Acción no reconocida: ${action}`);
    }
}

// === RENDERITZAT PRINCIPAL DEL CALENDARI ===
function renderCalendar() {
    const calendar = getCurrentCalendar();
    const gridWrapper = document.getElementById('calendar-grid-wrapper');
    const periodDisplay = document.getElementById('current-period-display');
    
    if (!calendar) {
        gridWrapper.innerHTML = `<div style="display: flex; height: 100%; align-items: center; justify-content: center; color: var(--secondary-text-color);">Selecciona un calendari per començar.</div>`;
        periodDisplay.textContent = '...';
        return;
    }
    
    updateNavigationControls(calendar);
    
    const monthHTML = monthRenderer.render(calendar, appState.currentDate, 'DOM');
    periodDisplay.textContent = getMonthName(appState.currentDate);
    gridWrapper.innerHTML = monthHTML;
    
    setupDragAndDrop(gridWrapper, calendar);
}

// === NAVEGACIÓ ENTRE PERÍODES ===
function navigatePeriod(direction) {
    if (!appState.currentCalendarId) return;
    
    const newDate = createUTCDate(
        appState.currentDate.getUTCFullYear(), 
        appState.currentDate.getUTCMonth() + direction, 
        1
    );
    
    const calendar = getCurrentCalendar();
    const calendarStart = parseUTCDate(calendar.startDate);
    const calendarEnd = parseUTCDate(calendar.endDate);
    const newDateEnd = createUTCDate(newDate.getUTCFullYear(), newDate.getUTCMonth() + 1, 0);
    
    if (newDate <= calendarEnd && newDateEnd >= calendarStart) {
        appState.currentDate = newDate;
        renderCalendar();
    }
}

// === INICIALITZACIÓ DE L'APLICACIÓ ===
function initializeApp() {
    document.addEventListener('click', handleAction);
    document.addEventListener('dblclick', handleAction);
    loadFromStorage();
    loadSavedTheme();
    getCurrentCalendar();
    updateUI();
    
    console.log(`[Sistema] Aplicación inicializada con ${appState.categoryTemplates.length} categorías en catálogo`);
    
    // Event listener per Enter en input de nova categoria
    const newCategoryInput = document.getElementById('new-category-name');
    if (newCategoryInput) {
        newCategoryInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addCategory();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);