// =================================================================
// STORAGE - GESTIÓ DE PERSISTÈNCIA DE DADES
// =================================================================

// Clau per localStorage
const STORAGE_KEY = 'calendari-ioc-data';

// === FUNCIONS DE PERSISTÈNCIA ===

// Guardar estat a localStorage
function saveToStorage() {
    try {
        // Preparar estat per guardar (convertir dates a strings)
        const stateToSave = { 
            ...appState, 
            currentDate: dateToUTCString(appState.currentDate) 
        };
        
        // Guardar a localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        
        console.log('[Storage] ✅ Estat guardat correctament');
        return true;
        
    } catch (error) {
        console.error('[Storage] ❌ Error guardant estat:', error);
        
        // Intentar alliberar espai si és problema de quota
        if (error.name === 'QuotaExceededError') {
            console.warn('[Storage] ⚠️ Quota exhaurida, intentant netejar...');
            clearOldData();
            
            // Tornar a intentar
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
                console.log('[Storage] ✅ Estat guardat després de netejar');
                return true;
            } catch (retryError) {
                console.error('[Storage] ❌ Error persistent després de netejar:', retryError);
                return false;
            }
        }
        
        return false;
    }
}

// Carregar estat des de localStorage
function loadFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        
        if (!data) {
            console.log('[Storage] ℹ️ No hi ha dades guardades');
            return false;
        }
        
        const loadedState = JSON.parse(data);
        
        // Restaurar estat (convertir strings a dates)
        appState = { 
            ...loadedState, 
            currentDate: parseUTCDate(loadedState.currentDate.split('T')[0]) 
        };
        
        // Migració automàtica: inicialitzar catàleg si no existeix
        if (!appState.categoryTemplates) {
            appState.categoryTemplates = [];
        }
        
        // Migració automàtica: inicialitzar events no ubicats si no existeixen
        if (!appState.unplacedEvents) {
            appState.unplacedEvents = [];
        }
        
        // Migrar plantilles de categories
        migrateCategoryTemplates();
        
        console.log('[Storage] ✅ Estat carregat correctament');
        console.log(`[Storage] 📊 Calendaris: ${Object.keys(appState.calendars).length}`);
        console.log(`[Storage] 📊 Categories: ${appState.categoryTemplates.length}`);
        console.log(`[Storage] 📊 Events no ubicats: ${appState.unplacedEvents.length}`);
        
        return true;
        
    } catch (error) {
        console.error('[Storage] ❌ Error carregant estat:', error);
        
        // Si hi ha error de parsing, netejar dades corruptes
        if (error instanceof SyntaxError) {
            console.warn('[Storage] ⚠️ Dades corruptes, netejant localStorage...');
            clearStorage();
        }
        
        return false;
    }
}

// Netejar localStorage
function clearStorage() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('[Storage] ✅ localStorage netejat');
        return true;
    } catch (error) {
        console.error('[Storage] ❌ Error netejant localStorage:', error);
        return false;
    }
}

// Netejar dades antigues per alliberar espai
function clearOldData() {
    try {
        // Netejar altres claus relacionades que poden existir
        const keysToCheck = [
            'calendarioIOC',  // Clau antiga
            'calendari-ioc-backup',
            'calendari-ioc-temp'
        ];
        
        keysToCheck.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`[Storage] 🧹 Netejat clau antiga: ${key}`);
            }
        });
        
        return true;
    } catch (error) {
        console.error('[Storage] ❌ Error netejant dades antigues:', error);
        return false;
    }
}

// Obtenir informació de l'emmagatzematge
function getStorageInfo() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        
        if (!data) {
            return {
                exists: false,
                size: 0,
                sizeFormatted: '0 B'
            };
        }
        
        const sizeInBytes = new Blob([data]).size;
        const sizeFormatted = formatBytes(sizeInBytes);
        
        return {
            exists: true,
            size: sizeInBytes,
            sizeFormatted: sizeFormatted,
            lastModified: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('[Storage] ❌ Error obtenint informació:', error);
        return {
            exists: false,
            size: 0,
            sizeFormatted: '0 B',
            error: error.message
        };
    }
}

// Exportar estat com a JSON
function exportState() {
    try {
        const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            data: {
                ...appState,
                currentDate: dateToUTCString(appState.currentDate)
            }
        };
        
        return JSON.stringify(exportData, null, 2);
        
    } catch (error) {
        console.error('[Storage] ❌ Error exportant estat:', error);
        return null;
    }
}

// Importar estat des de JSON
function importState(jsonData) {
    try {
        const importData = JSON.parse(jsonData);
        
        if (!importData.data || !importData.version) {
            throw new Error('Format de dades no vàlid');
        }
        
        // Restaurar estat
        appState = {
            ...importData.data,
            currentDate: parseUTCDate(importData.data.currentDate.split('T')[0])
        };
        
        // Guardar estat importat
        saveToStorage();
        
        console.log('[Storage] ✅ Estat importat correctament');
        return true;
        
    } catch (error) {
        console.error('[Storage] ❌ Error important estat:', error);
        return false;
    }
}

// === FUNCIONS AUXILIARS ===

// Formatear bytes en format llegible
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Verificar si localStorage està disponible
function isStorageAvailable() {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (error) {
        console.warn('[Storage] ⚠️ localStorage no disponible:', error);
        return false;
    }
}

// Inicialitzar sistema de persistència
function initializeStorage() {
    if (!isStorageAvailable()) {
        console.error('[Storage] ❌ localStorage no disponible');
        return false;
    }
    
    console.log('[Storage] ✅ Sistema de persistència inicialitzat');
    return true;
}