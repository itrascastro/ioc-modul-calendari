// =================================================================
// REPLICATION ENGINE - MOTOR DE REPLICACIÓ PROPORCIONAL
// =================================================================

// CLASSE DE MOTOR DE REPLICACIÓ: Implementa algoritme proporcional amb configuració simplificada
class ReplicationEngine {
    constructor() {
        this.ENGINE_NAME = 'replicaEngine';
        this.DEFAULT_CONFIG = {
            respectFestivals: true,
            balancedStrategy: true,
            temporalAdjustment: true,
            strictValidation: true
        };
        this.EVENT_TYPES = {
            PROFESSOR: 'professor',
            IOC: 'ioc',
            FESTIU: 'festiu',
            REPLICATED: 'replicated',
            PAF1: 'paf1',
            PAF2: 'paf2'
        };
    }
    
    // Função principal del motor proporcional
    replicate(sourceCalendar, targetCalendar) {
        console.log(`[${this.ENGINE_NAME}] 🚀 Iniciant replicació amb configuració simplificada...`);
        
        try {
            // Validació bàsica
            if (!sourceCalendar?.events || !targetCalendar?.startDate || !targetCalendar?.endDate) {
                throw new Error('Calendaris invàlids: manca estructura bàsica');
            }
            
            // Filtrar esdeveniments del professor
            const professorEvents = sourceCalendar.events
                .filter(event => this.isProfessorEvent(event))
                .sort((a, b) => new Date(a.date) - new Date(b.date));
            
            console.log(`[${this.ENGINE_NAME}] 👨‍🏫 Events del professor a replicar: ${professorEvents.length}`);
            
            if (professorEvents.length === 0) {
                console.log(`[${this.ENGINE_NAME}] ⚠️ No hi ha events del professor per replicar`);
                return { placed: [], unplaced: [] };
            }
            
            // Construir espais útils
            const espaiUtilOrigen = this.analyzeWorkableSpace(sourceCalendar);
            const espaiUtilDesti = this.analyzeWorkableSpace(targetCalendar);
            
            console.log(`[${this.ENGINE_NAME}] 📊 Espai Origen: ${espaiUtilOrigen.length} dies útils`);
            console.log(`[${this.ENGINE_NAME}] 📊 Espai Destí: ${espaiUtilDesti.length} dies útils`);
            
            if (espaiUtilDesti.length === 0) {
                console.warn(`[${this.ENGINE_NAME}] ⚠️ Calendari destí sense espai útil disponible`);
                return { 
                    placed: [], 
                    unplaced: professorEvents.map(event => ({ 
                        event, 
                        sourceCalendar,
                        reason: "Calendari destí sense espai útil disponible" 
                    })) 
                };
            }
            
            // Calcular factor de proporció
            const factorProporcio = espaiUtilDesti.length / espaiUtilOrigen.length;
            console.log(`[${this.ENGINE_NAME}] ⚖️ Factor de proporció: ${factorProporcio.toFixed(3)}`);
            
            // Mapa d'ocupació del destí
            const ocupacioEspaiDesti = new Map(espaiUtilDesti.map(date => [date, 'LLIURE']));
            
            const placedEvents = [];
            const unplacedEvents = [];
            
            // Bucle principal de replicació
            professorEvents.forEach((event, index) => {
                console.log(`[${this.ENGINE_NAME}] 🔄 Processant (${index + 1}/${professorEvents.length}): "${event.title}"`);
                
                // Trobar posició en espai origen
                const indexOrigen = espaiUtilOrigen.indexOf(event.date);
                
                if (indexOrigen === -1) {
                    console.warn(`[${this.ENGINE_NAME}] ⚠️ Event "${event.title}" no troba posició en espai origen`);
                    unplacedEvents.push({ 
                        event, 
                        sourceCalendar,
                        reason: "Event no està en espai útil d'origen" 
                    });
                    return;
                }
                
                // Calcular posició ideal en espai destí
                const indexIdeal = Math.round(indexOrigen * factorProporcio);
                
                // Cerca radial de slot lliure
                const indexFinal = this.findNearestFreeSlot(ocupacioEspaiDesti, indexIdeal);
                
                if (indexFinal === -1) {
                    console.warn(`[${this.ENGINE_NAME}] ⚠️ No es troba slot lliure per "${event.title}"`);
                    unplacedEvents.push({ 
                        event, 
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
                    id: generateNextEventId(appState.currentCalendarId),
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
                    confidence: replicatedEvent.replicationConfidence,
                    reason: this.generateProportionalReason(indexOrigen, indexIdeal, indexFinal, factorProporcio)
                });
                
                console.log(`[${this.ENGINE_NAME}] ✅ "${event.title}": ${event.date} → ${newDate} (pos ${indexOrigen + 1}→${indexFinal + 1})`);
            });
            
            console.log(`[${this.ENGINE_NAME}] 📈 Resultat: ${placedEvents.length} ubicats, ${unplacedEvents.length} no ubicats`);
            
            // Validació final de seguretat
            const weekendEvents = placedEvents.filter(item => !isWeekdayStr(item.newDate));
            if (weekendEvents.length > 0) {
                console.error(`[${this.ENGINE_NAME}] ❌ ERROR CRÍTIC: ${weekendEvents.length} events en caps de setmana!`);
                throw new Error(`Error de disseny: ${weekendEvents.length} events generats en caps de setmana`);
            }
            
            console.log(`[${this.ENGINE_NAME}] ✅ Replicació proporcional completada amb èxit`);
            
            return { placed: placedEvents, unplaced: unplacedEvents };
            
        } catch (error) {
            console.error(`[${this.ENGINE_NAME}] ❌ Error en replicació proporcional:`, error);
            throw error;
        }
    }
    
    // Anàlisi de l'espai útil
    analyzeWorkableSpace(calendar) {
        console.log(`[Espai Útil] 🔍 Analitzant espai útil per: ${calendar.name}`);
        
        const espaiUtil = [];
        const dataFiAvalucions = this.findEvaluationEndDate(calendar);
        
        // Esdeveniments que ocupen l'espai (sistema IOC, festius, etc.)
        const occupiedBySystem = new Set(
            calendar.events
                .filter(e => e.eventType === 'FESTIU' || e.isSystemEvent)
                .map(e => e.date)
        );
        
        console.log(`[Espai Útil] 📅 Període: ${calendar.startDate} → ${dataFiAvalucions}`);
        console.log(`[Espai Útil] 🚫 Dies ocupats pel sistema: ${occupiedBySystem.size}`);
        
        // Iterar dia a dia
        let currentDate = parseUTCDate(calendar.startDate);
        const endDate = parseUTCDate(dataFiAvalucions);
        
        while (currentDate <= endDate) {
            const dateStr = dateToUTCString(currentDate);
            
            // Només dies laborals que no estan ocupats pel sistema
            if (isWeekdayStr(dateStr) && !occupiedBySystem.has(dateStr)) {
                espaiUtil.push(dateStr);
            }
            
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
        
        console.log(`[Espai Útil] ✅ Espai útil construït: ${espaiUtil.length} dies disponibles`);
        
        return espaiUtil;
    }
    
    // Cerca radial de slots lliures
    findNearestFreeSlot(ocupacioMap, indexIdeal) {
        const dates = Array.from(ocupacioMap.keys());
        
        // Assegurar que l'índex està dins dels límits
        if (indexIdeal >= dates.length) indexIdeal = dates.length - 1;
        if (indexIdeal < 0) indexIdeal = 0;
        
        // Comprovar primer la posició ideal
        if (ocupacioMap.get(dates[indexIdeal]) === 'LLIURE') {
            return indexIdeal;
        }
        
        // Cerca radial: alternar entre endavant i enrere
        let radiCerca = 1;
        while (true) {
            const indexEnrere = indexIdeal - radiCerca;
            const indexEndavant = indexIdeal + radiCerca;
            
            // Comprovar enrere primer (preferim mantenir ordre cronològic)
            if (indexEnrere >= 0 && ocupacioMap.get(dates[indexEnrere]) === 'LLIURE') {
                return indexEnrere;
            }
            
            // Comprovar endavant
            if (indexEndavant < dates.length && ocupacioMap.get(dates[indexEndavant]) === 'LLIURE') {
                return indexEndavant;
            }
            
            // Si hem sortit dels límits per ambdós costats, no hi ha slot disponible
            if (indexEnrere < 0 && indexEndavant >= dates.length) {
                return -1;
            }
            
            radiCerca++;
            
            // Seguretat: evitar bucle infinit
            if (radiCerca > dates.length) {
                return -1;
            }
        }
    }
    
    // Detectar data de fi d'avaluacions (cercar PAF1)
    findEvaluationEndDate(calendar) {
        console.log(`[PAF Detection] 🎯 Buscant PAF1 al calendari: ${calendar.name}`);
        
        // Cercar PAF1 en esdeveniments del calendari
        const paf1Event = calendar.events.find(event => event.eventType === 'PAF1');
        
        if (paf1Event) {
            console.log(`[PAF Detection] ✅ PAF1 trobat: ${paf1Event.date}`);
            return paf1Event.date;
        }
        
        // Fallback: cercar en configuració IOC
        const paf1Config = IOC_SEMESTER_TEMPLATE.events.find(event => event.eventType === 'PAF1');
        
        if (paf1Config && paf1Config.date >= calendar.startDate && paf1Config.date <= calendar.endDate) {
            console.log(`[PAF Detection] ✅ PAF1 de configuració: ${paf1Config.date}`);
            return paf1Config.date;
        }
        
        console.error('[PAF Detection] ❌ PAF1 no trobat! Usant final de calendari');
        return calendar.endDate;
    }
    
    // Filtres d'esdeveniments
    isProfessorEvent(event) {
        return event && !this.isSystemEvent(event);
    }
    
    isSystemEvent(event) {
        return event && event.isSystemEvent === true;
    }
    
    isPAF1Event(event) {
        return event && event.eventType === 'PAF1';
    }
    
    // Generació de raons proporcionals (simplificada)
    generateProportionalReason(indexOrigen, indexIdeal, indexFinal, factorProporcio) {
        return '';
    }
    
    // Càlcul de confiança proporcional
    calculateProportionalConfidence(indexOrigen, indexIdeal, indexFinal, factorProporcio) {
        let confidence = 95; // Base alta per al motor proporcional
        
        // Penalització per diferència entre ideal i final
        const diferencia = Math.abs(indexIdeal - indexFinal);
        if (diferencia > 0) {
            confidence -= Math.min(diferencia * 2, 15); // Màxim -15%
        }
        
        // Bonificació per factors de proporció "nets"
        if (Math.abs(factorProporcio - 1.0) < 0.1) {
            confidence += 3; // Replicació gairebé directa
        }
        
        // Garantir límits
        return Math.max(Math.min(confidence, 99), 70);
    }
}

// === INSTÀNCIA GLOBAL DEL MOTOR ===

// Motor de replicació
const replicationEngine = new ReplicationEngine();

// === INICIALITZACIÓ ===

// Inicialitzar motor de replicació
function initializeReplicationEngine() {
    console.log('[ReplicationEngine] ✅ Motor de replicació inicialitzat');
}