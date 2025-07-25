# Configuració Semestral

Aquesta guia està dirigida a **administradors i coordinadors** de l'IOC que necessiten actualitzar la configuració de l'aplicació cada nou curs acadèmic o semestre.

## Visió General

L'aplicació Calendari IOC utilitza fitxers de configuració JSON per establir automàticament:
- Dates d'inici i fi de semestre
- Esdeveniments del sistema (festius, PAF, etc.)
- Categories per defecte per cada tipus d'estudi
- Codis de semestre per nomenclatura

## Fitxers de Configuració

### Ubicació dels fitxers
```
config/
├── common-semestre.json    # Configuració compartida
├── fp-semestre.json        # Específic de Formació Professional
└── btx-semestre.json       # Específic de Batxillerat
```

### Jerarquia de configuració
1. **common-semestre.json**: Base compartida per tots els tipus
2. **fp-semestre.json / btx-semestre.json**: Configuracions específiques que s'afegeixen a la base

## 🛠️ Actualització Each Semestre

### Tasques obligatòries cada semestre

#### 1. Actualitzar dates del semestre
**Fitxer**: `config/common-semestre.json`

```json
{
  "semester": {
    "code": "2024-25_S2",
    "name": "Segon Semestre 2024-25",
    "startDate": "2025-02-03",
    "endDate": "2025-06-13",
    "paf1Date": "2025-05-15"
  }
}
```

**Camps a actualitzar:**
- **code**: Format `YYYY-YY_SN` (any acadèmic + semestre)
- **name**: Nom descriptiu del semestre
- **startDate**: Data d'inici de les classes (format YYYY-MM-DD)
- **endDate**: Data de fi del semestre
- **paf1Date**: Data de la primera PAF (opcional)

#### 2. Actualitzar esdeveniments del sistema
**Fitxer**: `config/common-semestre.json`

```json
{
  "systemEvents": [
    {
      "id": "festiu_2024_01",
      "title": "Dia de Reis",
      "date": "2025-01-06",
      "categoryId": "FESTIU",
      "description": "Festiu oficial",
      "isSystemEvent": true
    },
    {
      "id": "paf1_2025_s2",
      "title": "PAF1 - Primera sessió",
      "date": "2025-05-15",
      "categoryId": "PAF",
      "description": "Prova d'Avaluació Final - Primera convocatòria",
      "isSystemEvent": true
    }
  ]
}
```

**Tipus d'esdeveniments comuns:**
- **Festius**: Dies festius oficials
- **PAF**: Proves d'Avaluació Final
- **Períodes especials**: Vacances, esdeveniments institucionals

#### 3. Revisar categories per defecte
**Fitxers**: `config/fp-semestre.json` i `config/btx-semestre.json`

```json
{
  "defaultCategories": [
    {
      "id": "IOC_GENERIC",
      "name": "IOC",
      "color": "#3182ce",
      "isSystem": true
    },
    {
      "id": "FESTIU", 
      "name": "Festius",
      "color": "#e53e3e",
      "isSystem": true
    },
    {
      "id": "PAF",
      "name": "PAF",
      "color": "#805ad5",
      "isSystem": true
    }
  ]
}
```

## Calendari Acadèmic IOC

### Estructura típica d'un curs acadèmic

**Primer Semestre (S1):**
- Inici: Mitjans de setembre
- Fi: Final de gener
- PAF1: Desembre
- PAF2: Gener/Febrer

**Segon Semestre (S2):**
- Inici: Principis de febrer  
- Fi: Mitjans de juny
- PAF1: Maig
- PAF2: Juny

### Dates clau a configurar

#### Festius habituals per semestre
```json
// Primer semestre
"2024-10-12": "Dia de la Hispanitat",
"2024-11-01": "Tots Sants", 
"2024-12-06": "Dia de la Constitució",
"2024-12-08": "La Immaculada",
"2024-12-25": "Nadal",
"2025-01-01": "Any Nou",
"2025-01-06": "Reis"

// Segon semestre  
"2025-03-19": "Sant Josep",
"2025-04-18": "Divendres Sant",
"2025-04-21": "Dilluns de Pasqua",
"2025-05-01": "Festa del Treball",
"2025-06-24": "Sant Joan"
```

#### Períodes de PAF
- **PAF1**: Normalment 3-4 setmanes abans del final del semestre
- **PAF2**: 1-2 setmanes després de PAF1
- **Recuperació**: Segons calendari institucional

## Procediment d'Actualització

### Pas 1: Preparació
1. **Backup**: Fes còpia dels fitxers de configuració actuals
2. **Calendari oficial**: Consulta el calendari acadèmic oficial de l'IOC
3. **Dates confirmates**: Assegura't que les dates són definitives

### Pas 2: Actualització de common-semestre.json
```json
{
  "semester": {
    "code": "2025-26_S1",                    # ← ACTUALITZAR
    "name": "Primer Semestre 2025-26",       # ← ACTUALITZAR  
    "startDate": "2025-09-15",               # ← ACTUALITZAR
    "endDate": "2026-01-23",                 # ← ACTUALITZAR
    "paf1Date": "2025-12-15"                 # ← ACTUALITZAR
  },
  "systemEvents": [
    # ← ACTUALITZAR tots els esdeveniments
  ]
}
```

### Pas 3: Verificació de configuracions específiques
**fp-semestre.json:**
- Revisar si hi ha canvis en categories específiques d'FP
- Actualitzar esdeveniments específics de Formació Professional

**btx-semestre.json:**
- Revisar categories específiques de Batxillerat
- Actualitzar esdeveniments específics de BTX

### Pas 4: Testing
1. **Crear calendari de prova**: Crea un calendari FP i un BTX
2. **Verificar dates**: Comprova que les dates són correctes
3. **Revisar esdeveniments**: Confirma que apareixen els esdeveniments del sistema
4. **Provar navegació**: Assegura't que la navegació funciona dins del rang

### Pas 5: Comunicació
1. **Notificar usuaris**: Informa sobre les noves dates del semestre
2. **Documentació**: Actualitza documentació interna si cal
3. **Suport**: Prepara't per resoldre dubtes dels usuaris

## Consideracions Importants

### Compatibilitat amb calendaris existents
- **Calendaris existents**: NO s'actualitzen automàticament
- **Nous calendaris**: Usen la configuració actualitzada
- **Migració manual**: Els usuaris han de crear nous calendaris per al nou semestre

### Format de dates
- **Format obligatori**: YYYY-MM-DD (ISO 8601)
- **Zona horària**: UTC (sense informació de zona horària)
- **Validació**: L'aplicació valida automàticament els formats

### IDs únics
- **SystemEvents**: Cada esdeveniment necessita un ID únic
- **Categories**: IDs de categories han de ser consistents
- **Nomenclatura**: Usa prefixos per identificar tipus i semestre

### Errors comuns a evitar
```json
// ❌ INCORRECTE
"startDate": "15/09/2025",        // Format incorrecte
"endDate": "2025-13-01",          // Mes inexistent
"code": "2025-S1",                // Format incomplet

// ✅ CORRECTE  
"startDate": "2025-09-15",        // Format ISO
"endDate": "2025-12-20",          // Data vàlida
"code": "2025-26_S1"              // Format complet
```

## Backup i Recuperació

### Còpies de seguretat recomanades
1. **Abans de cada actualització**: Copia els fitxers JSON actuals
2. **Nomenclatura**: `config_backup_YYYY-MM-DD/`
3. **Verificació**: Comprova que les còpies són vàlides

### Recuperació d'errors
Si after l'actualització hi ha problemes:
1. **Restaura** els fitxers de configuració anteriors
2. **Reinicia** l'aplicació al navegador (Ctrl+F5)
3. **Verifica** que els calendaris funcionen correctament
4. **Corregeix** els errors a la nova configuració

## Suport Tècnic

### Contacte per problemes de configuració
- **Desenvolupador**: Ismael Trascastro <itrascastro@ioc.cat>
- **Repositori**: [Issues GitHub](https://github.com/itrascastro/ioc-modul-calendari/issues)

### Informació a proporcionar en cas d'error
1. **Fitxers de configuració** utilitzats
2. **Missatges d'error** exactes de la consola del navegador
3. **Passos per reproduir** el problema
4. **Calendaris afectats** i tipus

### Documentació tècnica
Per canvis més avançats, consulta:
- [Referència de SemesterConfig](config-Referència)  
- [Arquitectura del Sistema](Arquitectura-General)
- [Guia de Desenvolupament](Guia-d-Instal·lació-Dev)

## Autoria

**Ismael Trascastro**  
**Correu**: itrascastro@ioc.cat  
**Web**: itrascastro.github.io

---
[← Categories per defecte](Configuració-de-Categories-per-Defecte) | [Esdeveniments del sistema →](Gestió-d-Esdeveniments-del-Sistema)