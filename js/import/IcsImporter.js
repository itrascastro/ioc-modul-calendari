/**
 * =================================================================
 * ICS IMPORTER - IMPORTACIÓ DE CALENDARIS DES DE FORMAT ICS
 * =================================================================
 * 
 * @file        IcsImporter.js
 * @description Importador de calendaris des de fitxers ICS/iCalendar per calendaris tipus "Altre"
 * @author      Ismael Trascastro <itrascastro@ioc.cat>
 * @version     1.0.0
 * @date        2025-01-24
 * @project     Calendari Mòdul IOC
 * @repository  https://github.com/itrascastro/ioc-modul-calendari
 * @license     MIT
 * 
 * Aquest fitxer forma part del projecte Calendari Mòdul IOC,
 * una aplicació web per gestionar calendaris acadèmics.
 * 
 * =================================================================
 */

// Classe per importar calendaris des de fitxers ICS
class IcsImporter {
    constructor() {
        this.importType = 'ics';
    }
    
    // === IMPORTACIÓ PRINCIPAL ===
    importIcsFile(callback) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.ics';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const icsContent = e.target.result;
                        const calendarData = this.parseIcsContent(icsContent, file.name);
                        callback(calendarData);
                    } catch (error) {
                        uiHelper.showMessage('Error llegint el fitxer ICS: ' + error.message, 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
    
    // === PARSING DE CONTINGUT ICS ===
    parseIcsContent(icsContent, fileName) {
        const lines = icsContent.split(/\r?\n/);
        const events = [];
        let currentEvent = null;
        let allDates = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line === 'BEGIN:VEVENT') {
                currentEvent = {};
            } else if (line === 'END:VEVENT' && currentEvent) {
                if (currentEvent.title && currentEvent.dtstart) {
                    const eventDays = this.generateEventDays(currentEvent);
                    events.push(...eventDays);
                    allDates.push(...eventDays.map(e => e.date));
                }
                currentEvent = null;
            } else if (currentEvent) {
                if (line.startsWith('SUMMARY:')) {
                    currentEvent.title = this.unescapeIcsText(line.substring(8));
                } else if (line.startsWith('DTSTART;VALUE=DATE:')) {
                    currentEvent.dtstart = {
                        type: 'date',
                        value: line.substring(19)
                    };
                } else if (line.startsWith('DTSTART:')) {
                    currentEvent.dtstart = {
                        type: 'datetime',
                        value: line.substring(8)
                    };
                } else if (line.startsWith('DTEND;VALUE=DATE:')) {
                    currentEvent.dtend = {
                        type: 'date',
                        value: line.substring(17)
                    };
                } else if (line.startsWith('DTEND:')) {
                    currentEvent.dtend = {
                        type: 'datetime',
                        value: line.substring(6)
                    };
                } else if (line.startsWith('DESCRIPTION:')) {
                    currentEvent.description = this.unescapeIcsText(line.substring(12));
                }
            }
        }
        
        if (events.length === 0) {
            throw new Error('No s\'han trobat esdeveniments vàlids al fitxer ICS');
        }
        
        // Calcular dates d'inici i fi del calendari
        allDates.sort();
        const startDate = allDates[0];
        const endDate = allDates[allDates.length - 1];
        
        // Generar nom del calendari des del nom del fitxer
        const calendarName = fileName.replace(/\.ics$/i, '').trim();
        
        return {
            name: calendarName,
            startDate: startDate,
            endDate: endDate,
            events: events,
            totalEvents: events.length
        };
    }
    
    // === GENERACIÓ D'ESDEVENIMENTS PER DIES ===
    generateEventDays(eventData) {
        const events = [];
        const title = eventData.title;
        const description = eventData.description || '';
        
        // Determinar títol amb hora si és necessari
        let eventTitle = title;
        if (eventData.dtstart.type === 'datetime') {
            const startTime = this.extractTime(eventData.dtstart.value);
            if (startTime) {
                eventTitle = `[${startTime}] ${title}`;
            }
        }
        
        // Calcular dies de l'esdeveniment
        const startDate = this.parseIcsDate(eventData.dtstart.value);
        let endDate = startDate;
        
        if (eventData.dtend) {
            endDate = this.parseIcsDate(eventData.dtend.value);
            // Per esdeveniments de dia sencer, DTEND és el dia següent
            if (eventData.dtend.type === 'date') {
                const endDateObj = new Date(endDate);
                endDateObj.setDate(endDateObj.getDate() - 1);
                endDate = endDateObj.toISOString().substring(0, 10);
            }
        }
        
        // Generar esdeveniment per cada dia
        const currentDate = new Date(startDate);
        const lastDate = new Date(endDate);
        
        while (currentDate <= lastDate) {
            events.push({
                title: eventTitle,
                date: currentDate.toISOString().substring(0, 10),
                description: description,
                categoryId: 'IMPORTATS',
                isSystemEvent: false
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return events;
    }
    
    // === UTILITATS DE PARSING ===
    parseIcsDate(dateValue) {
        // Pot ser YYYYMMDD o YYYYMMDDTHHMMSSZ
        const dateStr = dateValue.substring(0, 8);
        if (dateStr.length === 8) {
            return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
        }
        throw new Error(`Format de data invàlid: ${dateValue}`);
    }
    
    extractTime(dateTimeValue) {
        // Format: YYYYMMDDTHHMMSSZ o YYYYMMDDTHHMMSS
        if (dateTimeValue.length >= 15 && dateTimeValue.charAt(8) === 'T') {
            const timeStr = dateTimeValue.substring(9, 15); // HHMMSS
            const hours = timeStr.substring(0, 2);
            const minutes = timeStr.substring(2, 4);
            return `${hours}:${minutes}`;
        }
        return null;
    }
    
    unescapeIcsText(text) {
        return text
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\,/g, ',')
            .replace(/\\;/g, ';')
            .replace(/\\\\/g, '\\');
    }
}

// === INSTÀNCIA GLOBAL ===
const icsImporter = new IcsImporter();