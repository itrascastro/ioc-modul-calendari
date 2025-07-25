# Replicació entre Calendaris

La replicació és una funcionalitat avançada del Calendari IOC que permet copiar esdeveniments d'un calendari a un altre de manera intel·ligent, adaptant-se automàticament a les diferents dates i característiques dels calendaris de destí.

## Visió General

### Què és la replicació?

La replicació és el procés de **copiar esdeveniments d'un calendari origen a un calendari destí**, adaptant-se automàticament a:
- **Dates diferents**: Els calendaris poden tenir períodes lectius diferents
- **Durades diferents**: Un semestre pot ser més llarg o curt que l'altre
- **Obstacles**: Festius i esdeveniments del sistema en el calendari de destí

### Per què replicar?

**Casos d'ús habituals:**
- **Professors**: Copiar la planificació d'un mòdul d'un semestre a l'altre
- **Coordinadors**: Adaptar calendaris entre diferents cicles formatius
- **Reutilització**: Aprofitar planificacions d'anys anteriors
- **Consistència**: Mantenir la mateixa estructura temporal entre calendaris similars

## Com Funciona l'Algoritme de Replicació

### Algoritme Proporcional Intel·ligent

L'aplicació utilitza un **algoritme proporcional** que:

1. **Analitza l'espai útil** de cada calendari (dies lectius sense festius ni esdeveniments del sistema)
2. **Calcula la proporció** entre els dos espais útils
3. **Mapa els esdeveniments** del calendari origen al destí mantenint la proporció temporal
4. **Evita col·lisions** amb esdeveniments existents en el destí
5. **Gestiona conflictes** creant una llista d'esdeveniments no ubicats

### Exemple Pràctic

**Calendari Origen (Primer Semestre):**
- Durada: 100 dies lectius
- Esdeveniment a la posició 25 (25% del període)

**Calendari Destí (Segon Semestre):**
- Durada: 90 dies lectius
- L'esdeveniment es col·locarà a la posició 22-23 (25% de 90 dies)

## Procediment de Replicació

### Pas 1: Preparar els Calendaris

**Requisits:**
- **Calendari origen**: Ha de tenir esdeveniments creats pel professor (no del sistema)
- **Calendari destí**: Ha de tenir dates d'inici i fi definides
- **Mínim 2 calendaris**: Necessites almenys dos calendaris per poder replicar

### Pas 2: Iniciar la Replicació

1. **Seleccionar calendari origen**: Assegura't que el calendari amb els esdeveniments que vols copiar està actiu
2. **Obrir replicació**: Fes clic al botó "Replicar Calendari" al panell lateral
3. **Seleccionar destí**: Al modal que s'obre, selecciona el calendari de destí de la llista desplegable
4. **Confirmar replicació**: Fes clic a "Executar Replicació"

### Pas 3: Revisar els Resultats

Després de la replicació, l'aplicació et mostrarà:
- **Esdeveniments col·locats**: Nombre d'esdeveniments copiats correctament
- **Esdeveniments no ubicats**: Esdeveniments que no s'han pogut col·locar automàticament
- **Resum detallat**: Informació sobre el procés de replicació

## Gestió d'Esdeveniments No Ubicats

### Què són els esdeveniments no ubicats?

Els **esdeveniments no ubicats** són aquells que l'algoritme no ha pogut col·locar automàticament al calendari de destí per:
- **Conflicte de dates**: La data calculada ja té un esdeveniment
- **Fora de rang**: La data calculada està fora del període del calendari destí
- **Espai insuficient**: El calendari destí no té prou dies lectius

### Com Gestionar-los

**Visualització:**
- Els esdeveniments no ubicats es mostren en una secció especial del panell lateral
- Cada esdeveniment mostra la data original i el motiu per no poder ubicar-lo

**Opcions de resolució:**
1. **Col·locació manual**: Fes clic sobre un esdeveniment no ubicat per obrir el modal d'edició i assignar-li una nova data
2. **Modificació automàtica**: L'aplicació pot proposar dates alternatives si detecta espais lliures
3. **Eliminació**: Si l'esdeveniment ja no és rellevant, el pots eliminar de la llista

### Procediment per Col·locar Esdeveniments No Ubicats

1. **Identificar l'esdeveniment**: Revisa la llista d'esdeveniments no ubicats
2. **Clic per editar**: Fes clic sobre l'esdeveniment que vols col·locar
3. **Modificar data**: Al modal que s'obre, selecciona una nova data dins del rang del calendari
4. **Confirmar col·locació**: L'esdeveniment es mourà a la nova data i s'eliminarà de la llista de no ubicats

## Configuració de Categories en la Replicació

### Gestió Automàtica de Categories

Quan repliques esdeveniments, l'aplicació gestiona automàticament les categories:

**Si la categoria existeix al destí:**
- L'esdeveniment manté la seva categoria original
- Els colors i noms es conserven

**Si la categoria no existeix al destí:**
- L'aplicació crea automàticament la categoria al calendari de destí
- La categoria s'afegeix també al catàleg global per futures reutilitzacions
- Es manté el color i nom originals

### Categories del Sistema

**Exclusió automàtica:**
- Els esdeveniments del sistema (PAF, FESTIU, IOC) **no es repliquen**
- Només es copien els esdeveniments creats pel professor
- Això evita duplicar esdeveniments institucionals que ja existeixen

## Casos d'Ús Avançats

### Cas 1: Replicació entre Semestres del Mateix Curs

**Escenari**: Professor que vol utilitzar la mateixa planificació del primer semestre en el segon

**Procediment:**
1. Crea el calendari del segon semestre
2. Replica des del primer semestre al segon
3. Revisa els esdeveniments no ubicats (normalment pocs)
4. Ajusta dates específiques si cal

**Resultat**: Planificació coherent adaptada automàticament al nou calendari

### Cas 2: Adaptació entre Cursos Acadèmics

**Escenari**: Reutilitzar la planificació del curs 2023-24 per al 2024-25

**Procediment:**
1. Crea el calendari del nou curs acadèmic
2. Replica des del calendari anterior
3. Revisa i actualitza continguts específics
4. Ajusta dates que no s'hagin adaptat correctament

**Consideracions**: Pot haver-hi més esdeveniments no ubicats per diferències en festius o estructura del curs

### Cas 3: Adaptació entre Tipus de Calendaris

**Escenari**: Adaptar planificació d'un mòdul FP a un calendari BTX

**Procediment:**
1. Crea un calendari "Altre" amb les dates del BTX
2. Replica des del calendari FP
3. Revisa intensament els esdeveniments no ubicats
4. Adapta continguts a la metodologia BTX

**Nota**: Aquesta adaptació requereix més supervisió manual per les diferències estructurals

## Optimització de la Replicació

### Millors Pràctiques

**Abans de replicar:**
- **Neteja el calendari origen**: Elimina esdeveniments que no vols replicar
- **Verifica dates del destí**: Assegura't que el calendari destí té dates correctes
- **Planifica categories**: Revisa que les categories siguin adequades per al destí

**Durant la replicació:**
- **Revisa la previsualització**: Si l'aplicació ofereix vista prèvia, utilitza-la
- **Confirma amb cura**: Una vegada executada, la replicació pot ser difícil de desfer

**Després de replicar:**
- **Revisa esdeveniments col·locats**: Verifica que les dates siguin apropiades
- **Gestiona no ubicats immediatament**: No deixis esdeveniments sense ubicar
- **Ajusta continguts**: Adapta descripcions i títols al nou context si cal

### Consells per Minimitzar Esdeveniments No Ubicats

**Estratègies:**
- **Calendaris similars**: Replica entre calendaris amb durades similars
- **Espai suficient**: Assegura't que el destí tingui prou dies lectius
- **Evita sobrecàrrega**: No repliquis a calendaris ja molt carregats d'esdeveniments

## Limitacions i Consideracions

### Limitacions Tècniques

- **Només esdeveniments del professor**: Els esdeveniments del sistema no es repliquen
- **Sense recursivitat**: Els esdeveniments no mantenen relacions temporals complexes
- **Màxim un nivell**: No es poden fer replicacions en cadena automàtiques

### Consideracions de Disseny

- **Algoritme proporcionat**: Mantindre la proporció temporal, no les dates exactes
- **Preservació de categories**: Les categories es mantenen o es creen automàticament
- **Gestió d'errors robust**: El sistema gestiona conflictes de manera intel·ligent

### Reversibilitat

**Important**: La replicació **no és fàcilment reversible**. 

**Recomanació**: Fes una còpia de seguretat (exportació JSON) del calendari de destí abans de replicar, per si vols desfer els canvis.

## Solució de Problemes

### "No hi ha esdeveniments per replicar"

**Causa**: El calendari origen només té esdeveniments del sistema
**Solució**: Afegeix esdeveniments creats pel professor al calendari origen

### "Calendari destí sense espai útil"

**Causa**: El calendari destí no té dies lectius disponibles
**Solució**: 
- Verifica les dates d'inici i fi del calendari destí
- Elimina esdeveniments del sistema incorrectes si n'hi ha

### Tots els esdeveniments queden no ubicats

**Causa**: Diferències estructurals grans entre calendaris
**Solució**:
- Utilitza calendaris amb durades més similars
- Col·loca manualment els esdeveniments més importants
- Considera crear un calendari de destí amb dates més adequades

---
[← Importació i Exportació](Importació-i-Exportació) | [Personalització i Temes →](Personalització-i-Temes)