'use strict';
// =============================================================================
// HANDOVER MESSAGES — When the Director declines/aborts an operation,
// another agency picks it up. Intel message arrives the next day.
// =============================================================================

// --- US DOMESTIC HANDOVER AGENCIES ---
const HANDOVER_DOM_US = [
  'FBI Field Office', 'FBI Counter-Terrorism Division', 'FBI Joint Terrorism Task Force',
  'U.S. Marshals Service', 'ATF Field Division', 'DEA Regional Office',
  'DHS Homeland Security Investigations', 'NYPD Intelligence Bureau',
  'LAPD Counter-Terrorism Division', 'local police department',
  'state police', 'ICE Enforcement Division', 'U.S. Secret Service',
  'Capitol Police Intelligence Division', 'CBP Office of Intelligence',
];

// --- US FOREIGN HANDOVER AGENCIES ---
const HANDOVER_FOR_US = [
  'CIA local station', 'CIA Special Activities Center', 'DIA regional office',
  'NSA forward element', 'JSOC liaison team', 'U.S. Embassy regional security',
  'Five Eyes partner service', 'allied foreign intelligence service',
  'U.S. AFRICOM intelligence cell', 'U.S. CENTCOM operations center',
  'U.S. EUCOM intelligence directorate', 'U.S. INDOPACOM signals unit',
  'Naval Intelligence regional desk', 'Air Force OSI detachment',
  'U.S. military attaché office',
];

// --- UK DOMESTIC HANDOVER AGENCIES ---
const HANDOVER_DOM_UK = [
  'MI5 domestic operations', 'Metropolitan Police SO15', 'NCA Threat Leadership Command',
  'Counter Terrorism Policing', 'Border Force Intelligence', 'HMRC Intelligence',
  'Police Scotland Counter Terrorism', 'PSNI intelligence branch',
  'Greater Manchester Police CTU', 'West Midlands Police CTU',
  'MoD Police', 'Civil Nuclear Constabulary', 'Royal Military Police',
  'GCHQ domestic signals desk', 'Cabinet Office Briefing Room',
];

// --- UK FOREIGN HANDOVER AGENCIES ---
const HANDOVER_FOR_UK = [
  'MI6 station chief', 'SIS regional controller', 'GCHQ forward intercept team',
  'SAS liaison element', 'SBS maritime intelligence', 'Five Eyes partner service',
  'allied European intelligence service', 'UK Defence Intelligence outpost',
  'British military attaché office', 'RAF Intelligence wing',
  'Royal Navy intelligence cell', 'Foreign Office security team',
  'Joint Forces Intelligence Group', 'UKSF forward element',
  'allied Commonwealth intelligence service',
];

// --- FRANCE DOMESTIC HANDOVER AGENCIES ---
const HANDOVER_DOM_FR = [
  'DGSI section opérationnelle', 'SDAT anti-terrorisme', 'Police Nationale section recherche',
  'Gendarmerie Nationale GIGN', 'RAID intervention unit', 'BRI Paris',
  'préfecture de police renseignement', 'Direction du Renseignement Militaire',
  'douanes judiciaires', 'TRACFIN cellule financière',
  'Parquet National Antiterroriste', 'Direction Centrale du Renseignement Intérieur',
  'Office Central anti-terrorisme', 'Gendarmerie section de recherche',
  'SDLP renseignement territorial',
];

// --- FRANCE FOREIGN HANDOVER AGENCIES ---
const HANDOVER_FOR_FR = [
  'DGSE poste local', 'DGSE Service Action', 'DRM bureau régional',
  'Commandement des Opérations Spéciales', 'Forces spéciales Terre (1er RPIMa)',
  'marine nationale renseignement', 'armée de l\'Air et de l\'Espace SR',
  'ambassade de France bureau de sécurité', 'service allié européen',
  'NATO intelligence cell', 'partenaire Five Eyes',
  'attaché de défense français', 'cellule Barkhane renseignement',
  'bureau interarmées renseignement', 'DGSE réseau africain',
];

// --- 50 US HANDOVER MESSAGE TEMPLATES ---
// Use {op}, {agency}, {city}, {country} as placeholders
const HANDOVER_MSGS_US = [
  // DOMESTIC
  { loc: 'DOM', msg: 'OP {op} has been reassigned to {agency} in {city}. They\'ll run it through official channels — slower, louder, but it\'s off our desk.' },
  { loc: 'DOM', msg: 'The {agency} has assumed operational control of OP {op} in {city}. Their section chief wasn\'t pleased about inheriting our leftovers.' },
  { loc: 'DOM', msg: '{agency} picked up OP {op} in {city} this morning. No operational details were shared. They\'ll work it their own way.' },
  { loc: 'DOM', msg: 'OP {op}: transferred to {agency}, {city} field office. They requested our case files — we sent the sanitized version.' },
  { loc: 'DOM', msg: 'The {agency} has OP {op} now. Their team in {city} started working it within the hour. Aggressive bunch.' },
  { loc: 'DOM', msg: 'OP {op} is no longer our problem. {agency} in {city} took custody of the case. They didn\'t ask questions.' },
  { loc: 'DOM', msg: '{agency} ({city}) confirmed receipt of OP {op} dossier. Their deputy called it "a real mess" but they\'re on it.' },
  { loc: 'DOM', msg: 'OP {op} transferred to {agency}. Their {city} desk flagged it as priority. We\'ll see how they handle it.' },
  { loc: 'DOM', msg: 'The {city} {agency} has taken over OP {op}. They\'re running surveillance through their own networks now.' },
  { loc: 'DOM', msg: 'Per standard protocol, OP {op} has been kicked to {agency} in {city}. Clean handoff. No fingerprints.' },
  { loc: 'DOM', msg: 'OP {op} was absorbed by {agency}. The {city} team confirmed they\'re treating it as a domestic security matter.' },
  { loc: 'DOM', msg: '{agency} is running OP {op} out of {city} now. Their methods are different from ours, but the job gets done.' },
  { loc: 'DOM', msg: 'The handover of OP {op} to {agency} ({city}) is complete. All classified materials were purged from our systems.' },
  { loc: 'DOM', msg: 'OP {op}: {agency} in {city} has taken the wheel. They\'re building their own case from scratch — our involvement is now classified.' },
  { loc: 'DOM', msg: '{agency} is now primary on OP {op}. Their {city} special agent in charge personally reviewed the brief.' },
  { loc: 'DOM', msg: 'OP {op} handed off to {agency}, {city} division. They\'re welcome to it. We have bigger fish.' },
  { loc: 'DOM', msg: 'OP {op} is with {agency} now. The {city} office is already running background checks on the principals.' },
  { loc: 'DOM', msg: 'As of this morning, {agency} in {city} has full operational authority over OP {op}. Our involvement has been scrubbed.' },
  { loc: 'DOM', msg: 'OP {op} has been routed to {agency}. Their {city} team started pulling surveillance tapes within the hour.' },
  { loc: 'DOM', msg: '{agency} ({city}) took OP {op} off our hands. They were surprisingly grateful. Must be a slow week for them.' },
  { loc: 'DOM', msg: 'OP {op}: {agency} assumed control. The {city} chief of station said they\'d been watching the same targets independently.' },
  { loc: 'DOM', msg: 'Per interagency agreement, OP {op} now falls under {agency} jurisdiction in {city}. We\'re out.' },
  { loc: 'DOM', msg: 'OP {op} has been declassified to {agency} level and transferred to their {city} team. They\'re treating it as routine.' },
  { loc: 'DOM', msg: '{agency} in {city} is now running OP {op}. They\'ve already reassigned three agents to the case.' },
  { loc: 'DOM', msg: 'OP {op} transferred. {agency} ({city}) didn\'t want our input. Fair enough — clean break, clean conscience.' },
  // FOREIGN
  { loc: 'FOR', msg: 'OP {op} has been handed to {agency} in {city}, {country}. They\'re running it as a local operation now.' },
  { loc: 'FOR', msg: '{agency} assumed control of OP {op} in {country}. No operational intelligence was shared during the transfer.' },
  { loc: 'FOR', msg: 'OP {op}: {agency} in {country} picked it up. Their station in {city} will handle it from here.' },
  { loc: 'FOR', msg: 'The {agency} has OP {op} in {country}. Their team deployed to {city} yesterday. We\'re monitoring from a distance.' },
  { loc: 'FOR', msg: 'OP {op} transferred to {agency}, {country} theater. {city} station acknowledged receipt. Our exposure is nil.' },
  { loc: 'FOR', msg: '{agency} in {country} took over OP {op}. The station chief in {city} said they\'d been tracking similar activity.' },
  { loc: 'FOR', msg: 'OP {op} is now a {agency} operation in {country}. They\'re running it out of {city} with local assets.' },
  { loc: 'FOR', msg: 'Per theater protocol, OP {op} was reassigned to {agency} in {city}, {country}. All SAA materials redacted.' },
  { loc: 'FOR', msg: 'OP {op}: {agency} has assumed the mission in {country}. Their {city} element was already positioned.' },
  { loc: 'FOR', msg: '{agency} ({country}) confirmed handover of OP {op}. They\'re treating it as a regional priority out of {city}.' },
  { loc: 'FOR', msg: 'OP {op} has been absorbed into {agency}\'s {country} portfolio. The {city} desk took point immediately.' },
  { loc: 'FOR', msg: 'The {agency} element in {city}, {country} has OP {op}. They plan to use their own networks exclusively.' },
  { loc: 'FOR', msg: 'OP {op} transferred to {agency} in {country}. Their people in {city} are experienced — it\'s in capable hands.' },
  { loc: 'FOR', msg: '{agency} took OP {op} without hesitation. Their {country} section already had a file open on related activity near {city}.' },
  { loc: 'FOR', msg: 'OP {op}: clean handoff to {agency} at the {city} station, {country}. No acknowledgment of our prior involvement.' },
  { loc: 'FOR', msg: 'OP {op} now belongs to {agency}. Their forward team in {city}, {country} was briefed this morning.' },
  { loc: 'FOR', msg: '{agency} picked up OP {op} in {city}, {country}. They\'re treating it as a joint operation with local partners.' },
  { loc: 'FOR', msg: 'OP {op} was passed to {agency} in {country}. They\'ve deployed assets to {city}. We\'re out of the loop entirely.' },
  { loc: 'FOR', msg: 'Per standing agreement, OP {op} transferred to {agency} ({country}). The {city} team has operational control.' },
  { loc: 'FOR', msg: 'OP {op} is {agency}\'s problem now. Their {country} station in {city} was already on alert.' },
  { loc: 'FOR', msg: '{agency} in {country} absorbed OP {op}. Station {city} reports they can handle it with existing resources.' },
  { loc: 'FOR', msg: 'OP {op}: transferred to {agency}, {city}. The {country} theater commander approved the takeover within minutes.' },
  { loc: 'FOR', msg: 'OP {op} handed to {agency} at the {city} facility in {country}. All traces of our preliminary work have been destroyed.' },
  { loc: 'FOR', msg: '{agency} ({city}, {country}) now owns OP {op}. Their regional director expressed confidence they can close it out.' },
  { loc: 'FOR', msg: 'OP {op}: {agency} in {country} accepted the transfer. Their {city} unit was already conducting parallel surveillance.' },
];

// --- 50 UK HANDOVER MESSAGE TEMPLATES ---
const HANDOVER_MSGS_UK = [
  // DOMESTIC
  { loc: 'DOM', msg: 'OP {op} has been passed to {agency} in {city}. They accepted without comment — as one does.' },
  { loc: 'DOM', msg: '{agency} in {city} has taken ownership of OP {op}. Their section head described the brief as "bracing reading."' },
  { loc: 'DOM', msg: 'OP {op}: transferred to {agency}. The {city} team acknowledged receipt. Minimal fuss, as expected.' },
  { loc: 'DOM', msg: '{agency} ({city}) now has OP {op}. They\'re approaching it through conventional channels. Steady hands.' },
  { loc: 'DOM', msg: 'OP {op} has been reassigned to {agency} in {city}. They didn\'t request our operational notes — probably for the best.' },
  { loc: 'DOM', msg: 'The {agency} in {city} assumed control of OP {op} without ceremony. Their duty officer simply signed for the file.' },
  { loc: 'DOM', msg: 'OP {op}: {agency} has it. The {city} office started their own enquiries this morning. British efficiency.' },
  { loc: 'DOM', msg: '{agency} took OP {op} off our hands in {city}. Their response was characteristically understated: "We\'ll manage."' },
  { loc: 'DOM', msg: 'OP {op} handed to {agency}, {city} branch. Clean transfer. No further liaison requested.' },
  { loc: 'DOM', msg: '{agency} in {city} confirmed receipt of OP {op}. They\'re running it as a domestic security matter now.' },
  { loc: 'DOM', msg: 'OP {op}: {agency} ({city}) have the file. Their chief superintendent is personally overseeing.' },
  { loc: 'DOM', msg: 'The {city} {agency} picked up OP {op} at close of play yesterday. They\'re already pulling CCTV.' },
  { loc: 'DOM', msg: 'OP {op} was folded into {agency}\'s existing caseload in {city}. They seem to have it well in hand.' },
  { loc: 'DOM', msg: '{agency} in {city} assumed OP {op}. Their section chief described our brief as "thorough but alarming."' },
  { loc: 'DOM', msg: 'OP {op}: clean handoff to {agency}. The {city} team will work it through proper channels.' },
  { loc: 'DOM', msg: '{agency} ({city}) took OP {op} with a polite nod and no questions. The British way.' },
  { loc: 'DOM', msg: 'OP {op} is now with {agency} in {city}. They\'re treating it as priority but keeping it quiet.' },
  { loc: 'DOM', msg: 'Per Home Office protocol, OP {op} transferred to {agency}, {city} office. Our involvement is deniable.' },
  { loc: 'DOM', msg: '{agency} in {city} has OP {op}. Their case officer called the brief "interesting." High praise, coming from them.' },
  { loc: 'DOM', msg: 'OP {op}: {agency} took it. {city} team started within the hour. No drama.' },
  { loc: 'DOM', msg: '{agency} in {city} absorbed OP {op} into their portfolio. Barely raised an eyebrow.' },
  { loc: 'DOM', msg: 'OP {op} now sits with {agency}. The {city} desk officer signed off without a word. Typical.' },
  { loc: 'DOM', msg: 'OP {op}: transferred to {agency} in {city}. They\'ll handle it by the book — which is not always a bad thing.' },
  { loc: 'DOM', msg: '{agency} ({city}) confirmed they have OP {op}. Their response: "Understood. Leave it with us."' },
  { loc: 'DOM', msg: 'The {agency} in {city} now own OP {op}. They requested no further contact. Message received.' },
  // FOREIGN
  { loc: 'FOR', msg: 'OP {op} transferred to {agency} in {city}, {country}. Their station chief accepted without hesitation.' },
  { loc: 'FOR', msg: '{agency} has OP {op} in {country}. The {city} station will run it with local liaison support.' },
  { loc: 'FOR', msg: 'OP {op}: {agency} in {country} took the brief. Their {city} team was already aware of the situation.' },
  { loc: 'FOR', msg: '{agency} ({country}) assumed OP {op}. The {city} element considers it within their normal operational scope.' },
  { loc: 'FOR', msg: 'OP {op} has been handed to {agency} at the {city} station in {country}. Clean break. No loose ends.' },
  { loc: 'FOR', msg: '{agency} in {city}, {country} now owns OP {op}. They plan to approach it with regional assets exclusively.' },
  { loc: 'FOR', msg: 'OP {op}: {agency} in {country} confirmed handover. Their {city} controller described it as "manageable."' },
  { loc: 'FOR', msg: '{agency} picked up OP {op} in {city}, {country}. They were already running parallel enquiries in the area.' },
  { loc: 'FOR', msg: 'OP {op} transferred to {agency}, {country} theatre. The {city} station has operational lead.' },
  { loc: 'FOR', msg: 'Per Five Eyes protocol, OP {op} reassigned to {agency} in {country}. {city} station acknowledged.' },
  { loc: 'FOR', msg: '{agency} in {country} has OP {op}. Their {city} liaison said they\'d handle it "with appropriate discretion."' },
  { loc: 'FOR', msg: 'OP {op}: handed to {agency} at the {city} facility, {country}. All JCOB materials have been withdrawn.' },
  { loc: 'FOR', msg: '{agency} ({city}, {country}) took OP {op}. Their regional controller was already tracking related activity.' },
  { loc: 'FOR', msg: 'OP {op} is now {agency}\'s affair in {country}. The {city} team deployed immediately. Rather keen.' },
  { loc: 'FOR', msg: '{agency} in {country} absorbed OP {op} without fuss. Station {city} reports adequate resources on hand.' },
  { loc: 'FOR', msg: 'OP {op}: {agency} assumed the mission from {city}, {country}. Our prior involvement has been redacted from all records.' },
  { loc: 'FOR', msg: '{agency} ({country}) confirmed receipt of OP {op}. The {city} chief said simply: "Consider it done."' },
  { loc: 'FOR', msg: 'OP {op} transferred to {agency} in {city}, {country}. They\'re running it through their own networks now.' },
  { loc: 'FOR', msg: '{agency} in {country} now has operational control of OP {op}. Their {city} team started surveillance overnight.' },
  { loc: 'FOR', msg: 'OP {op}: clean transfer to {agency}, {city} ({country}). No acknowledgment of JCOB involvement.' },
  { loc: 'FOR', msg: '{agency} took OP {op} in {country}. The station in {city} was briefed and operational within hours.' },
  { loc: 'FOR', msg: 'OP {op} has been assigned to {agency} at {city}, {country}. They\'ll work it as a joint regional operation.' },
  { loc: 'FOR', msg: '{agency} in {city}, {country} absorbed OP {op}. Their head of station was already expecting the call.' },
  { loc: 'FOR', msg: 'OP {op}: passed to {agency} ({country}). The {city} desk assures us it will be handled competently.' },
  { loc: 'FOR', msg: '{agency} ({city}, {country}) now owns OP {op}. Their section lead described the brief as "illuminating."' },
];

// --- 50 FRANCE HANDOVER MESSAGE TEMPLATES ---
const HANDOVER_MSGS_FR = [
  // DOMESTIC
  { loc: 'DOM', msg: 'OP {op} a été transférée à {agency} à {city}. Ils prendront la suite selon leurs propres méthodes.' },
  { loc: 'DOM', msg: '{agency} ({city}) a pris le contrôle de l\'OP {op}. Aucune information opérationnelle n\'a été partagée.' },
  { loc: 'DOM', msg: 'OP {op} : {agency} à {city} a récupéré le dossier. Transfert propre, sans trace.' },
  { loc: 'DOM', msg: '{agency} de {city} dirige désormais l\'OP {op}. Leur chef de section a qualifié le dossier de « préoccupant ».' },
  { loc: 'DOM', msg: 'OP {op} réassignée à {agency} ({city}). Ils traitent l\'affaire comme un dossier de sécurité intérieure.' },
  { loc: 'DOM', msg: 'Le {agency} à {city} a repris l\'OP {op} ce matin. Leur équipe est déjà sur le terrain.' },
  { loc: 'DOM', msg: 'OP {op} : passée sous contrôle de {agency}. Le bureau de {city} a accusé réception sans commentaire.' },
  { loc: 'DOM', msg: '{agency} ({city}) a absorbé l\'OP {op} dans son portefeuille courant. Aucune question posée.' },
  { loc: 'DOM', msg: 'OP {op} transférée à {agency} à {city}. Ils mèneront l\'enquête par les voies conventionnelles.' },
  { loc: 'DOM', msg: '{agency} de {city} a pris la main sur l\'OP {op}. Leur commissaire divisionnaire supervise personnellement.' },
  { loc: 'DOM', msg: 'OP {op} : {agency} a le dossier. L\'antenne de {city} a déployé trois enquêteurs dans l\'heure.' },
  { loc: 'DOM', msg: 'Le {agency} à {city} traite désormais l\'OP {op} comme prioritaire. Notre implication est niée.' },
  { loc: 'DOM', msg: 'OP {op} confiée à {agency} ({city}). Leur directeur régional a confirmé réception par voie sécurisée.' },
  { loc: 'DOM', msg: '{agency} de {city} a récupéré l\'OP {op}. Ils ont commencé les écoutes dès réception du dossier.' },
  { loc: 'DOM', msg: 'OP {op} : transfert effectué vers {agency}. Le bureau de {city} était déjà en alerte sur un dossier connexe.' },
  { loc: 'DOM', msg: 'Le {agency} ({city}) s\'est saisi de l\'OP {op} sans délai. Efficacité républicaine.' },
  { loc: 'DOM', msg: 'OP {op} réattribuée à {agency} à {city}. Toutes les pièces classifiées DSO ont été purgées.' },
  { loc: 'DOM', msg: '{agency} ({city}) mène l\'OP {op}. Leur chef d\'unité a qualifié la situation de « maîtrisable ».' },
  { loc: 'DOM', msg: 'OP {op} : {agency} de {city} a confirmé la prise en charge. Pas de demande de liaison complémentaire.' },
  { loc: 'DOM', msg: 'Le {agency} à {city} a repris l\'OP {op}. Ils ont leurs propres sources — ils s\'en sortiront.' },
  { loc: 'DOM', msg: '{agency} ({city}) travaille désormais sur l\'OP {op}. Notre rôle est officiellement terminé.' },
  { loc: 'DOM', msg: 'OP {op} : dossier remis à {agency}. L\'antenne de {city} traite l\'affaire en interne.' },
  { loc: 'DOM', msg: 'Le {agency} de {city} a hérité de l\'OP {op}. Ils ne semblaient pas surpris par le contenu du dossier.' },
  { loc: 'DOM', msg: 'OP {op} passée sous autorité de {agency} ({city}). Transfert validé par le cabinet du directeur.' },
  { loc: 'DOM', msg: '{agency} à {city} a l\'OP {op}. Réponse laconique du chef de section : « Compris. On gère. »' },
  // FOREIGN
  { loc: 'FOR', msg: 'OP {op} transférée à {agency} à {city}, {country}. Leur poste local gère désormais l\'opération.' },
  { loc: 'FOR', msg: '{agency} a repris l\'OP {op} en {country}. Le poste de {city} a confirmé la prise en charge.' },
  { loc: 'FOR', msg: 'OP {op} : {agency} au {country} a le dossier. Leur élément à {city} était déjà positionné.' },
  { loc: 'FOR', msg: '{agency} ({country}) a absorbé l\'OP {op}. Le chef de poste à {city} a décrit la situation comme « gérable ».' },
  { loc: 'FOR', msg: 'OP {op} remise à {agency} à {city}, {country}. Rupture nette. Aucune trace DSO.' },
  { loc: 'FOR', msg: '{agency} à {city} ({country}) dirige l\'OP {op}. Ils travaillent avec des moyens locaux exclusivement.' },
  { loc: 'FOR', msg: 'OP {op} : {agency} en {country} a confirmé le transfert. Leur équipe à {city} est opérationnelle.' },
  { loc: 'FOR', msg: '{agency} a pris l\'OP {op} à {city}, {country}. Ils menaient déjà des investigations parallèles dans la zone.' },
  { loc: 'FOR', msg: 'OP {op} transférée au {agency}, théâtre {country}. Le poste de {city} a la direction opérationnelle.' },
  { loc: 'FOR', msg: 'Selon protocole interallié, OP {op} réassignée à {agency} en {country}. Poste {city} notifié.' },
  { loc: 'FOR', msg: '{agency} en {country} a l\'OP {op}. Leur liaison à {city} promet de traiter l\'affaire « avec la discrétion requise ».' },
  { loc: 'FOR', msg: 'OP {op} : remise à {agency} au poste de {city}, {country}. Tous documents DSO détruits.' },
  { loc: 'FOR', msg: '{agency} ({city}, {country}) a repris l\'OP {op}. Leur contrôleur régional suivait déjà des activités liées.' },
  { loc: 'FOR', msg: 'OP {op} est désormais l\'affaire de {agency} en {country}. L\'équipe de {city} s\'est déployée immédiatement.' },
  { loc: 'FOR', msg: '{agency} en {country} a intégré l\'OP {op} sans difficulté. Poste {city} confirme des moyens suffisants.' },
  { loc: 'FOR', msg: 'OP {op} : {agency} a pris le relais depuis {city}, {country}. Notre implication antérieure est effacée.' },
  { loc: 'FOR', msg: '{agency} ({country}) a confirmé réception de l\'OP {op}. Le chef de poste à {city} : « Considérez que c\'est fait. »' },
  { loc: 'FOR', msg: 'OP {op} transférée à {agency} à {city}, {country}. Ils opèrent via leurs propres réseaux.' },
  { loc: 'FOR', msg: '{agency} en {country} a le contrôle opérationnel de l\'OP {op}. Leur équipe à {city} a lancé la surveillance.' },
  { loc: 'FOR', msg: 'OP {op} : transfert propre vers {agency}, {city} ({country}). Aucune reconnaissance de l\'implication DSO.' },
  { loc: 'FOR', msg: '{agency} a repris l\'OP {op} au {country}. Le poste de {city} a été briefé et est opérationnel.' },
  { loc: 'FOR', msg: 'OP {op} attribuée à {agency} à {city}, {country}. Ils la traitent comme opération régionale conjointe.' },
  { loc: 'FOR', msg: '{agency} à {city}, {country} a absorbé l\'OP {op}. Leur chef de poste attendait l\'appel.' },
  { loc: 'FOR', msg: 'OP {op} : passée à {agency} ({country}). L\'antenne de {city} assure un traitement compétent.' },
  { loc: 'FOR', msg: '{agency} ({city}, {country}) gère désormais l\'OP {op}. Leur chef de section a qualifié le dossier de « révélateur ».' },
];

// =============================================================================
// HANDOVER SYSTEM — queue message on dismiss, deliver next day
// =============================================================================

(function() {
  // When a mission is dismissed, store handover info for next-day delivery
  const _origDismiss = window.dismissMission || dismissMission;

  // We need to intercept dismissMission — but it's not on window yet.
  // Instead, hook into day:post to check for pending handovers.

  // Store pending handovers on G
  hook('day:post', function() {
    if (!G._pendingHandovers || G._pendingHandovers.length === 0) return;

    const handovers = G._pendingHandovers.splice(0);
    for (const h of handovers) {
      deliverHandoverMessage(h);
    }
  });

  function deliverHandoverMessage(info) {
    const country = G.country || 'USA';
    const isDomestic = info.location === 'DOMESTIC';

    // Pick agency list
    let agencies, msgs;
    if (country === 'USA') {
      agencies = isDomestic ? HANDOVER_DOM_US : HANDOVER_FOR_US;
      msgs = HANDOVER_MSGS_US;
    } else if (country === 'UK') {
      agencies = isDomestic ? HANDOVER_DOM_UK : HANDOVER_FOR_UK;
      msgs = HANDOVER_MSGS_UK;
    } else {
      agencies = isDomestic ? HANDOVER_DOM_FR : HANDOVER_FOR_FR;
      msgs = HANDOVER_MSGS_FR;
    }

    const locType = isDomestic ? 'DOM' : 'FOR';
    const eligible = msgs.filter(m => m.loc === locType);
    if (eligible.length === 0) return;

    const template = eligible[Math.floor(Math.random() * eligible.length)];
    const agency = agencies[Math.floor(Math.random() * agencies.length)];

    const text = template.msg
      .replace(/\{op\}/g, info.codename)
      .replace(/\{agency\}/g, agency)
      .replace(/\{city\}/g, info.city || 'the capital')
      .replace(/\{country\}/g, info.opCountry || 'the region');

    queueBriefingPopup({
      title: 'OPERATIONAL HANDOVER',
      subtitle: `OP ${info.codename}`,
      category: 'INTERNAL',
      body: `<div class="dc-report" style="margin-bottom:12px">${text}</div>
        <div style="font-size:10px;color:var(--text-dim);font-family:var(--font-mono)">
          OPERATION: ${info.codename}<br>
          CATEGORY: ${info.category || 'GENERAL'}<br>
          LOCATION: ${info.city || '—'}, ${info.opCountry || '—'}<br>
          STATUS: TRANSFERRED — NO FURTHER ACTION REQUIRED
        </div>`,
      buttonLabel: 'ACKNOWLEDGED',
    });
  }

  // Expose a function to queue a handover (called from dismissMission)
  window._queueHandover = function(m) {
    if (!G._pendingHandovers) G._pendingHandovers = [];
    G._pendingHandovers.push({
      codename: m.codename,
      location: m.location,
      city: m.city,
      opCountry: m.country,
      category: m.category,
    });
  };
})();
