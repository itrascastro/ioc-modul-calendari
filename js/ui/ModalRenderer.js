/**
 * =================================================================
 * MODALS - GESTIÓ CENTRALITZADA DE MODALS
 * =================================================================
 * 
 * @file        ModalRenderer.js
 * @description Gestió de modals i formularis de l'aplicació
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

// Classe per gestionar tots els modals de l'aplicació
class ModalRenderer {
    
    // === FUNCIONS BÀSIQUES DE MODAL ===
    
    // Obrir modal
    openModal(modalId) {
        document.getElementById(modalId)?.classList.add('show');
    }
    
    // Tancar modal
    closeModal(modalId) {
        document.getElementById(modalId)?.classList.remove('show');
    }
    
    // === MODALS ESPECÍFICS ===
    
    // Modal de creació de nou calendari
    openNewCalendarModal() {
        appStateManager.editingCalendarId = null;
        document.getElementById('setupModalTitle').textContent = `Nou Calendari de Mòdul ${semesterConfig.getSemesterCode()}`;
        document.getElementById('cicleCode').value = '';
        document.getElementById('moduleCode').value = '';
        document.getElementById('saveCalendarBtn').textContent = 'Crear Calendari';
        document.getElementById('deleteCalendarBtn').style.display = 'none';
        this.openModal('calendarSetupModal');
    }
    
    // Modal d'accions de calendari
    openCalendarActionsModal(calendarId) {
        appStateManager.setSelectedCalendarId(calendarId);
        const calendar = appStateManager.calendars[calendarId];
        if (!calendar) return;
        
        const button = document.querySelector(`[data-calendar-id="${calendarId}"] .actions-menu`);
        const modal = document.getElementById('calendarActionsModal');
        const content = modal.querySelector('.calendar-actions-content');
        
        // Obtenir posició del botó
        const buttonRect = button.getBoundingClientRect();
        
        // Posicionar el modal com dropdown
        content.style.right = `${window.innerWidth - buttonRect.right}px`;
        content.style.top = `${buttonRect.bottom + 2}px`;
        
        // Afegir esdeveniment per tancar al fer clic fora
        const closeOnOutsideClick = (e) => {
            if (!content.contains(e.target) && !button.contains(e.target)) {
                this.closeModal('calendarActionsModal');
                document.removeEventListener('click', closeOnOutsideClick);
                modal.removeEventListener('mouseleave', closeOnMouseLeave);
            }
        };
        
        // Afegir esdeveniment per tancar al treure el ratolí
        const closeOnMouseLeave = (e) => {
            if (!content.contains(e.relatedTarget) && !button.contains(e.relatedTarget)) {
                this.closeModal('calendarActionsModal');
                modal.removeEventListener('mouseleave', closeOnMouseLeave);
                document.removeEventListener('click', closeOnOutsideClick);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeOnOutsideClick);
            modal.addEventListener('mouseleave', closeOnMouseLeave);
        }, 50);
        
        this.openModal('calendarActionsModal');
    }
    
    // Modal de selector de colors
    openColorPickerModal(categoryId, colorDotElement) {
        appStateManager.setSelectedCategoryId(categoryId);
        
        // Buscar la categoria per obtenir el seu color actual
        const calendar = appStateManager.getCurrentCalendar();
        if (!calendar) return;
        
        const category = CategoryService.findCategoryById(categoryId, calendar);
        if (!category) return;
        
        const modal = document.getElementById('colorPickerModal');
        const content = modal.querySelector('.color-picker-content');
        const grid = document.getElementById('colorPickerGrid');
        
        // Generar la graella de colors
        grid.innerHTML = categoryManager.colors.map(color => `
            <div class="color-option ${color === category.color ? 'selected' : ''}" 
                 style="background-color: ${color};" 
                 data-color="${color}" 
                 data-action="select-color"></div>
        `).join('');
        
        // Obtenir posició del color dot
        const buttonRect = colorDotElement.getBoundingClientRect();
        
        // Posicionar el modal com dropdown
        content.style.left = `${buttonRect.left}px`;
        content.style.top = `${buttonRect.bottom + 2}px`;
        
        // Afegir esdeveniment per tancar al fer clic fora
        const closeOnOutsideClick = (e) => {
            if (!content.contains(e.target) && !colorDotElement.contains(e.target)) {
                this.closeModal('colorPickerModal');
                document.removeEventListener('click', closeOnOutsideClick);
                modal.removeEventListener('mouseleave', closeOnMouseLeave);
            }
        };
        
        // Afegir esdeveniment per tancar al treure el ratolí
        const closeOnMouseLeave = (e) => {
            if (!content.contains(e.relatedTarget) && !colorDotElement.contains(e.relatedTarget)) {
                this.closeModal('colorPickerModal');
                modal.removeEventListener('mouseleave', closeOnMouseLeave);
                document.removeEventListener('click', closeOnOutsideClick);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeOnOutsideClick);
            modal.addEventListener('mouseleave', closeOnMouseLeave);
        }, 50);
        
        this.openModal('colorPickerModal');
    }
    
    // Modal d'esdeveniments
    openEventModal(event = null, date = null) {
        const calendar = appStateManager.getCurrentCalendar();
        if (!calendar) return;

        const modal = document.getElementById('eventModal');
        const title = document.getElementById('eventModalTitle');
        const deleteBtn = document.getElementById('deleteEventBtn');
        
        console.log('[Modal] Cridant populateCategorySelect...');
        eventManager.populateCategorySelect();
        console.log('[Modal] populateCategorySelect completada');

        if (event && !event.isSystemEvent) {
            appStateManager.editingEventId = event.id;
            title.textContent = 'Editar Event';
            document.getElementById('eventTitle').value = event.title;
            document.getElementById('eventDate').value = event.date;
            document.getElementById('eventCategory').value = event.categoryId;
            document.getElementById('eventDescription').value = event.description || '';
            deleteBtn.style.display = 'inline-block';
        } else {
            appStateManager.editingEventId = null;
            title.textContent = 'Nou Event';
            document.getElementById('eventTitle').value = '';
            document.getElementById('eventDate').value = date;
            document.getElementById('eventCategory').value = '';
            document.getElementById('eventDescription').value = '';
            deleteBtn.style.display = 'none';
        }

        this.openModal('eventModal');
    }
    
    // === FUNCIONS AUXILIARS ===
    
    // Seleccionar color de categoria
    selectCategoryColor(newColor) {
        const selectedCategoryId = appStateManager.getSelectedCategoryId();
        if (!selectedCategoryId) return;
        
        const calendar = appStateManager.getCurrentCalendar();
        if (!calendar) return;
        
        // Actualitzar en catàleg global
        const templateIndex = appStateManager.categoryTemplates.findIndex(t => t.id === selectedCategoryId);
        if (templateIndex > -1) {
            appStateManager.categoryTemplates[templateIndex].color = newColor;
        }
        
        // Actualitzar en TOTS els calendaris que tinguin aquesta categoria
        Object.values(appStateManager.calendars).forEach(cal => {
            const calendarCategory = cal.categories.find(c => c.id === selectedCategoryId);
            if (calendarCategory) {
                calendarCategory.color = newColor;
            }
        });
        
        this.closeModal('colorPickerModal');
        storageManager.saveToStorage();
        panelsRenderer.renderCategories();
        viewManager.renderCurrentView(); // Re-renderitzar per mostrar canvis en esdeveniments
        
        appStateManager.clearSelectedCategoryId();
    }
}

// === INSTÀNCIA GLOBAL ===
const modalRenderer = new ModalRenderer();