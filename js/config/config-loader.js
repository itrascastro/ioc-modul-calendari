// =================================================================
// CONFIG LOADER - CÀRREGA DE CONFIGURACIÓ DEL SEMESTRE IOC
// =================================================================

// Variables globals per mantenir compatibilitat amb el codi existent
let IOC_SEMESTER_CONFIG = null;
let IOC_SEMESTER_TEMPLATE = null;
let defaultCategories = [];

// Configuració de fallback (configuració hardcoded original)
const FALLBACK_CONFIG = {
    semester: {
        code: "24S2",
        startDate: "2025-02-14",
        endDate: "2025-06-27",
        name: "Segon Semestre 2024-25"
    },
    systemEvents: [
        { id: 'SYS_FESTIU_20250303', title: 'Festiu centre', date: '2025-03-03', categoryId: 'SYSTEMCAT_1', isSystemEvent: true, eventType: 'FESTIU' },
        { id: 'SYS_FESTIU_20250501', title: 'Festa del Treball', date: '2025-05-01', categoryId: 'SYSTEMCAT_1', isSystemEvent: true, eventType: 'FESTIU' },
        { id: 'SYS_IOC_ORIENTACIONS_PAF', title: 'Orientacions PAF', date: '2025-05-14', categoryId: 'SYSTEMCAT_2', isSystemEvent: true, eventType: 'IOC_GENERIC' },
        { id: 'SYS_PAF1_20250524', title: 'PAF1', date: '2025-05-24', categoryId: 'SYSTEMCAT_3', isSystemEvent: true, eventType: 'PAF1' },
        { id: 'SYS_PAF2_20250607', title: 'PAF2', date: '2025-06-07', categoryId: 'SYSTEMCAT_3', isSystemEvent: true, eventType: 'PAF2' }
    ],
    systemRanges: [
        { idPrefix: 'SYS_SS_2025', title: 'Vacances Setmana Santa', startDate: '2025-04-12', endDate: '2025-04-21', categoryId: 'SYSTEMCAT_1', isSystemEvent: true, eventType: 'FESTIU' },
        { idPrefix: 'SYS_REVP1_2025', title: 'Revisió PAF1', startDate: '2025-05-30', endDate: '2025-06-03', categoryId: 'SYSTEMCAT_2', isSystemEvent: true, eventType: 'IOC_GENERIC' },
        { idPrefix: 'SYS_REVP2_2025', title: 'Revisió PAF2', startDate: '2025-06-13', endDate: '2025-06-17', categoryId: 'SYSTEMCAT_2', isSystemEvent: true, eventType: 'IOC_GENERIC' }
    ],
    defaultCategories: [
        { id: 'SYSTEMCAT_1', name: 'Festiu', color: '#f43f5e', isSystem: true },
        { id: 'SYSTEMCAT_2', name: 'IOC', color: '#3b82f6', isSystem: true },
        { id: 'SYSTEMCAT_3', name: 'PAF', color: '#8b5cf6', isSystem: true }
    ]
};

// Carregar configuració des del fitxer JSON
async function loadSemesterConfig() {
    try {
        console.log('[Config] 📥 Carregant configuració del semestre...');
        
        // Detectar si s'està executant des de file:// (desenvolupament local)
        if (window.location.protocol === 'file:') {
            console.log('[Config] 📁 Detectat protocol file://, usant configuració de fallback');
            loadFallbackConfig();
            return true;
        }
        
        const response = await fetch('js/config/semester-config.json');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const config = await response.json();
        
        // Crear variables globals amb el format original
        IOC_SEMESTER_CONFIG = {
            startDate: config.semester.startDate,
            endDate: config.semester.endDate,
            semester: config.semester.code
        };
        
        IOC_SEMESTER_TEMPLATE = {
            events: config.systemEvents,
            ranges: config.systemRanges
        };
        
        defaultCategories = config.defaultCategories;
        
        console.log('[Config] ✅ Configuració JSON carregada correctament');
        logConfigInfo();
        
        return true;
        
    } catch (error) {
        console.error('[Config] ❌ Error carregant configuració:', error);
        console.warn('[Config] 🔄 Usant configuració de fallback...');
        
        // Usar configuració de fallback
        loadFallbackConfig();
        return false;
    }
}

// Carregar configuració de fallback
function loadFallbackConfig() {
    IOC_SEMESTER_CONFIG = {
        startDate: FALLBACK_CONFIG.semester.startDate,
        endDate: FALLBACK_CONFIG.semester.endDate,
        semester: FALLBACK_CONFIG.semester.code
    };
    
    IOC_SEMESTER_TEMPLATE = {
        events: FALLBACK_CONFIG.systemEvents,
        ranges: FALLBACK_CONFIG.systemRanges
    };
    
    defaultCategories = FALLBACK_CONFIG.defaultCategories;
    
    console.log('[Config] ✅ Configuració de fallback carregada');
    logConfigInfo();
}

// Mostrar informació de la configuració carregada
function logConfigInfo() {
    console.log(`[Config] 📅 Semestre: ${IOC_SEMESTER_CONFIG.semester}`);
    console.log(`[Config] 📅 Període: ${IOC_SEMESTER_CONFIG.startDate} → ${IOC_SEMESTER_CONFIG.endDate}`);
    console.log(`[Config] 🎯 Events sistema: ${IOC_SEMESTER_TEMPLATE.events.length}`);
    console.log(`[Config] 📊 Rangs sistema: ${IOC_SEMESTER_TEMPLATE.ranges.length}`);
    console.log(`[Config] 🏷️ Categories per defecte: ${defaultCategories.length}`);
}

// Verificar que la configuració sigui vàlida
function validateConfig() {
    if (!IOC_SEMESTER_CONFIG || !IOC_SEMESTER_TEMPLATE || !defaultCategories) {
        console.error('[Config] ❌ Configuració incompleta');
        return false;
    }
    
    if (!IOC_SEMESTER_CONFIG.startDate || !IOC_SEMESTER_CONFIG.endDate) {
        console.error('[Config] ❌ Dates del semestre no vàlides');
        return false;
    }
    
    if (!Array.isArray(IOC_SEMESTER_TEMPLATE.events) || !Array.isArray(IOC_SEMESTER_TEMPLATE.ranges)) {
        console.error('[Config] ❌ Events o rangs del sistema no vàlids');
        return false;
    }
    
    if (!Array.isArray(defaultCategories) || defaultCategories.length === 0) {
        console.error('[Config] ❌ Categories per defecte no vàlides');
        return false;
    }
    
    return true;
}

// Funció per obtenir informació de la configuració
function getConfigInfo() {
    if (!IOC_SEMESTER_CONFIG) {
        return 'Configuració no carregada';
    }
    
    return {
        semester: IOC_SEMESTER_CONFIG.semester,
        startDate: IOC_SEMESTER_CONFIG.startDate,
        endDate: IOC_SEMESTER_CONFIG.endDate,
        systemEventsCount: IOC_SEMESTER_TEMPLATE?.events?.length || 0,
        systemRangesCount: IOC_SEMESTER_TEMPLATE?.ranges?.length || 0,
        defaultCategoriesCount: defaultCategories?.length || 0
    };
}

// Inicialitzar configuració quan es carregui la pàgina
document.addEventListener('DOMContentLoaded', async () => {
    await loadSemesterConfig();
    
    if (validateConfig()) {
        console.log('[Config] ✅ Configuració validada correctament');
        
        // Disparar event personalitzat per notificar que la configuració està llesta
        const configLoadedEvent = new CustomEvent('configLoaded', {
            detail: getConfigInfo()
        });
        document.dispatchEvent(configLoadedEvent);
    } else {
        console.error('[Config] ❌ Error de validació de configuració');
    }
});