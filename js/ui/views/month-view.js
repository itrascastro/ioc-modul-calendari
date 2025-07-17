/**
 * =================================================================
 * MONTH VIEW - RENDERITZADOR PER A VISTA MENSUAL
 * =================================================================
 * 
 * @file        month-view.js
 * @description Renderitzador específic per la vista mensual del calendari
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

// Renderitzador específic per a vista mensual
class MonthViewRenderer extends CalendarRenderer {
    constructor() {
        super();
        this.viewType = 'month';
    }
    
    // === RENDERITZACIÓ PRINCIPAL ===
    render(calendar, currentDate, outputFormat = 'DOM') {
        const year = currentDate.getUTCFullYear();
        const month = currentDate.getUTCMonth();
        
        // Calcular dies del mes
        const firstDayOfMonth = createUTCDate(year, month, 1);
        const lastDayOfMonth = createUTCDate(year, month + 1, 0);
        const startDayOfWeek = firstDayOfMonth.getUTCDay() === 0 ? 6 : firstDayOfMonth.getUTCDay() - 1;
        
        const monthData = {
            year: year,
            month: month,
            monthName: getMonthName(currentDate),
            days: []
        };
        
        // Dies del mes anterior (usa mètode del pare)
        const prevDays = this.completePeriodStartDays(firstDayOfMonth, startDayOfWeek, calendar);
        monthData.days.push(...prevDays);
        
        // Dies del mes actual
        for (let i = 1; i <= lastDayOfMonth.getUTCDate(); i++) {
            const date = createUTCDate(year, month, i);
            monthData.days.push(this.generateDayData(date, calendar, false));
        }
        
        // Dies del mes següent per completar la graella
        const totalCells = startDayOfWeek + lastDayOfMonth.getUTCDate();
        const nextMonthCells = (7 - (totalCells % 7)) % 7;
        if (nextMonthCells > 0) {
            const lastDayOfMonthDate = createUTCDate(year, month, lastDayOfMonth.getUTCDate());
            const lastDayOfWeek = lastDayOfMonthDate.getUTCDay() === 0 ? 6 : lastDayOfMonthDate.getUTCDay() - 1;
            const nextDays = this.completePeriodEndDays(lastDayOfMonthDate, lastDayOfWeek, calendar);
            monthData.days.push(...nextDays.slice(0, nextMonthCells));
        }
        
        // Generar sortida segons format
        if (outputFormat === 'HTML') {
            return this.generateHTMLOutput(monthData, calendar);
        } else {
            return this.generateDOMOutput(monthData, calendar);
        }
    }
    
    // === GENERACIÓ DE SORTIDA DOM ===
    generateDOMOutput(monthData, calendar) {
        return this.generateCalendarGridDOM(monthData.days, calendar);
    }
    
    // === GENERACIÓ DE SORTIDA HTML ===
    generateHTMLOutput(monthData, calendar) {
        return `
            <div class="month-section">
                <div class="month-header">${monthData.monthName}</div>
                ${this.generateCalendarGridHTML(monthData.days, calendar)}
            </div>
        `;
    }
}

// === INSTÀNCIA GLOBAL ===

// Renderitzador principal per a vista mensual
const monthRenderer = new MonthViewRenderer();

// === FUNCIONS PÚBLIQUES DE RENDERITZAT ===

// Renderitzar calendari principal
function renderCalendar() {
    const calendar = appStateManager.getCurrentCalendar();
    if (!calendar) {
        document.getElementById('calendar-grid-wrapper').innerHTML = '<p style="color: var(--secondary-text-color); font-style: italic; text-align: center; padding: 20px;">Selecciona un calendari.</p>';
        return;
    }
    
    const gridWrapper = document.getElementById('calendar-grid-wrapper');
    const periodDisplay = document.getElementById('current-period-display');
    
    const monthHTML = monthRenderer.render(calendar, appStateManager.currentDate, 'DOM');
    gridWrapper.innerHTML = monthHTML;
    periodDisplay.textContent = getMonthName(appStateManager.currentDate);
    
    // Actualitzar navegació
    updateNavigationButtons();
}

// Actualitzar botons de navegació
function updateNavigationButtons() {
    const calendar = appStateManager.getCurrentCalendar();
    if (!calendar) return;
    
    const prevBtn = document.querySelector('[data-direction="-1"]');
    const nextBtn = document.querySelector('[data-direction="1"]');
    
    if (!prevBtn || !nextBtn) return;
    
    const calendarStart = parseUTCDate(calendar.startDate);
    const calendarEnd = parseUTCDate(calendar.endDate);
    
    const prevMonthEnd = createUTCDate(
        appStateManager.currentDate.getUTCFullYear(), 
        appStateManager.currentDate.getUTCMonth(), 
        0
    );
    prevBtn.disabled = prevMonthEnd < calendarStart;
    
    const nextMonthStart = createUTCDate(
        appStateManager.currentDate.getUTCFullYear(), 
        appStateManager.currentDate.getUTCMonth() + 1, 
        1
    );
    nextBtn.disabled = nextMonthStart > calendarEnd;
}


// === FUNCIONS AUXILIARS ===

// Generar HTML d'esdeveniment
function generateEventHTML(event, calendar) {
    return monthRenderer.generateEventHTML(event, calendar, 'DOM');
}

// Generar cel·la de dia
function generateDayCell(date, calendar, isOutOfMonth = false) {
    const dayData = monthRenderer.generateDayData(date, calendar, isOutOfMonth);
    return monthRenderer.generateDayCellHTML(dayData, calendar, 'DOM');
}