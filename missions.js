'use strict';
// =============================================================================
// SHADOW DIRECTIVE — Mission Templates
// Loaded before game.js. Defines MISSION_TYPES global.
// =============================================================================

// =============================================================================
// SINGLE-PHASE MISSION TYPES
// =============================================================================

const MISSION_TYPES = {

  DOMESTIC_TERROR: {
    label: 'DOMESTIC THREAT',
    category: 'COUNTER-TERRORISM',
    location: 'DOMESTIC',
    urgencyRange: [7, 18],
    threatRange: [3, 5],
    invDaysRange: [2, 4],
    execDaysRange: [2, 3],
    budgetRange: [3, 9],
    invDepts: ['ANALYSIS', 'HUMINT', 'SIGINT', 'FIELD_OPS'],
    execDepts: ['FIELD_OPS', 'SPECIAL_OPS'],
    opNarrative: 'Field teams establish a tactical perimeter and move to neutralize the cell. HUMINT assets provide real-time target guidance while SIGINT intercepts communications. Special Operations holds in reserve for direct-action if the cell is armed. A simultaneous multi-point breach minimizes the risk of suspects fleeing.',
    initialReports: [
      'SIGINT intercepts suggest imminent {attack_type} against {target}. Source reliability: {reliability}. Cell location unknown.',
      'Human asset reports {group} cell active near {city}. Nature unclear. Assess as potentially threat-related.',
      'Anonymous tip forwarded by {city} metro police: suspicious activity consistent with {attack_type} preparation near {target}.',
    ],
    fullReports: [
      'INTELLIGENCE BRIEF — OP {codename}\n\nCell composition: {cell_size} individuals confirmed. Additional members possible. Cell leader operating under alias "{alias}".\n\nObjective: {attack_type} targeting {target} in {city}.\n\nTimeline: window of {urgency_days} days remaining.\n\nAssessment: Threat credible. Immediate action recommended.',
      'INTELLIGENCE BRIEF — OP {codename}\n\nConfirmed: {group} planning {attack_type}. Primary target: {target}.\n\nHUMINT places cell leader ({alias}) in {city}. Cell size: {cell_size}. Weapons acquisition believed complete.\n\nThreat level: CRITICAL. Time-sensitive. Recommend field neutralization.',
    ],
    successMsgs: [
      'Cell neutralized. {cell_size} suspects detained. Materials seized. Planned attack against {target} prevented. No civilian casualties.\n\nPost-operation assessment confirms the cell was days from executing. HUMINT source proved reliable throughout. The {city} bureau performed well under pressure.',
      'Operation successful. "{alias}" and {cell_size} operatives apprehended. {attack_type} threat eliminated.\n\nFull debriefing of the cell leader is underway. Early indications suggest the cell had foreign logistical support — a follow-up investigation has been recommended.',
    ],
    failureMsgs: [
      'Operation blown. Cell received advance warning and dispersed. {attack_type} against {target} proceeded — {casualties} casualties reported.\n\nThe source of the operational leak is under investigation. The cell leader "{alias}" remains at large. Expect further attempts.',
      'Insufficient intelligence led to premature deployment. Field teams arrived post-event. {casualties} casualties. Cell leader "{alias}" remains at large.\n\nPost-incident review indicates the investigation was closed too early.',
    ],
    deepenDays: 1,
    partialReports: [
      'PRELIMINARY ASSESSMENT — OP {codename}\n\n[UNCONFIRMED] Suspected {attack_type} threat in {city}. Source reliability: {reliability}. Cell size: unknown — estimated 2–5 individuals. Cell leader alias not confirmed.\n\nConclusion: credible but unverified. Full investigation recommended before action.',
      'PRELIMINARY ASSESSMENT — OP {codename}\n\nActivity consistent with {attack_type} preparation detected near {target}. Group affiliation unclear. Number of individuals: unknown. Location: approximate only.\n\nPartial confidence. Proceed with partial intel at −15% probability, or deepen investigation.',
    ],
    confSuccess: [10, 18], confFail: [-18, -30],
    vars: {
      group: ['domestic extremists', 'a foreign-linked cell', 'an anarchist collective', 'radicalized nationals', 'a separatist faction'],
      attack_type: ['a mass-casualty bombing', 'a vehicle attack', 'an infrastructure strike', 'a targeted assassination campaign', 'a chemical release'],
      target: ['Parliament', 'a transit hub', 'a financial district', 'a government ministry', 'a national monument', 'a major airport'],
      alias: ['VIPER', 'HAMMER', 'CROW', 'GHOST', 'THORN', 'HYDRA', 'JACKAL', 'WRAITH'],
      cell_size: ['3', '4 to 6', '7 or more', 'an unknown number of'],
      casualties: ['12', '28', '47', '8', '31', '53'],
      reliability: ['HIGH', 'MODERATE', 'UNVERIFIED'],
    }
  },

  FOREIGN_HVT: {
    label: 'FOREIGN HVT',
    category: 'HIGH-VALUE TARGET',
    location: 'FOREIGN',
    urgencyRange: [10, 25],
    threatRange: [3, 5],
    invDaysRange: [3, 5],
    execDaysRange: [3, 5],
    budgetRange: [6, 14],
    invDepts: ['ANALYSIS', 'HUMINT', 'SIGINT', 'FOREIGN_OPS'],
    execDepts: ['FOREIGN_OPS', 'SPECIAL_OPS'],
    opNarrative: 'A covert team inserts into the target country under civilian or diplomatic cover. Foreign Operations conducts final surveillance and confirms the window. The team moves on the target at the optimal moment, with Special Operations providing armed overwatch. Extraction routes are pre-staged — the team must be clear of the country within hours.',
    initialReports: [
      'Intel suggests high-value target — designation {hvt_role} — currently located in {city}, {country}. Identity unconfirmed.',
      'SIGINT intercepts place HVT of interest in {country}. Known alias: "{alias}". Purpose of visit unknown.',
      'Foreign liaison reports individual matching description of {hvt_role} "{alias}" active in {city}, {country}.',
    ],
    fullReports: [
      'INTELLIGENCE BRIEF — OP {codename}\n\nTarget: {hvt_role}, operating as "{alias}". Confirmed present in {city}, {country}.\n\nBackground: {hvt_bg}\n\nLocation: {location_detail}. Personal security detail: {security}.\n\nWindow: {urgency_days} days before target relocates.\n\nRecommendation: Covert elimination or rendition team deployment.',
      'INTELLIGENCE BRIEF — OP {codename}\n\nHVT "{alias}" — {hvt_role} — confirmed in {city}, {country}.\n\n{hvt_bg}\n\nSecurity profile: {security}. Known movements: {movements}.\n\nThis is a time-critical target. Recommend immediate action.',
    ],
    successMsgs: [
      'Target "{alias}" neutralized. Operation conducted with minimal signature. Regional {hvt_consequence} significantly degraded.\n\nThe team extracted cleanly within the planned window. No attribution. Foreign liaison has acknowledged the outcome through back channels.',
      'Mission accomplished. "{alias}" eliminated in {city}. No agency attribution. {hvt_consequence} disrupted.\n\nThe target\'s network will require months to reconstitute. A significant capability degradation has been achieved.',
    ],
    failureMsgs: [
      'Target "{alias}" escaped. Team extracted under fire. {complication}. International exposure risk elevated.\n\nThe target was apparently warned — a security review of the intelligence chain is under way.',
      'Operation compromised. Target alerted and relocated. Two assets burned. {complication}.\n\nThe mission window is now closed. Recovery of this opportunity is assessed as unlikely in the near term.',
    ],
    deepenDays: 2,
    partialReports: [
      'PRELIMINARY ASSESSMENT — OP {codename}\n\n[UNCONFIRMED] HVT sighting reported — {city}, {country}. Possible role: {hvt_role}. Identity unconfirmed. Security detail: unknown — possibly light to moderate.\n\nSingle-source reporting. Full investigation required to confirm identity and window.',
      'PRELIMINARY ASSESSMENT — OP {codename}\n\nIntel suggests individual of interest in {city}, {country}. Role assessed as possibly {hvt_role} — alias unconfirmed. Location details: approximate.\n\nProceed with partial intel at reduced probability, or deepen investigation for full target package.',
    ],
    confSuccess: [12, 20], confFail: [-15, -25],
    vars: {
      alias: ['NIGHTSHADE', 'CHIMERA', 'PHANTOM', 'SPECTER', 'NEMESIS', 'WRAITH', 'ORACLE', 'TALON'],
      hvt_role: ['a weapons broker', 'a terrorist financier', 'a foreign intelligence officer', 'a fugitive arms dealer', 'a rogue scientist', 'a war crimes suspect'],
      hvt_bg: ['Subject responsible for financing multiple attacks against allied interests.', 'Subject linked to proliferation of advanced weaponry to hostile non-state actors.', 'Subject believed to have operational knowledge of planned attacks against the homeland.'],
      security: ['minimal (2 guards)', 'moderate (6-man detail)', 'heavy (12+ armed personnel)', 'unknown'],
      movements: ['predictable daily route', 'erratic, irregular schedule', 'confined to secure compound'],
      location_detail: ['a private residence', 'a hotel', 'a government facility', 'an unofficial safehouse'],
      hvt_consequence: ['terror financing network', 'arms trafficking operation', 'intelligence network'],
      complication: ['Foreign media reporting possible intelligence activity', 'A local national was killed during the exfil', 'Two team members still evading pursuit'],
    }
  },

  ASSET_RESCUE: {
    label: 'ASSET RESCUE',
    category: 'COVERT EXTRACTION',
    location: 'FOREIGN',
    urgencyRange: [4, 10],
    threatRange: [3, 5],
    invDaysRange: [1, 3],
    execDaysRange: [2, 4],
    budgetRange: [5, 12],
    invDepts: ['ANALYSIS', 'HUMINT', 'FOREIGN_OPS'],
    execDepts: ['FOREIGN_OPS', 'SPECIAL_OPS'],
    opNarrative: 'Foreign Operations inserts a small contact team to locate and reach the asset. Once contact is made, the team moves to a pre-planned exfiltration corridor — sea, air, or overland depending on the situation. Special Operations provides armed support if the extraction turns hostile. Speed is critical; the window closes fast.',
    initialReports: [
      'Asset "{alias}" has gone dark in {city}, {country}. Last contact: {days_dark} days ago. Status unknown.',
      'EMERGENCY: {country} security services may have rolled up one of our networks. Asset "{alias}" is unreachable.',
      'Encrypted distress signal received from {city}. Source appears to be asset "{alias}". Message fragmentary.',
    ],
    fullReports: [
      'INTELLIGENCE BRIEF — OP {codename}\n\nAsset "{alias}" confirmed detained by {detaining_authority} in {city}, {country}.\n\nAsset has {asset_knowledge}. Interrogation is likely underway.\n\nExtraction window: {urgency_days} days before transfer to a maximum security facility.',
      'INTELLIGENCE BRIEF — OP {codename}\n\nAsset "{alias}" location confirmed: {location_detail} in {city}.\n\nCondition: {asset_condition}. Has {asset_knowledge}.\n\nExfiltration corridor: {exfil_route}. Window is closing. Recommend immediate extraction.',
    ],
    successMsgs: [
      'Asset "{alias}" successfully extracted from {country}. Debriefing is underway. No casualties on the extraction team.\n\nThe asset remains operational and has provided preliminary intelligence on the circumstances of their detention.',
      'Extraction complete. "{alias}" recovered. {asset_condition_post}. Operational security maintained throughout.\n\nThe in-country network was partially compromised. An assessment of the damage to our {country} operations is being prepared.',
    ],
    failureMsgs: [
      'Extraction failed. Asset "{alias}" transferred to a high-security facility. Recovery is now assessed as unlikely.\n\nThe asset has knowledge of ongoing operations. A review of all related mission files is recommended. Assume potential compromise.',
      'Team compromised. Asset extraction aborted. "{alias}" fate unknown. Two team members still evading pursuit.\n\nForeign Operations has activated emergency exfiltration protocols. Related operations are being suspended pending security review.',
    ],
    deepenDays: 1,
    partialReports: [
      'PRELIMINARY ASSESSMENT — OP {codename}\n\n[UNCONFIRMED] Asset "{alias}" has been out of contact for {days_dark} days in {city}, {country}. Status: unknown — possibly detained, possibly dark by choice.\n\nLocation and condition unconfirmed. Rapid investigation required before the window closes.',
      'PRELIMINARY ASSESSMENT — OP {codename}\n\nDistress signal received from {city} — source appears to be asset "{alias}". Signal fragmentary. Detaining authority: unknown. Condition: unknown.\n\nPartial intel only. Extraction timeline uncertain.',
    ],
    confSuccess: [8, 15], confFail: [-12, -22],
    vars: {
      alias: ['COBALT', 'MERCURY', 'DELPHI', 'SUNDIAL', 'PARROT', 'ATLAS', 'HERMES', 'ORACLE'],
      days_dark: ['3', '5', '7', '48 hours'],
      detaining_authority: ['state security', 'military intelligence', 'the secret police', 'border security'],
      asset_knowledge: ['knowledge of ongoing domestic operations', 'access to classified source networks', 'years of accumulated intelligence value'],
      exfil_route: ['via northern border crossing', 'by sea through a friendly port', 'via commercial aviation with a sterile identity'],
      asset_condition: ['alive, location confirmed', 'injured but responsive', 'status critical'],
      asset_condition_post: ['Minor injuries sustained', 'Asset in good health', 'Requires immediate medical attention'],
      location_detail: ['a detention facility', 'a police holding cell', 'a military installation', 'an unofficial site'],
    }
  },

  COUNTER_INTEL: {
    label: 'COUNTER-INTEL',
    category: 'INTERNAL SECURITY',
    location: 'DOMESTIC',
    urgencyRange: [12, 30],
    threatRange: [2, 4],
    invDaysRange: [4, 6],
    execDaysRange: [1, 2],
    budgetRange: [2, 6],
    invDepts: ['ANALYSIS', 'COUNTER_INTEL', 'SIGINT'],
    execDepts: ['COUNTER_INTEL', 'FIELD_OPS'],
    opNarrative: 'Counter-Intelligence conducts a controlled burn — feeding known-false intelligence into the network to identify the leak point. SIGINT monitors the subject\'s communications for the telltale signal. Once the mole is confirmed, Field Operations executes a quiet arrest before the subject can alert their handler or destroy evidence.',
    initialReports: [
      'Anomalies detected in compartmented data access patterns. Possible insider threat. Details unclear.',
      'A foreign intelligence service appears to have advance knowledge of recent operations. Source of the leak unidentified.',
      'Anonymous internal report: employee in {dept_name} displaying suspicious behavior. No corroborating evidence yet.',
    ],
    fullReports: [
      'INTELLIGENCE BRIEF — OP {codename}\n\nInternal investigation indicates {suspect_count} individuals with access to compromised intelligence streams.\n\nPrimary suspect: {suspect_profile}. Access level: {access_level}.\n\nForeign beneficiary: {foreign_service}.\n\nRecommendation: Controlled surveillance and arrest operation.',
      'INTELLIGENCE BRIEF — OP {codename}\n\nMole identified with high confidence: {suspect_profile}. Has been passing {leaked_material} to {foreign_service} for an estimated {duration}.\n\nProfile: {suspect_profile_detail}.\n\nRecommend immediate apprehension.',
    ],
    successMsgs: [
      '{suspect_profile} arrested. Partial confession obtained. {foreign_service} network partially rolled up. Damage assessment underway.\n\nThe controlled burn worked cleanly. Preliminary interrogation suggests the compromise was limited to one compartment.',
      'Internal threat neutralized. {suspect_profile} in custody. Leaked material accounted for. Network damage: limited.\n\nFull debrief will take weeks. Counter-Intelligence has recommended a security review of all personnel with similar access levels.',
    ],
    failureMsgs: [
      'Surveillance operation blown. Suspect alerted and fled the country. {foreign_service} network intact. Damage unknown.\n\nThe subject had a pre-arranged exfiltration plan. A full damage assessment has been ordered.',
      'Wrong suspect apprehended. Actual mole still active. {foreign_service} has now changed protocols.\n\nCounter-Intelligence is restarting the investigation. The mole knows we are looking.',
    ],
    deepenDays: 2,
    partialReports: [
      'PRELIMINARY ASSESSMENT — OP {codename}\n\n[UNCONFIRMED] Possible insider threat detected. Access anomalies observed — source of compromise unclear. Suspect pool: unknown size. Foreign beneficiary: unconfirmed.\n\nInvestigation is essential before action. Partial intel insufficient for reliable identification.',
      'PRELIMINARY ASSESSMENT — OP {codename}\n\nData access patterns suggest a potential mole. No primary suspect confirmed. Several individuals with relevant access identified — exact number unclear.\n\nAction with partial intel carries significant risk of targeting the wrong individual.',
    ],
    confSuccess: [6, 12], confFail: [-10, -18],
    vars: {
      suspect_count: ['2 to 4', '5 to 8', 'one or two'],
      suspect_profile: ['a senior analyst', 'a mid-level operations officer', 'a technical specialist', 'an administrative officer with broad access'],
      access_level: ['TOP SECRET / SCI', 'SECRET / NOFORN', 'full compartmented access'],
      foreign_service: ['a Russian intelligence service', 'Chinese state intelligence', 'an Iranian proxy', 'an unidentified state actor'],
      leaked_material: ['operational plans', 'agent identities', 'communications intercepts', 'classified assessments'],
      duration: ['6 months', 'over a year', '3 years', 'an unknown period'],
      suspect_profile_detail: ['Recruited via financial pressure', 'Ideologically motivated', 'Honey-trap operation confirmed'],
      dept_name: ['foreign operations', 'analysis', 'signals', 'field operations'],
    }
  },

  RENDITION: {
    label: 'RENDITION',
    category: 'COVERT CAPTURE',
    location: 'FOREIGN',
    urgencyRange: [8, 20],
    threatRange: [3, 5],
    invDaysRange: [3, 5],
    execDaysRange: [3, 5],
    budgetRange: [7, 15],
    invDepts: ['ANALYSIS', 'HUMINT', 'FOREIGN_OPS'],
    execDepts: ['FOREIGN_OPS', 'SPECIAL_OPS', 'FIELD_OPS'],
    opNarrative: 'A snatch team deploys under civilian cover. Foreign Operations identifies the optimal window; Special Operations executes the capture. The target is to be taken alive and moved through a covert exfiltration chain — safe house to safe house — until transported to a secure interrogation facility. Legal cover must be airtight throughout.',
    initialReports: [
      'Target of interest — {rendition_role} — believed to be in {city}, {country}. Confirmation needed.',
      'Tip from allied service: individual connected to {rendition_link} operating in {country}. Capture may be possible.',
      'HUMINT reports target "{alias}" residing in {city}, {country}. Access situation unknown.',
    ],
    fullReports: [
      'INTELLIGENCE BRIEF — OP {codename}\n\nTarget: "{alias}", {rendition_role}.\n\nBackground: {rendition_link_detail}. Assessed as high interrogation value.\n\nLocation confirmed: {city}, {country}. Security: {security}.\n\nExtraction plan: {exfil_plan}. Window: {urgency_days} days.\n\nLegal cover: {legal_cover}. Recommend capture-and-render operation.',
      'INTELLIGENCE BRIEF — OP {codename}\n\nHigh-value rendition target "{alias}" confirmed in {city}.\n\n{rendition_link_detail}\n\nTarget is {security}. Intelligence value: CRITICAL.\n\nRecommend immediate snatch-and-grab operation before target relocates.',
    ],
    successMsgs: [
      'Target "{alias}" successfully rendered. Currently in transit to secure interrogation facility. Legal cover holding.\n\nInitial assessment of interrogation value: SIGNIFICANT. Early cooperation confirmed.',
      'Rendition complete. "{alias}" in custody. {rendition_intel_value}.\n\nOperation was conducted cleanly. No foreign media coverage.',
    ],
    failureMsgs: [
      'Rendition operation failed. Target fled. Team engaged by {security} — extracted with casualties.\n\nTarget was more security-conscious than assessed. Foreign Operations is reviewing the intelligence chain.',
      'Target "{alias}" proved to be a decoy. Real target alerted and went to ground. Allied service relationship strained.\n\nA review of the source chain has been initiated. We were played.',
    ],
    deepenDays: 2,
    partialReports: [
      'PRELIMINARY ASSESSMENT — OP {codename}\n\n[UNCONFIRMED] Target of interest believed to be in {city}, {country}. Role: possibly {rendition_role}. Alias unconfirmed. Security posture: unknown.\n\nSingle-source tip. Full investigation needed to confirm location and assess capture viability.',
      'PRELIMINARY ASSESSMENT — OP {codename}\n\nHUMINT report: individual connected to {rendition_link} may be accessible in {country}. Identity unconfirmed. Location: approximate. Legal cover status: unassessed.\n\nExecute with partial intel at reduced probability, or deepen investigation.',
    ],
    confSuccess: [10, 18], confFail: [-12, -22],
    vars: {
      alias: ['SCORPION', 'TALON', 'BASILISK', 'COBRA', 'MANTIS', 'HORNET'],
      rendition_role: ['a bomb-maker', 'a terror cell commander', 'a weapons smuggler', 'a financier of hostile operations', 'a former intelligence officer gone rogue'],
      rendition_link: ['multiple domestic attacks', 'a regional terror network', 'weapons proliferation to non-state actors'],
      rendition_link_detail: ['Subject believed to have operational knowledge of planned attacks against allied targets.', 'Subject has led multiple operations resulting in allied casualties.', 'Subject has access to chemical precursor supply chains used in recent attacks.'],
      security: ['lightly guarded', 'moderately protected (4 guards)', 'well-protected, inside a compound'],
      exfil_plan: ['commercial flight under a sterile identity', 'by sea through neutral waters', 'overland via allied territory'],
      legal_cover: ['fully prepared', 'thin but viable', 'questionable — proceed with maximum discretion'],
      rendition_intel_value: ['Confirmed upcoming operation details extracted', 'Network map partially recovered', 'Multiple associate identities obtained'],
    }
  },

  HOSTILE_RESCUE: {
    label: 'HOSTAGE RESCUE',
    category: 'RESCUE OPERATION',
    location: 'FOREIGN',
    urgencyRange: [3, 8],
    threatRange: [4, 5],
    invDaysRange: [1, 2],
    execDaysRange: [1, 2],
    budgetRange: [4, 10],
    invDepts: ['ANALYSIS', 'SIGINT', 'FOREIGN_OPS'],
    execDepts: ['SPECIAL_OPS', 'FOREIGN_OPS'],
    opNarrative: 'Special Operations leads a direct-action assault on the confirmed hold site. Multiple breach points are hit simultaneously to prevent executions. Foreign Operations secures the exfiltration corridor. The team has one window — if timing slips, the hostages are at risk.',
    initialReports: [
      '{hostages} taken hostage by {group} in {city}, {country}. Official channels are unresponsive.',
      'FLASH: {group} has seized {hostages} at a location in {country}. Military requesting covert options.',
      'Embassy in {country} reports {hostages} missing — believed held by armed {group} in the {city} region.',
    ],
    fullReports: [
      'INTELLIGENCE BRIEF — OP {codename}\n\nHostages: {hostages}. Held by {group} at confirmed location: {hold_site} outside {city}.\n\nGuard estimate: {guard_count}. Hostage condition: {condition}.\n\nDeadline: {urgency_days} days before {deadline_consequence}.\n\nRecommendation: Rapid assault team deployment. Speed is critical.',
      'INTELLIGENCE BRIEF — OP {codename}\n\nLocation of {hostages} confirmed via SIGINT. Hold site: {hold_site}, {country}.\n\n{group} demands: {demands}. Deadline is firm.\n\nGuard count: {guard_count}. Recommend CQB team.',
    ],
    successMsgs: [
      'All {hostages} recovered alive. {group} holding force neutralized. Exfiltration successful.\n\nInitial medical assessments indicate hostages are in stable condition.',
      'Rescue operation complete. {hostages} secured. Minimal casualties. Team extracted safely.\n\nPost-operation debrief scheduled. Their account will provide significant intelligence on {group}.',
    ],
    failureMsgs: [
      'Assault location incorrect. Hostages had been moved before the raid. {group} has begun executing threats — {casualty_note}.\n\nIntelligence failure. The SIGINT fix was outdated. A full timeline review has been ordered.',
      'Rescue attempt failed. Alarm raised early. {hostages} status unknown. Team taking fire — exfiltration in progress.\n\n{casualty_note}.',
    ],
    deepenDays: 1,
    partialReports: [
      'PRELIMINARY ASSESSMENT — OP {codename}\n\n[UNCONFIRMED] {hostages} believed taken by {group} in {country}. Hold site: unconfirmed — general area known only. Guard count: unknown.\n\nRapid investigation needed. Clock is running.',
      'PRELIMINARY ASSESSMENT — OP {codename}\n\nFLASH REPORT — {group} may be holding {hostages} in the {city} region. Details sparse. Exact location and hostage condition unknown.\n\nUrgent. Proceed with partial intel at reduced probability or deepen immediately.',
    ],
    confSuccess: [14, 22], confFail: [-20, -35],
    vars: {
      hostages: ['3 diplomatic staff', 'a senior official', 'a journalist and 2 aid workers', '5 military advisors', '2 intelligence officers'],
      group: ['an armed militia', 'a terror cell', 'a criminal cartel', 'a separatist group', 'a political faction'],
      hold_site: ['an abandoned factory', 'a fortified farmhouse', 'an urban apartment complex', 'a remote compound'],
      guard_count: ['6 to 8 armed guards', '12 or more militants', '4 to 6 personnel'],
      condition: ['alive, unharmed', 'alive, one injured', 'status unknown — likely alive'],
      deadline_consequence: ['executions begin', 'hostages are transferred deeper into hostile territory', 'media exposure threatened'],
      demands: ['prisoner release', 'ransom payment', 'withdrawal of forces from the region'],
      casualty_note: ['one confirmed casualty', 'multiple casualties — situation ongoing', 'casualty count not yet confirmed'],
    }
  },

  REGIME_OP: {
    label: 'REGIME OPERATION',
    category: 'COVERT INFLUENCE',
    location: 'FOREIGN',
    urgencyRange: [15, 35],
    threatRange: [2, 4],
    invDaysRange: [4, 7],
    execDaysRange: [4, 7],
    budgetRange: [8, 18],
    invDepts: ['ANALYSIS', 'HUMINT', 'FOREIGN_OPS'],
    execDepts: ['FOREIGN_OPS', 'HUMINT'],
    opNarrative: 'Foreign Operations activates in-country assets to implement the influence campaign. HUMINT manages the network and ensures operational security. No direct-action component. Plausible deniability is the operational imperative — if the operation is traced, diplomatic consequences will be severe.',
    initialReports: [
      'Political situation in {country} presents an opportunity. A preliminary assessment has been requested.',
      'Opposition elements in {country} have made contact. They are requesting support — nature unclear.',
      'Instability in {country} is growing. A window to influence the political outcome may be opening.',
    ],
    fullReports: [
      'INTELLIGENCE BRIEF — OP {codename}\n\nTarget nation: {country}. Objective: {regime_objective}.\n\nOpportunity: {opportunity_detail}\n\nKey assets: {key_assets}.\n\nRisk of attribution: {attribution_risk}.\n\nTimeline for influence window: {urgency_days} days.',
      'INTELLIGENCE BRIEF — OP {codename}\n\nOperation objective: {regime_objective} in {country}.\n\n{opportunity_detail}\n\nAssets in-country: {key_assets}. Attribution risk: {attribution_risk}.\n\nRecommended approach: {method}.',
    ],
    successMsgs: [
      'Operation achieved objectives in {country}. {regime_outcome}. Attribution: none confirmed.\n\nThe in-country network performed well. Our hand is not visible in the outcome.',
      'Covert influence operation successful. {regime_outcome}. Regional stability improved.\n\nThis operation has strengthened relationships with key regional contacts.',
    ],
    failureMsgs: [
      'Operation compromised. {country} government publicly blaming foreign interference. Diplomatic fallout imminent.\n\nExpect a difficult period with {country} for the foreseeable future.',
      'Assets burned. {country} security services rolled up our in-country network. Objectives not achieved.\n\nYears of patient asset development lost. The setback to our {country} program is severe.',
    ],
    deepenDays: 2,
    partialReports: [
      'PRELIMINARY ASSESSMENT — OP {codename}\n\n[UNCONFIRMED] Political opportunity assessed in {country}. Nature of opportunity: unclear. In-country assets: unverified availability. Attribution risk: unassessed.\n\nFull investigation required to determine viability and appropriate approach.',
      'PRELIMINARY ASSESSMENT — OP {codename}\n\nOpposition elements in {country} have signaled interest in contact. Legitimacy unverified. Asset network in-country: status unclear.\n\nProceed with partial intel at reduced probability, or deepen investigation for full assessment.',
    ],
    confSuccess: [8, 16], confFail: [-12, -22],
    vars: {
      regime_objective: ['support a pro-Western political transition', 'destabilize a hostile government\'s economic programs', 'influence upcoming elections toward a friendly candidate', 'support a dissident movement'],
      opportunity_detail: ['A pivotal election is approaching and key officials are approachable.', 'An economic crisis has weakened the government\'s grip on power.', 'Military leadership is fractured — a faction has signaled willingness to cooperate.'],
      key_assets: ['two mid-level officials', 'a media figure with national reach', 'a military contact in the inner circle'],
      attribution_risk: ['LOW — operation is well-covered', 'MODERATE — some exposure possible', 'HIGH — proceed with extreme caution'],
      method: ['financial support to opposition media', 'coordination with a friendly military faction', 'disinformation seeding through proxies'],
      regime_outcome: ['A favorable political shift has occurred', 'Opposition now controls key ministries', 'Government economic programs disrupted'],
    }
  },

  DOMESTIC_HVT: {
    label: 'DOMESTIC HVT',
    category: 'HIGH-VALUE TARGET',
    location: 'DOMESTIC',
    urgencyRange: [8, 20],
    threatRange: [3, 5],
    invDaysRange: [2, 4],
    execDaysRange: [2, 3],
    budgetRange: [3, 8],
    invDepts: ['ANALYSIS', 'HUMINT', 'SIGINT', 'COUNTER_INTEL'],
    execDepts: ['FIELD_OPS', 'SPECIAL_OPS', 'COUNTER_INTEL'],
    opNarrative: 'Field Operations establishes rolling surveillance on the target. Counter-Intelligence runs interference against any security detail. When the optimal window opens, the team moves — either a quiet arrest in a controlled environment or a clean neutralization. The goal is zero public exposure.',
    initialReports: [
      'Tip indicates a foreign intelligence officer operating on domestic soil under diplomatic cover. Unverified.',
      'HUMINT suggests {hvt_role} has slipped into the country. Location: possibly {city}. Details unknown.',
      'Border surveillance flagged individual matching profile of {hvt_role} "{alias}". Currently at large.',
    ],
    fullReports: [
      'INTELLIGENCE BRIEF — OP {codename}\n\nTarget "{alias}" — {hvt_role} — confirmed active in {city}.\n\nBackground: {hvt_bg}\n\nCurrent activity: {current_activity}.\n\nSecurity profile: {security}.\n\nRecommendation: Apprehend or neutralize before target completes objective and exits the country.',
      'INTELLIGENCE BRIEF — OP {codename}\n\n{hvt_role} "{alias}" identified in {city}. {hvt_bg}\n\nConfirmed conducting: {current_activity}.\n\nSecurity: {security}. Window: {urgency_days} days.',
    ],
    successMsgs: [
      'Target "{alias}" apprehended in {city}. Found in possession of {seized_material}. Significant intelligence haul.\n\nSubject is cooperating. Early debrief suggests the operation was part of a larger program.',
      'HVT neutralized. "{alias}" no longer poses a threat. Operation conducted with full deniability.\n\nPost-action sweep recovered {seized_material}. A follow-up surveillance operation has been recommended.',
    ],
    failureMsgs: [
      '"{alias}" evaded capture in {city}. Target believed to have exited the country via {exfil}. Objective not achieved.\n\nA request for allied border monitoring has been submitted.',
      'Operation blown. "{alias}" alerted by unknown leak. Target escaped. Diplomatic immunity invoked by {country}.\n\nDamage assessment is in progress.',
    ],
    deepenDays: 1,
    partialReports: [
      'PRELIMINARY ASSESSMENT — OP {codename}\n\n[UNCONFIRMED] Possible {hvt_role} reported in {city}. Identity unconfirmed. Current activity: unknown. Security posture: unassessed.\n\nSingle tip — not yet verified. Full investigation needed before action.',
      'PRELIMINARY ASSESSMENT — OP {codename}\n\nBorder flag or HUMINT tip suggests {hvt_role} operating in {city}. Alias unconfirmed. Location: approximate. Objective: unclear.\n\nPartial confidence. Deepen investigation for full target dossier.',
    ],
    confSuccess: [10, 16], confFail: [-12, -20],
    vars: {
      alias: ['TARANTULA', 'PRISM', 'LANTERN', 'FOXFIRE', 'SPECTER', 'CHIMERA', 'MIRAGE', 'ANVIL'],
      hvt_role: ['a foreign intelligence officer', 'a known saboteur', 'a fugitive wanted for terrorism', 'a technology thief', 'a hostile state recruiter'],
      hvt_bg: ['Subject responsible for recruiting domestic assets for a hostile foreign service.', 'Subject conducting industrial espionage on critical defense technology.', 'Subject has active ties to domestic extremist networks.'],
      current_activity: ['talent recruitment operations', 'technical collection against defense programs', 'meeting with domestic extremist contacts', 'mapping critical infrastructure'],
      security: ['none — operating alone', 'minimal counter-surveillance measures', 'backed by an embassy security team'],
      seized_material: ['classified documents', 'a list of recruited assets', 'technical schematics', 'encryption devices'],
      exfil: ['commercial flight', 'a diplomatic vehicle', 'the northern border'],
      country: ['Russia', 'China', 'Iran', 'North Korea'],
    }
  },

  // =============================================================================
  // MULTI-PHASE MISSION CHAINS
  // =============================================================================

  SURVEILLANCE_TAKEDOWN: {
    label: 'SURVEILLANCE CHAIN',
    category: 'SURVEILLANCE / TAKEDOWN',
    location: 'DOMESTIC',
    isMultiPhase: true,
    urgencyRange: [28, 45],
    threatRange: [2, 4],
    phases: [
      {
        id: 'INITIAL_SURVEILLANCE',
        name: 'Phase 1: Surveillance',
        shortName: 'SURVEILLANCE',
        deepenDays: 1,
        partialBriefs: [
          'PARTIAL ASSESSMENT — OP {codename} / Phase 1\n\n[UNCONFIRMED] Subject {suspect_name} flagged as {target_type}. Location: {city}. Current movements: unknown. Associates: not identified.\n\nSurveillance not yet established. Deeper investigation needed for reliable pattern-of-life data.',
          'PARTIAL ASSESSMENT — OP {codename} / Phase 1\n\nSubject {suspect_name} identified as possibly {target_type}. Contact individuals: unknown. Digital anomalies: unverified.\n\nProceed with partial intel at reduced probability, or deepen investigation.',
        ],
        invDaysRange: [3, 5],
        invDepts: ['FIELD_OPS', 'SIGINT'],
        execDaysRange: [3, 5],
        execDepts: ['FIELD_OPS'],
        budgetRange: [2, 4],
        confSuccess: [0, 0],
        confFail: [-3, -6],
        falseFlagChance: 0.0,
        opNarrative: 'A discreet surveillance package is established on {suspect_name}. Field teams conduct rolling surveillance on foot and vehicle. SIGINT passively monitors digital footprint. The goal is to map the subject\'s daily routine, identify associates, and locate any operational infrastructure — without alerting the subject.',
        investigateReports: [
          'Subject {suspect_name} has been flagged as {target_type}. Initial surveillance authorization requested. Current location: {city}.',
          'Intelligence flagged {suspect_name} as potentially {target_type}. Profile matches known patterns. Surveillance recommended before action.',
        ],
        fullBriefs: [
          'SURVEILLANCE ASSESSMENT — OP {codename} / Phase 1\n\nSubject {suspect_name}: {suspect_profile}. Surveillance established.\n\nInitial pattern-of-life shows: {pattern_detail}. Contact identified: {contact_role} meeting {contact_frequency}.\n\nRecommendation: Extend surveillance and conduct evidence collection at subject\'s premises.',
          'SURVEILLANCE ASSESSMENT — OP {codename} / Phase 1\n\nSubject {suspect_name} under active surveillance in {city}.\n\n{pattern_detail}. Three unidentified associates have been observed. Digital footprint shows {digital_anomaly}.\n\nRecommend proceeding to Phase 2: Evidence Collection.',
        ],
        successOutcomes: [
          'Surveillance phase complete. {suspect_name}\'s full routine mapped. {contact_role} confirmed as regular contact. Proceeding to evidence collection phase.',
          'Phase 1 complete. Surveillance package maintained without compromise. {digital_anomaly} flagged for analysis. Phase 2 authorized.',
        ],
        failureOutcomes: [
          'Surveillance detected. Subject {suspect_name} has gone to ground. Operation will need to be rebuilt from scratch.',
          'Surveillance package blown — a counter-surveillance team spotted our assets. {suspect_name} has changed behavior. Mission integrity compromised.',
        ],
      },
      {
        id: 'EVIDENCE_SEARCH',
        name: 'Phase 2: Evidence Collection',
        shortName: 'EVIDENCE',
        deepenDays: 1,
        partialBriefs: [
          'PARTIAL ASSESSMENT — OP {codename} / Phase 2\n\n[UNCONFIRMED] Premises of subject {suspect_name} identified. Covert entry plan: preliminary only. Entry risk: unassessed. Search priorities: unclear.\n\nFull investigation needed before committing to a covert entry.',
          'PARTIAL ASSESSMENT — OP {codename} / Phase 2\n\nSearch authorization pending full preparation. Subject {suspect_name}\'s premises cased — entry window estimated but not confirmed. Evidence targets: not finalized.\n\nDeepen investigation for confirmed entry plan, or proceed at reduced probability.',
        ],
        invDaysRange: [2, 4],
        invDepts: ['FIELD_OPS', 'COUNTER_INTEL', 'ANALYSIS'],
        execDaysRange: [1, 2],
        execDepts: ['FIELD_OPS'],
        budgetRange: [2, 4],
        confSuccess: [0, 0],
        confFail: [-5, -10],
        falseFlagChance: 0.30,
        falseFlagTexts: [
          'ANOMALY DETECTED — {suspect_name}\'s premises yielded unexpected findings. The "suspicious" communications are personal in nature. Financial records show legitimate sources. The subject appears to be an unwitting associate of the actual target, not a principal actor. Proceeding on current intelligence risks a wrongful action.',
          'INVESTIGATION UPDATE — Evidence is inconsistent with the threat profile. {suspect_name}\'s contact with {contact_role} appears to be professional, not operational. Subject may have been used as an unwitting cut-out. There is a significant probability we have the wrong person.',
        ],
        opNarrative: 'Field Operations conducts a covert entry of the subject\'s residence and office premises while the subject is away, confirmed by the surveillance team. Counter-Intelligence analysts review collected materials on-site. SIGINT provides overwatch. The team is looking for operational documents, devices, foreign currency, or coded communications — anything to confirm or refute the threat assessment.',
        investigateReports: [
          'Surveillance data supports proceeding to evidence collection. {suspect_name}\'s premises have been identified. Covert entry plan prepared.',
          'Phase 1 findings support search authorization. {suspect_name}\'s residence and office have been cased. Entry window identified.',
        ],
        fullBriefs: [
          'EVIDENCE BRIEF — OP {codename} / Phase 2\n\nCovert entry of {suspect_name}\'s {premises_type} is authorized. Entry window: {entry_window}.\n\nSearch focus: {search_focus}. Surveillance team will confirm subject location throughout.\n\nRisk assessment: {entry_risk}. Team briefed and ready.',
          'EVIDENCE BRIEF — OP {codename} / Phase 2\n\nPremises search of {suspect_name}\'s {premises_type} prepared.\n\nSurveillance has identified {entry_window} as the optimal window. {entry_risk}.\n\nSearch priorities: {search_focus}. Counter-Intelligence analyst on standby for material assessment.',
        ],
        successOutcomes: [
          'Premises search complete. Evidence recovered: {evidence_found}. Subject {suspect_name} unaware. Proceeding to apprehension phase.',
          'Covert entry successful. {evidence_found} recovered from {suspect_name}\'s premises. No sign of compromise. Phase 3 authorized.',
        ],
        failureOutcomes: [
          'Entry compromised. Team extracted without completing search. {suspect_name} was notified by an unknown alert system. Evidence collection failed.',
          'Search incomplete. Team discovered a hidden security measure and had to abort. {suspect_name}\'s premises left without full evidence haul.',
        ],
        vars: {
          premises_type: ['residence', 'office', 'residence and office', 'storage unit'],
          entry_window: ['a 3-hour gap during subject\'s daily commute', 'an overnight window while subject is traveling', 'a 90-minute lunch break window'],
          entry_risk: ['LOW — subject has no known security measures', 'MODERATE — basic alarm system identified', 'ELEVATED — subject has shown awareness of surveillance tradecraft'],
          search_focus: ['encrypted devices and foreign communications', 'financial records and payments', 'operational documents or coded materials', 'contact lists and meeting records'],
          evidence_found: ['encrypted devices with foreign-key signatures', 'coded correspondence', 'unexplained cash and foreign currency', 'operational documents consistent with foreign tasking'],
        },
      },
      {
        id: 'APPREHENSION',
        name: 'Phase 3: Apprehension',
        shortName: 'TAKEDOWN',
        deepenDays: 1,
        partialBriefs: [
          'PARTIAL ASSESSMENT — OP {codename} / Phase 3\n\n[UNCONFIRMED] Arrest package for {suspect_name}: not fully assembled. Legal framework: under review. Optimal apprehension window: unconfirmed.\n\nDeepen investigation to finalize charge package before proceeding.',
          'PARTIAL ASSESSMENT — OP {codename} / Phase 3\n\nApprehension authorization for {suspect_name} pending final review. Charges: preliminary only. Arrest window: estimated, not confirmed.\n\nProceed with partial intel at reduced probability, or deepen investigation.',
        ],
        invDaysRange: [1, 2],
        invDepts: ['COUNTER_INTEL', 'FIELD_OPS', 'ANALYSIS'],
        execDaysRange: [1, 2],
        execDepts: ['FIELD_OPS', 'SPECIAL_OPS', 'COUNTER_INTEL'],
        budgetRange: [2, 5],
        confSuccess: [8, 15],
        confFail: [-12, -20],
        falseFlagChance: 0.0,
        opNarrative: 'Field Operations moves to apprehend {suspect_name} at the pre-selected location. Counter-Intelligence has prepared a full charge package. The arrest must be clean and quiet — no public exposure, no resistance provoked. Special Operations is on standby. The subject will be taken to a secure facility for processing and debrief.',
        investigateReports: [
          'Evidence package assembled. Arrest authorization pending final legal review. {suspect_name}\'s current location: {city}.',
          'Charge package complete. Legal framework confirmed. Apprehension team briefed and ready. Awaiting go authorization.',
        ],
        fullBriefs: [
          'APPREHENSION BRIEF — OP {codename} / Phase 3\n\nSubject {suspect_name}: arrest authorized on charges of {charges}.\n\nOptimal apprehension window: {arrest_window}. Subject will be isolated from handler contact.\n\nPost-arrest: subject to be transferred to {facility} for debrief.',
          'APPREHENSION BRIEF — OP {codename} / Phase 3\n\nAll phases complete. Arrest warrant in place for {charges}.\n\n{suspect_name} will be apprehended at {arrest_window}. Counter-Intelligence will lead the debrief. This represents a significant intelligence gain.',
        ],
        successOutcomes: [
          'Subject {suspect_name} apprehended. {charges} confirmed. Transfer to secure facility underway. Debrief to commence within 24 hours.',
          '{suspect_name} in custody. Clean arrest — no complications, no public exposure. Full debrief and network roll-up initiated.',
        ],
        failureOutcomes: [
          'Apprehension failed. {suspect_name} was tipped off and evaded the arrest team. Subject is now a fugitive. Significant intelligence gain lost.',
          'Arrest attempt compromised. {suspect_name} invoked diplomatic protection. Legal challenge filed. Subject may have to be released.',
        ],
        vars: {
          charges: ['espionage and unauthorized disclosure of classified material', 'foreign intelligence activity on domestic soil', 'conspiracy with a hostile foreign power', 'providing material support to a hostile intelligence service'],
          arrest_window: ['during the subject\'s regular morning commute', 'at the subject\'s residence early morning', 'at a pre-identified regular meeting location'],
          facility: ['a classified holding facility', 'a secure Counter-Intelligence debrief center', 'an undisclosed government facility'],
        },
      },
    ],
    vars: {
      suspect_name: ['WINDMILL', 'DOCKHAND', 'SPARROW', 'CARDINAL', 'INKWELL', 'FOXGLOVE', 'MAPLELEAF', 'KEYSTROKE'],
      target_type: ['a suspected foreign intelligence asset', 'a domestic extremist planning infrastructure attacks', 'a compromised government contractor', 'a hostile-linked recruiter'],
      suspect_profile: ['a mid-level government contractor with broad security clearance', 'a retired law enforcement officer with network access', 'a journalist with protected-source contacts in sensitive ministries', 'a former military officer maintaining suspicious foreign contacts'],
      pattern_detail: ['irregular late-night movements inconsistent with stated lifestyle', 'repeated meetings at non-residential locations with unknown contacts', 'overseas travel patterns inconsistent with stated business', 'encrypted device usage inconsistent with civilian profile'],
      contact_role: ['an individual on the foreign nationals watch list', 'an unknown male with a diplomatic vehicle', 'a known cutout for a foreign intelligence service', 'an unidentified individual using counter-surveillance tradecraft'],
      contact_frequency: ['weekly at varying locations', 'monthly at a private club', 'bi-weekly with irregular timing', 'whenever subject travels abroad'],
      digital_anomaly: ['encrypted traffic to foreign-based servers', 'secure messaging app usage inconsistent with civilian profile', 'VPN usage and foreign IP connections', 'communications gaps that correlate with known dead-drop windows'],
    }
  },

  LONG_HUNT_HVT: {
    label: 'LONG-RANGE HVT HUNT',
    category: 'EXTENDED HVT OPERATION',
    location: 'FOREIGN',
    isMultiPhase: true,
    urgencyRange: [30, 50],
    threatRange: [3, 5],
    phases: [
      {
        id: 'LOCATE',
        name: 'Phase 1: Locate Target',
        shortName: 'LOCATE',
        deepenDays: 2,
        partialBriefs: [
          'PARTIAL ASSESSMENT — OP {codename} / Phase 1\n\n[UNCONFIRMED] Target "{target_alias}" ({target_role}) believed to be in {country} — location unconfirmed. Local indicators: unverified. Advance team: not deployed.\n\nDeepen investigation to confirm presence before committing assets.',
          'PARTIAL ASSESSMENT — OP {codename} / Phase 1\n\nAllied service lead on "{target_alias}" in {country}. Confidence: LOW. Ground confirmation not yet obtained. SIGINT triangulation: not completed.\n\nProceed with partial intel at reduced probability, or deepen investigation.',
        ],
        invDaysRange: [3, 5],
        invDepts: ['ANALYSIS', 'SIGINT', 'FOREIGN_OPS'],
        execDaysRange: [2, 4],
        execDepts: ['FOREIGN_OPS'],
        budgetRange: [3, 6],
        confSuccess: [0, 0],
        confFail: [-3, -7],
        falseFlagChance: 0.0,
        opNarrative: 'Foreign Operations deploys a small advance team to the region to establish initial contact with local assets and begin narrowing the target\'s location. SIGINT actively queries relevant traffic. The team operates under civilian cover and avoids any direct confrontation — this is reconnaissance only.',
        investigateReports: [
          'Long-range intelligence suggests {target_alias} — {target_role} — may be based in or transiting through {country}. Location unconfirmed.',
          'Allied service passed a lead suggesting {target_role} "{target_alias}" is operating somewhere in {country}. Requires ground confirmation.',
        ],
        fullBriefs: [
          'PHASE 1 BRIEF — OP {codename}\n\nTarget: "{target_alias}" — {target_role}.\n\nBackground: {target_bg}\n\nSIGINT triangulation places target in {city} region with moderate confidence. Local assets confirm {local_indicator}.\n\nPhase 1 objective: Deploy advance team to confirm location and establish initial pattern-of-life.',
          'PHASE 1 BRIEF — OP {codename}\n\nHVT target "{target_alias}" ({target_role}) assessed to be in {country}.\n\n{target_bg}\n\nAdvance team deployment recommended. Objective: confirm target presence and identify base location. Proceed with maximum operational security.',
        ],
        successOutcomes: [
          'Target "{target_alias}" confirmed in {city}. Advance team established. Initial pattern-of-life begun. Phase 2 authorized.',
          'Location confirmed. "{target_alias}" is operating from {city}. Advance team in place and maintaining covert observation. Proceeding to Phase 2.',
        ],
        failureOutcomes: [
          'Advance team unable to confirm target location. "{target_alias}" may have moved. Phase 1 inconclusive — restarting location intelligence.',
          'Advance team compromised. Local security services became aware of foreign presence. Team extracted. Target now alerted to interest in the area.',
        ],
      },
      {
        id: 'PATTERN_OF_LIFE',
        name: 'Phase 2: Pattern of Life',
        shortName: 'TRACKING',
        deepenDays: 2,
        partialBriefs: [
          'PARTIAL ASSESSMENT — OP {codename} / Phase 2\n\n[UNCONFIRMED] Target "{target_alias}" under observation in {city}. Daily routine: not yet mapped. Security detail: uncharacterized. Strike window: not identified.\n\nDeepen investigation for full pattern-of-life before authorizing Phase 3.',
          'PARTIAL ASSESSMENT — OP {codename} / Phase 2\n\nTracking of "{target_alias}" in {city} underway — preliminary only. Movement data: fragmentary. Optimal window: unknown.\n\nProceed with partial intel at reduced probability, or deepen investigation.',
        ],
        invDaysRange: [4, 6],
        invDepts: ['FOREIGN_OPS', 'HUMINT', 'SIGINT'],
        execDaysRange: [4, 6],
        execDepts: ['FOREIGN_OPS', 'HUMINT'],
        budgetRange: [4, 8],
        confSuccess: [0, 0],
        confFail: [-4, -8],
        falseFlagChance: 0.0,
        opNarrative: 'Foreign Operations expands the surveillance package around the confirmed location. HUMINT activates local assets for close-proximity observation. The team maps every movement: regular routes, meeting locations, security detail composition, safe house access, and most importantly — the window when the target is exposed and accessible.',
        investigateReports: [
          'Target "{target_alias}" confirmed in {city}. Phase 2 authorized. Pattern-of-life package being assembled.',
          '"{target_alias}" located and under observation in {city}. Phase 2 approved. Extended surveillance team ready to deploy.',
        ],
        fullBriefs: [
          'PHASE 2 BRIEF — OP {codename}\n\nExtended tracking of "{target_alias}" underway in {city}.\n\nPattern-of-life established: {routine_detail}.\n\nSecurity detail: {security}. Identified window: {strike_window}.\n\nPhase 2 objective: Maintain observation and confirm optimal strike window before Phase 3 authorization.',
          'PHASE 2 BRIEF — OP {codename}\n\nFull pattern-of-life on "{target_alias}" complete.\n\n{routine_detail}\n\nSecurity profile: {security}. Strike window confirmed: {strike_window}.\n\nAll elements are in place. Phase 3 strike authorization ready for approval.',
        ],
        successOutcomes: [
          'Pattern-of-life complete. "{target_alias}\'s" routine fully mapped. Strike window confirmed: {strike_window}. Phase 3 authorized.',
          'Tracking phase successful. Full movement pattern established. Security detail routine identified. Optimal window documented. Proceeding to Phase 3.',
        ],
        failureOutcomes: [
          'Tracking failed. Target "{target_alias}" detected surveillance and has relocated. Pattern-of-life incomplete. Strike window lost.',
          'Phase 2 operation compromised. Local HUMINT asset arrested by security services. "{target_alias}" is now aware of surveillance interest. Target has increased security posture.',
        ],
        vars: {
          routine_detail: ['Regular movement between residence and two meeting locations. Predictable 48-hour cycle.', 'Highly irregular schedule, but residential location confirmed and stable.', 'Daily route confirmed via three separate observation points.'],
          strike_window: ['a morning departure window (low security, predictable route)', 'a regular meeting at an isolated location', 'a weekly supply pickup outside the compound perimeter'],
        },
      },
      {
        id: 'STRIKE',
        name: 'Phase 3: Strike',
        shortName: 'STRIKE',
        deepenDays: 1,
        partialBriefs: [
          'PARTIAL ASSESSMENT — OP {codename} / Phase 3\n\n[UNCONFIRMED] Strike package for "{target_alias}" in {city}: partially assembled. Confirmed window: unverified. Extraction route: not finalized.\n\nDeepen for full strike authorization, or proceed at reduced probability.',
          'PARTIAL ASSESSMENT — OP {codename} / Phase 3\n\nFinal strike authorization for "{target_alias}" pending review. Strike window: estimated. Security posture: partially characterized.\n\nProceed with partial intel at reduced probability, or deepen investigation.',
        ],
        invDaysRange: [1, 2],
        invDepts: ['ANALYSIS', 'FOREIGN_OPS'],
        execDaysRange: [2, 3],
        execDepts: ['FOREIGN_OPS', 'SPECIAL_OPS'],
        budgetRange: [6, 14],
        confSuccess: [14, 24],
        confFail: [-14, -26],
        falseFlagChance: 0.0,
        opNarrative: 'The strike package — assembled over weeks of patient work — is authorized. Special Operations moves on the confirmed strike window. Foreign Operations maintains the extraction corridor. The team has one chance: the window lasts hours, not days. All preceding phases have led to this moment.',
        investigateReports: [
          'Phases 1 and 2 complete. Strike authorization ready. Final pre-operation intelligence review underway.',
          'All preparatory phases complete. Strike package finalized. Awaiting final authorization to proceed.',
        ],
        fullBriefs: [
          'STRIKE BRIEF — OP {codename} / Phase 3\n\nFinal strike authorization for "{target_alias}".\n\nWindow: {strike_window}. Location: {city}. Security: {security}.\n\n{target_bg}\n\nThis target has been tracked for weeks. All intelligence confirms the window. Special Operations is ready. Recommend authorization.',
          'STRIKE BRIEF — OP {codename} / Phase 3\n\nTarget "{target_alias}" ({target_role}) is within the confirmed strike window.\n\nAll phases have been completed successfully. Strike team is in position. Extraction route confirmed.\n\nThis is a high-value outcome. Recommend immediate authorization.',
        ],
        successOutcomes: [
          'Target "{target_alias}" neutralized. Strike executed within the confirmed window. Team extracted clean. Zero attribution. {target_consequence}.',
          'Operation concluded successfully. "{target_alias}" eliminated. All team members accounted for. The weeks of careful preparation paid off. {target_consequence}.',
        ],
        failureOutcomes: [
          'Strike failed. Target "{target_alias}" was not at the expected location — the window may have shifted. Team extracted. Weeks of work undone.',
          'Strike compromised at the final moment. Security detail was reinforced without warning. Team extracted under fire. "{target_alias}" remains alive and now on high alert.',
        ],
        vars: {
          target_consequence: ['Regional operations assessed as significantly degraded.', 'Network without leadership — disruption expected for 12+ months.', 'Significant allied intelligence benefit confirmed.'],
        },
      },
    ],
    vars: {
      target_alias: ['CROWBAR', 'SUNDIAL', 'KEYSTONE', 'IRONWOOD', 'BASILISK', 'REDCOAT', 'ANCHOR', 'TIDALWAVE'],
      target_role: ['a senior terror network commander', 'a regional arms trafficking coordinator', 'a foreign intelligence service operational director', 'a sanctioned paramilitary commander'],
      target_bg: ['Subject has evaded capture for 4 years. Responsible for attacks resulting in significant allied casualties.', 'Subject oversees a network responsible for proliferating advanced weapons to hostile non-state actors.', 'Subject coordinates hostile intelligence operations across the region. High strategic value.'],
      local_indicator: ['a vehicle matching target\'s known transport in the area', 'SIGINT consistent with target\'s known communication patterns', 'a local contact has sighted an individual matching target\'s description'],
      security: ['light — 2 to 4 guards, relaxed posture', 'moderate — 6-man detail, professional', 'heavy — 12+ security, hardened location'],
    }
  },

  MOLE_HUNT: {
    label: 'MOLE HUNT',
    category: 'COUNTER-ESPIONAGE CHAIN',
    location: 'DOMESTIC',
    isMultiPhase: true,
    urgencyRange: [35, 55],
    threatRange: [3, 5],
    phases: [
      {
        id: 'DATA_TRIAGE',
        name: 'Phase 1: Data Triage',
        shortName: 'TRIAGE',
        deepenDays: 2,
        partialBriefs: [
          'PARTIAL ASSESSMENT — OP {codename} / Phase 1\n\n[UNCONFIRMED] Possible insider compromise detected. Affected data streams: uncharacterized. Suspect pool size: unknown. Department of origin: unconfirmed.\n\nDeepen investigation for full data triage before proceeding.',
          'PARTIAL ASSESSMENT — OP {codename} / Phase 1\n\nAccess anomalies detected — source unclear. Forensic review: not yet complete. Timing pattern: unanalyzed.\n\nProceed with partial intel at reduced probability, or deepen investigation for a confirmed suspect pool.',
        ],
        invDaysRange: [4, 6],
        invDepts: ['ANALYSIS', 'COUNTER_INTEL', 'SIGINT'],
        execDaysRange: [2, 3],
        execDepts: ['ANALYSIS', 'COUNTER_INTEL'],
        budgetRange: [1, 3],
        confSuccess: [0, 0],
        confFail: [-2, -5],
        falseFlagChance: 0.0,
        opNarrative: 'Analysis Bureau and Counter-Intelligence conduct a full review of access logs, data compartment breaches, and timing correlations across recent operational compromises. This is forensic work: quiet, methodical, and critical. The goal is to narrow a field of hundreds of possible access-holders to a manageable suspect list — without alerting the mole that the hunt has begun.',
        investigateReports: [
          'Multiple operational compromises have been traced to a potential insider. The access pattern is not consistent with external penetration. An internal review has been authorized.',
          'Foreign intelligence service appears to have advance knowledge of three separate operations. Source analysis points to an internal access issue. Counter-Intelligence investigation authorized.',
        ],
        fullBriefs: [
          'DATA TRIAGE BRIEF — OP {codename} / Phase 1\n\nAccess analysis complete. Compromised data streams: {compromised_streams}.\n\nCross-referencing access logs has produced a suspect pool of {suspect_pool_size} individuals.\n\nPrimary suspect cluster identified in {suspect_dept}. Next step: targeted surveillance to identify the principal actor.',
          'DATA TRIAGE BRIEF — OP {codename} / Phase 1\n\nForensic review of {compromised_streams} complete.\n\nAccess pattern analysis narrows suspects to {suspect_pool_size} individuals. Timing analysis suggests the leak occurs after {timing_detail}.\n\nRecommend proceeding to Phase 2: Targeted Surveillance of the primary suspect.',
        ],
        successOutcomes: [
          'Data triage complete. Suspect pool narrowed to {suspect_pool_size} individuals in {suspect_dept}. Primary suspect identified for Phase 2 surveillance.',
          'Phase 1 complete. Pattern analysis points strongly to {suspect_dept}. Operational security maintained. Proceeding to targeted surveillance.',
        ],
        failureOutcomes: [
          'Data triage inconclusive. Access pattern is too broad to narrow effectively. The mole may be using a cutout or intermediary. Investigation stalled.',
          'Forensic review detected by IT security before we could limit access to the results. Possible warning to the mole. Investigation must restart.',
        ],
        vars: {
          compromised_streams: ['three classified operations files', 'two agent network reports', 'the SIGINT collection schedule and four operational briefs'],
          suspect_pool_size: ['12', '7', '4 to 6', '9'],
          suspect_dept: ['the Analysis Bureau', 'Field Operations', 'the Foreign Operations directorate', 'the technical collection division'],
          timing_detail: ['morning briefings are attended by the suspect cluster', 'materials are added to the system and before external dissemination', 'weekly operations reviews'],
        },
      },
      {
        id: 'TARGETED_SURVEILLANCE',
        name: 'Phase 2: Target Surveillance',
        shortName: 'SURVEILLANCE',
        deepenDays: 1,
        partialBriefs: [
          'PARTIAL ASSESSMENT — OP {codename} / Phase 2\n\n[UNCONFIRMED] Primary suspect identified from triage — surveillance not yet established. Canary trap: not activated. Behavioral profile: incomplete.\n\nDeepen investigation before proceeding to confirm suspect guilt.',
          'PARTIAL ASSESSMENT — OP {codename} / Phase 2\n\nSurveillance package on suspect in {suspect_dept}: authorized but preliminary results only. Canary trap status: unclear. Indicators: unverified.\n\nProceed with partial intel at reduced probability, or deepen investigation.',
        ],
        invDaysRange: [3, 5],
        invDepts: ['COUNTER_INTEL', 'SIGINT', 'FIELD_OPS'],
        execDaysRange: [3, 4],
        execDepts: ['COUNTER_INTEL', 'SIGINT'],
        budgetRange: [2, 4],
        confSuccess: [0, 0],
        confFail: [-4, -8],
        falseFlagChance: 0.35,
        falseFlagTexts: [
          'SURVEILLANCE ANOMALY — Monitoring of the primary suspect has produced inconsistent results. The observed patterns do not match typical handler contact protocols. Cross-referencing with the data timeline reveals the suspect\'s access to the compromised files was incidental — they were authorized to access them for a legitimate task. There is a significant probability that this individual is innocent and that we have identified the wrong person from the data triage phase.',
          'INVESTIGATION UPDATE — Controlled surveillance of the primary suspect has revealed exculpatory evidence. Their financial records, movement patterns, and communications are inconsistent with a clandestine relationship. A deeper analysis of the data triage suggests an error in the access-log weighting algorithm. We may be targeting an innocent person. The actual mole may be another member of the suspect pool.',
        ],
        opNarrative: 'Counter-Intelligence runs a tight, covert surveillance package on the primary suspect from the data triage phase. SIGINT monitors their digital activity for patterns consistent with covert reporting — dead drops, one-time pads, encrypted burst transmissions. Field Operations maintains physical surveillance. A controlled information feed is used as a canary trap: classified material slightly modified and provided only to the suspect, to test if it appears in known foreign intelligence channels.',
        investigateReports: [
          'Data triage has identified a primary suspect in {suspect_dept}. Surveillance package has been approved. Subject under discreet observation.',
          'Phase 1 narrowed the field to a primary suspect. Targeted surveillance authorized. Canary trap activated.',
        ],
        fullBriefs: [
          'SURVEILLANCE BRIEF — OP {codename} / Phase 2\n\nPrimary suspect: {suspect_description}. Under active surveillance.\n\nCanary trap results: {canary_result}.\n\nBehavioral indicators: {behavioral_indicators}.\n\nAssessment: suspect is {guilt_assessment}. Recommend proceeding to Phase 3: Capture.',
          'SURVEILLANCE BRIEF — OP {codename} / Phase 2\n\nSurveillance complete on suspect in {suspect_dept}.\n\nCanary trap material has appeared in {canary_result}. Behavioral profile confirms {behavioral_indicators}.\n\nEvidence threshold for arrest met. Proceed to Phase 3.',
        ],
        successOutcomes: [
          'Surveillance phase confirms the suspect\'s guilt. Canary trap yielded positive result. Evidence package is sufficient for arrest. Phase 3 authorized.',
          'Phase 2 complete. Suspect\'s guilt confirmed via canary trap and behavioral analysis. Full arrest package prepared. Proceeding to Phase 3.',
        ],
        failureOutcomes: [
          'Surveillance detected. Suspect changed behavior immediately — likely burned by a tip from within the investigation team. The mole knows we are hunting.',
          'Surveillance conclusive but suspect has fled. They had an escape plan in place, suggesting advance warning. Damage assessment underway.',
        ],
        vars: {
          suspect_description: ['a senior analyst with 12 years of access', 'a case officer with broad network visibility', 'a technical specialist with systems access', 'a mid-level officer with historical access to all compromised files'],
          canary_result: ['foreign-language intercepts within 72 hours of distribution', 'modified operational details in an intercepted foreign intelligence report', 'an allied service warning that compromised material had surfaced'],
          behavioral_indicators: ['increased counter-surveillance behavior during commute', 'unexplained cash withdrawals on a consistent schedule', 'communications blackouts on a pattern consistent with dead-drop protocol'],
          guilt_assessment: ['highly likely guilty — evidence threshold met', 'likely guilty — canary trap confirmed, warrant can be applied for'],
        },
      },
      {
        id: 'CAPTURE',
        name: 'Phase 3: Arrest',
        shortName: 'ARREST',
        deepenDays: 1,
        partialBriefs: [
          'PARTIAL ASSESSMENT — OP {codename} / Phase 3\n\n[UNCONFIRMED] Arrest package: preliminary. Warrant: pending. Optimal arrest location: not confirmed. Handler notification cut-off: not prepared.\n\nDeepen investigation to complete charge package, or proceed at reduced probability.',
          'PARTIAL ASSESSMENT — OP {codename} / Phase 3\n\nArrest authorization for suspect: evidence threshold not fully met. Charge documentation: incomplete. Arrest window: estimated.\n\nProceed with partial intel at reduced probability, or deepen investigation.',
        ],
        invDaysRange: [1, 2],
        invDepts: ['COUNTER_INTEL', 'FIELD_OPS'],
        execDaysRange: [1, 1],
        execDepts: ['COUNTER_INTEL', 'FIELD_OPS'],
        budgetRange: [1, 3],
        confSuccess: [4, 8],
        confFail: [-8, -14],
        falseFlagChance: 0.0,
        opNarrative: 'A quiet, controlled arrest. Counter-Intelligence has prepared a full charge package. Field Operations secures the location and ensures the subject cannot signal their handler before arrest. The subject is taken to a secure facility. Speed and discretion are paramount — the handler must not be warned. If successful, Phase 4 begins immediately.',
        investigateReports: [
          'Evidence package complete. Arrest authorized. Warrant signed. Team briefed.',
          'Surveillance phase concluded. Arrest order in place. Field Operations team ready. Proceeding to apprehension.',
        ],
        fullBriefs: [
          'ARREST BRIEF — OP {codename} / Phase 3\n\nSuspect to be arrested at {arrest_location}. Charge: {charges}.\n\nHandler contact cut-off protocol active — suspect\'s devices will be cloned before notification.\n\nPost-arrest: immediate transfer to Counter-Intelligence secure facility for Phase 4 interrogation.',
          'ARREST BRIEF — OP {codename} / Phase 3\n\nAll evidence gathered. Warrant in place for {charges}.\n\nArrest at {arrest_location}. Team of {team_size} officers supported by Counter-Intelligence debrief specialists.\n\nPhase 4 (Interrogation) will commence within 6 hours of arrest.',
        ],
        successOutcomes: [
          'Arrest executed cleanly. Suspect in custody. No handler notification detected. Phase 4 interrogation authorized and beginning.',
          'Subject apprehended at {arrest_location}. Full evidence seizure complete. Handler unaware. Proceeding immediately to Phase 4.',
        ],
        failureOutcomes: [
          'Arrest attempted but subject was not at the location. Possible warning received. The subject has fled — now a fugitive. Handler alerted.',
          'Arrest compromised. Subject resisted and a public altercation occurred. Classified nature of investigation now exposed. Mission integrity severely damaged.',
        ],
        vars: {
          arrest_location: ['subject\'s residence, early morning', 'the subject\'s office, after close of business', 'a pre-identified meeting location'],
          charges: ['espionage under the Official Secrets Act', 'passing classified material to a hostile foreign intelligence service', 'conspiracy with a foreign power'],
          team_size: ['6', '8', '4'],
        },
      },
      {
        id: 'INTERROGATION',
        name: 'Phase 4: Interrogation',
        shortName: 'INTERROGATION',
        deepenDays: 1,
        partialBriefs: [
          'PARTIAL ASSESSMENT — OP {codename} / Phase 4\n\n[UNCONFIRMED] Suspect in custody. Interrogation priorities: not yet defined. Team composition: pending. Handler identity: unknown.\n\nDeepen investigation to prepare a complete debrief strategy, or proceed at reduced probability.',
          'PARTIAL ASSESSMENT — OP {codename} / Phase 4\n\nInterrogation authorized but debrief plan: preliminary only. Subject\'s likely approach: uncharacterized. Intelligence targets: partially defined.\n\nProceed with partial intel at reduced probability, or deepen investigation.',
        ],
        invDaysRange: [1, 2],
        invDepts: ['COUNTER_INTEL', 'ANALYSIS'],
        execDaysRange: [3, 5],
        execDepts: ['COUNTER_INTEL'],
        budgetRange: [1, 2],
        confSuccess: [8, 14],
        confFail: [-4, -8],
        falseFlagChance: 0.0,
        spawnsFollowUp: 'FOREIGN_HVT',
        followUpIntelTexts: [
          'Interrogation extracted the identity and likely location of the suspect\'s handler — a foreign intelligence officer operating under diplomatic cover. A new mission file has been opened.',
          'Subject gave up their handler after sustained questioning. Location and operational schedule provided. New target package being assembled.',
          'Full debrief complete. Handler identity confirmed with high confidence. Target now in our sights. New mission authorized.',
        ],
        opNarrative: 'Counter-Intelligence specialists conduct a sustained, lawful debrief of the subject. The goal is not confession — it is intelligence. Who is the handler? What was passed? What else might have been compromised? Are there other assets in place? Done correctly, a successful interrogation of a mole can roll up an entire foreign intelligence operation. This is the payoff for weeks of careful work.',
        investigateReports: [
          'Subject in custody. Counter-Intelligence debrief specialists ready. Interrogation protocol authorized.',
          'Phase 3 complete. Subject secured. Interrogation brief prepared. Phase 4 begins immediately.',
        ],
        fullBriefs: [
          'INTERROGATION BRIEF — OP {codename} / Phase 4\n\nSubject is cooperative at this stage. Debrief priorities: handler identity, communication protocols, extent of material passed, other active assets.\n\nInterrogation team: {team_composition}. Duration: 3 to 5 days.\n\nIf successful, expect to be able to identify and potentially target the handler.',
          'INTERROGATION BRIEF — OP {codename} / Phase 4\n\nSubject has been isolated from external communication. Initial approach: {interrogation_approach}.\n\nPriority intelligence requirements: handler identity, dead-drop locations, active tasking details.\n\nA successful debrief will generate a new operational target.',
        ],
        successOutcomes: [
          'Interrogation successful. Handler identity obtained: {handler_description}. Dead-drop protocol and communication cipher recovered. A new target has emerged.',
          'Full debrief complete. Subject gave up the handler, the communication system, and three additional active tasking priorities. New target package opened.',
        ],
        failureOutcomes: [
          'Subject refused to cooperate beyond confirming basic charges. Handler identity not obtained. Legal review has restricted further interrogation approaches. Intelligence gain limited.',
          'Interrogation produced limited actionable intelligence. Subject maintained compartmentalization. Handler identity unknown. Network structure remains largely intact.',
        ],
        vars: {
          handler_description: ['a foreign intelligence officer operating under diplomatic cover in the capital', 'a case officer who has been running assets in this country for three years', 'a known foreign intelligence service officer previously assessed as low-priority'],
          team_composition: ['senior Counter-Intelligence officer and two specialists', 'four-person debrief team with legal oversight', 'interrogation lead and forensic psychologist'],
          interrogation_approach: ['building rapport over 48 hours before applying pressure', 'confronting subject with the full evidence package immediately', 'using legal framework and plea agreement incentives'],
        },
      },
    ],
    vars: {
      suspect_dept: ['the Analysis Bureau', 'Field Operations', 'the Foreign Operations directorate', 'the technical collection division'],
    }
  },

};
