/**
 * =================================================================
 * CALENDARI IOC EXCEPTION - SISTEMA CENTRALITZAT D'ERRORS
 * =================================================================
 * 
 * @file        CalendariIOCException.js
 * @description Sistema d'excepció única per tota l'aplicació amb codis numèrics
 * @author      Ismael Trascastro <itrascastro@ioc.cat>
 * @version     1.0.0
 * @date        2025-07-28
 * @project     Calendari Mòdul IOC
 * @repository  https://github.com/itrascastro/ioc-modul-calendari
 * @license     MIT
 * 
 * Aquest fitxer implementa el patró Exception Translation per convertir
 * errors JavaScript nadius i de validació a una excepció del domini.
 * 
 * =================================================================
 */

/**
 * Excepció centralitzada per tota l'aplicació Calendari IOC
 * Implementa el patró Exception Translation amb sistema de codis numèrics
 * 
 * @class CalendariIOCException
 * @extends Error
 */
class CalendariIOCException extends Error {
    /**
     * Constructor de l'excepció del domini
     * 
     * @param {string} codiCausa - Codi numèric de l'error (1xx, 2xx, 3xx, etc.)
     * @param {string} context - Context d'on prové l'error per debugging
     */
    constructor(codiCausa, context = '') {
        super();
        this.name = 'CalendariIOCException';
        this.codiCausa = codiCausa;
        this.context = context;
        this.timestamp = new Date();
        this.missatge = this.getMissatgePerCodi(codiCausa);
    }
    
    /**
     * Mapa centralitzat dels missatges d'error de l'aplicació
     * Versió inicial amb només els codis utilitzats en StorageManager
     * Es van afegint més codis a mesura que es migren altres classes
     * 
     * @param {string} codi - Codi numèric de l'error
     * @returns {string} Missatge d'error localitzat
     */
    getMissatgePerCodi(codi) {
        const missatges = {
            // === ERRORS DE CONFIGURACIÓ (1xx) ===
            // Problemes de càrrega inicial de configuració
            "108": "Error carregant configuració de semestre",
            "109": "Error carregant fitxer de configuració",
            "110": "Error parsejant fitxer de configuració",
            
            // === ERRORS DE REPLICACIÓ (2xx) ===
            // Problemes tècnics durant la replicació
            "207": "Error durant la replicació",
            
            // === ERRORS DE SISTEMA (3xx) ===
            // localStorage, quota, inicialització
            "301": "localStorage no disponible",
            "302": "Quota de localStorage exhaurida", 
            "303": "Dades corruptes al localStorage",
            "304": "Error exportant estat",
            
            // === ERRORS DE DESENVOLUPAMENT (6xx) ===
            // Format i validació de dades
            "609": "Format de dades no vàlid",
            
            // === 999: ERRORS NO CONTROLATS ===
            "999": "Error no controlat del sistema"
        };
        
        return missatges[codi] || "Error desconegut";
    }
    
    /**
     * Genera missatge formatat per logging amb context i timestamp
     * 
     * @returns {string} Missatge complet per consola
     */
    getMessage() {
        const contextStr = this.context ? ` [${this.context}]` : '';
        const timeStr = this.timestamp.toISOString();
        return `Error ${this.codiCausa}${contextStr} (${timeStr}): ${this.missatge}`;
    }
    
    // === MÈTODES DE CLASSIFICACIÓ ===
    // Permeten al Bootstrap classificar el tipus d'error per respondre adequadament
    
    /**
     * @returns {boolean} True si és error de validació d'usuari
     */
    isValidationError() { 
        return this.codiCausa.startsWith('1'); 
    }
    
    /**
     * @returns {boolean} True si és error tècnic 
     */
    isTechnicalError() { 
        return this.codiCausa.startsWith('2'); 
    }
    
    /**
     * @returns {boolean} True si és error de sistema
     */
    isSystemError() { 
        return this.codiCausa.startsWith('3'); 
    }
    
    /**
     * @returns {boolean} True si és error de domini/negoci
     */
    isDomainError() { 
        return this.codiCausa.startsWith('4'); 
    }
    
    /**
     * @returns {boolean} True si és error de vista/renderitzat
     */
    isViewError() { 
        return this.codiCausa.startsWith('5'); 
    }
    
    /**
     * @returns {boolean} True si és error de desenvolupament
     */
    isDevelopmentError() { 
        return this.codiCausa.startsWith('6'); 
    }
}