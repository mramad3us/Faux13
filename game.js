'use strict';
// =============================================================================
// SHADOW DIRECTIVE v1.1  —  Procedural Intelligence Operations Game
// =============================================================================

// =============================================================================
// CONFIGURATION
// =============================================================================

const COUNTRIES = {
  USA: {
    name: 'United States', agency: 'National Special Activities Directorate',
    acronym: 'NSAD', flag: '🇺🇸',
    leader: 'POTUS', leaderTitle: 'the President', leaderFormal: 'Mr. President',
    currency: '$', currencySymbol: '$',
    budget: 60, staff: 300, confidence: 70,
    reportsTo: 'Reports directly to POTUS',
    desc: 'The world\'s most powerful intelligence apparatus at your command. Vast resources, but under intense scrutiny.',
    budgetLabel: '$60M', staffLabel: '300', confLabel: '70%',
    domesticCities: ['New York', 'Chicago', 'Los Angeles', 'Washington D.C.', 'Miami', 'Houston', 'Seattle', 'Boston', 'Atlanta', 'Denver'],
    weeklyBudgetRegen: 4,
  },
  UK: {
    name: 'United Kingdom', agency: 'Strategic Intelligence Executive',
    acronym: 'SIE', flag: '🇬🇧',
    leader: 'the Prime Minister', leaderTitle: 'the Prime Minister', leaderFormal: 'Prime Minister',
    currency: '£', currencySymbol: '£',
    budget: 40, staff: 200, confidence: 65,
    reportsTo: 'Reports directly to the Prime Minister',
    desc: 'A proud tradition of intelligence excellence. Moderate resources with strong allied networks.',
    budgetLabel: '£40M', staffLabel: '200', confLabel: '65%',
    domesticCities: ['London', 'Manchester', 'Birmingham', 'Glasgow', 'Leeds', 'Bristol', 'Edinburgh', 'Cardiff', 'Liverpool', 'Sheffield'],
    weeklyBudgetRegen: 3,
  },
  FRANCE: {
    name: 'France', agency: 'Direction Spéciale des Opérations',
    acronym: 'DSO', flag: '🇫🇷',
    leader: 'the Président', leaderTitle: 'the Président de la République', leaderFormal: 'Monsieur le Président',
    currency: '€', currencySymbol: '€',
    budget: 25, staff: 150, confidence: 60,
    reportsTo: 'Reports directly to the Président de la République',
    desc: 'Lean and ruthless. Limited resources demand efficiency and audacity.',
    budgetLabel: '€25M', staffLabel: '150', confLabel: '60%',
    domesticCities: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Lille', 'Nice', 'Nantes', 'Strasbourg', 'Rennes'],
    weeklyBudgetRegen: 2,
  }
};

const DEPT_CONFIG = [
  {
    id: 'ANALYSIS', name: 'Analysis Bureau', short: 'ANALYSIS',
    desc: 'Processes raw intel, produces assessments',
    tip: 'Best general-purpose investigator — required for most mission types. Turns vague intercepts into actionable intelligence briefings. Does not contribute to direct-action operations.',
  },
  {
    id: 'HUMINT', name: 'Human Intelligence', short: 'HUMINT',
    desc: 'Runs agents, assets, and informants',
    tip: 'Manages human agents and informants worldwide. Essential for cell-based threats, networks, and operations requiring in-person access. Strong execution bonus when the target involves human networks.',
  },
  {
    id: 'SIGINT', name: 'Signals Intelligence', short: 'SIGINT',
    desc: 'Electronic surveillance and interception',
    tip: 'Electronic surveillance and communications interception. Best at locating mobile targets and tracking planning activity. Particularly effective on tech-savvy or communications-dependent threats.',
  },
  {
    id: 'FIELD_OPS', name: 'Field Operations', short: 'FIELD OPS',
    desc: 'Domestic covert field teams',
    tip: 'Domestic covert field teams for surveillance, arrest, and direct action. Primary executor for most domestic operations. Cannot be used for foreign missions. Will show DEPLOYED and become unavailable during active operations.',
  },
  {
    id: 'SPECIAL_OPS', name: 'Special Activities', short: 'SPECIAL OPS',
    desc: 'Paramilitary and direct-action capability',
    tip: 'Paramilitary direct-action unit. Highest execution success bonus of any department. Required for high-threat neutralizations, hostage rescue, and renditions. Scarce — do not waste on low-priority missions.',
  },
  {
    id: 'FOREIGN_OPS', name: 'Foreign Operations', short: 'FOREIGN OPS',
    desc: 'International clandestine operations',
    tip: 'Runs all international clandestine operations. Required for foreign HVT, rendition, asset rescue, and regime operations. Cannot be used on domestic missions. Will show DEPLOYED during active foreign operations.',
  },
  {
    id: 'COUNTER_INTEL', name: 'Counter-Intelligence', short: 'COUNTER-INTEL',
    desc: 'Internal security and mole-hunting',
    tip: 'Internal security and mole-hunting. Specializes in counter-espionage investigations. Required for insider threat and domestic HVT operations. Also provides a defensive bonus against enemy intelligence activity.',
  },
];

// =============================================================================
// WORLD LOCATIONS
// =============================================================================

const FOREIGN_CITIES = [
  { city: 'Moscow', country: 'Russia', region: 'Eastern Europe' },
  { city: 'Tehran', country: 'Iran', region: 'Middle East' },
  { city: 'Pyongyang', country: 'North Korea', region: 'East Asia' },
  { city: 'Damascus', country: 'Syria', region: 'Middle East' },
  { city: 'Caracas', country: 'Venezuela', region: 'South America' },
  { city: 'Havana', country: 'Cuba', region: 'Caribbean' },
  { city: 'Minsk', country: 'Belarus', region: 'Eastern Europe' },
  { city: 'Kabul', country: 'Afghanistan', region: 'Central Asia' },
  { city: 'Baghdad', country: 'Iraq', region: 'Middle East' },
  { city: 'Tripoli', country: 'Libya', region: 'North Africa' },
  { city: 'Khartoum', country: 'Sudan', region: 'East Africa' },
  { city: 'Islamabad', country: 'Pakistan', region: 'South Asia' },
  { city: 'Bogotá', country: 'Colombia', region: 'South America' },
  { city: 'Lagos', country: 'Nigeria', region: 'West Africa' },
  { city: 'Belgrade', country: 'Serbia', region: 'Balkans' },
];

const CODENAME_ADJ = ['IRON', 'SHADOW', 'BLACK', 'SILENT', 'STEEL', 'CRIMSON', 'GOLDEN', 'BROKEN', 'DARK',
  'SWIFT', 'BURNING', 'COLD', 'GHOST', 'HOLLOW', 'WHITE', 'SILVER', 'STONE', 'BLIND', 'FALLEN', 'BROKEN'];
const CODENAME_NOUN = ['FALCON', 'HAMMER', 'DAWN', 'TIDE', 'SERPENT', 'ARROW', 'STORM', 'SHIELD',
  'WOLF', 'LANCE', 'STAR', 'ANVIL', 'BLADE', 'CROWN', 'GATE', 'RAVEN', 'TOWER', 'MIRROR', 'VEIL', 'FIST'];

// =============================================================================
// MISSION TEMPLATES
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
    staffRange: [15, 45],
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
      'Insufficient intelligence led to premature deployment. Field teams arrived post-event. {casualties} casualties. Cell leader "{alias}" remains at large.\n\nPost-incident review indicates the investigation was closed too early. Full intel was not yet available when the operation was approved.',
    ],
    confSuccess: [10, 18], confFail: [-18, -30],
    vars: {
      group: ['domestic extremists', 'a foreign-linked cell', 'an anarchist collective', 'radicalized nationals', 'a separatist faction'],
      attack_type: ['a mass-casualty bombing', 'a vehicle attack', 'an infrastructure strike', 'a targeted assassination campaign', 'a chemical release'],
      target: ['Parliament', 'a transit hub', 'a financial district', 'a government ministry', 'a national monument', 'a major airport'],
      cell_size: ['3', '4 to 6', '7 or more', 'an unknown number of'],
      alias: ['VIPER', 'HAMMER', 'CROW', 'GHOST', 'THORN', 'HYDRA', 'JACKAL', 'WRAITH'],
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
    staffRange: [8, 25],
    invDepts: ['ANALYSIS', 'HUMINT', 'SIGINT', 'FOREIGN_OPS'],
    execDepts: ['FOREIGN_OPS', 'SPECIAL_OPS'],
    opNarrative: 'A covert team inserts into the target country under civilian or diplomatic cover. Foreign Operations conducts final surveillance and confirms the window. The team moves on the target at the optimal moment, with Special Operations providing armed overwatch. Extraction routes are pre-staged — the team must be clear of the country within hours of completing the mission.',
    initialReports: [
      'Intel suggests high-value target — designation {hvt_role} — currently located in {city}, {country}. Identity unconfirmed.',
      'SIGINT intercepts place HVT of interest in {country}. Known alias: "{alias}". Purpose of visit: unknown.',
      'Foreign liaison reports individual matching description of {hvt_role} "{alias}" active in {city}, {country}.',
    ],
    fullReports: [
      'INTELLIGENCE BRIEF — OP {codename}\n\nTarget: {hvt_role}, operating as "{alias}". Confirmed present in {city}, {country}.\n\nBackground: {hvt_bg}\n\nLocation: {location_detail}. Personal security detail: {security}.\n\nWindow: {urgency_days} days before target relocates.\n\nRecommendation: Covert elimination or rendition team deployment.',
      'INTELLIGENCE BRIEF — OP {codename}\n\nHVT "{alias}" — {hvt_role} — confirmed in {city}, {country}.\n\n{hvt_bg}\n\nSecurity profile: {security}. Known movements: {movements}.\n\nThis is a time-critical target. Recommend immediate action.',
    ],
    successMsgs: [
      'Target "{alias}" neutralized. Operation conducted with minimal signature. Regional {hvt_consequence} significantly degraded.\n\nThe team extracted cleanly within the planned window. No attribution. Foreign liaison has acknowledged the outcome through back channels.',
      'Mission accomplished. "{alias}" eliminated in {city}. No agency attribution. {hvt_consequence} disrupted.\n\nInitial assessment: the target\'s network will require months to reconstitute. A significant capability degradation has been achieved.',
    ],
    failureMsgs: [
      'Target "{alias}" escaped. Team extracted under fire. {complication}. International exposure risk elevated.\n\nThe target was apparently warned — a security review of the intelligence chain is under way. Foreign Operations has flagged a possible leak.',
      'Operation compromised. Target alerted and relocated. Two assets burned. {complication}.\n\nThe mission window is now closed. The target has likely moved to a protected location. Recovery of this opportunity is assessed as unlikely in the near term.',
    ],
    confSuccess: [12, 20], confFail: [-15, -25],
    vars: {
      hvt_role: ['a weapons broker', 'a terrorist financier', 'a foreign intelligence officer', 'a fugitive arms dealer', 'a rogue scientist', 'a war crimes suspect'],
      hvt_bg: ['Subject responsible for financing multiple attacks against allied interests.', 'Subject linked to proliferation of advanced weaponry to hostile non-state actors.', 'Subject believed to have operational knowledge of planned attacks against the homeland.'],
      security: ['minimal (2 guards)', 'moderate (6-man detail)', 'heavy (12+ armed personnel)', 'unknown'],
      movements: ['predictable daily route', 'erratic, irregular schedule', 'confined to secure compound'],
      location_detail: ['a private residence', 'a hotel', 'a government facility', 'an unofficial safehouse'],
      hvt_consequence: ['terror financing network', 'arms trafficking operation', 'intelligence network'],
      complication: ['Foreign media is reporting possible intelligence activity in the area', 'A local national was killed during the exfil', 'Two team members are still evading pursuit'],
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
    staffRange: [6, 18],
    invDepts: ['ANALYSIS', 'HUMINT', 'FOREIGN_OPS'],
    execDepts: ['FOREIGN_OPS', 'SPECIAL_OPS'],
    opNarrative: 'Foreign Operations inserts a small contact team to locate and reach the asset. Once contact is made, the team moves to a pre-planned exfiltration corridor — sea, air, or overland depending on the situation. Special Operations provides armed support in case the extraction turns hostile. Speed is critical; the window closes fast.',
    initialReports: [
      'Asset "{alias}" has gone dark in {city}, {country}. Last contact: {days_dark} days ago. Status unknown.',
      'EMERGENCY: {country} security services may have rolled up one of our networks. Asset "{alias}" is unreachable.',
      'Encrypted distress signal received from {city}. Source appears to be asset "{alias}". Message fragmentary.',
    ],
    fullReports: [
      'INTELLIGENCE BRIEF — OP {codename}\n\nAsset "{alias}" confirmed detained by {detaining_authority} in {city}, {country}.\n\nAsset has {asset_knowledge}. Interrogation is likely underway.\n\nExtraction window: {urgency_days} days before transfer to a maximum security facility.\n\nOptions: Covert extraction team, or in-country asset negotiation.',
      'INTELLIGENCE BRIEF — OP {codename}\n\nAsset "{alias}" location confirmed: {location_detail} in {city}.\n\nCondition: {asset_condition}. Has {asset_knowledge}.\n\nExfiltration corridor: {exfil_route}. Window is closing.\n\nRecommend immediate extraction before asset is transferred or talks.',
    ],
    successMsgs: [
      'Asset "{alias}" successfully extracted from {country}. Debriefing is underway. No casualties on the extraction team.\n\nThe asset remains operational. They have provided preliminary intelligence on the circumstances of their detention — further debrief reports will follow.',
      'Extraction complete. "{alias}" recovered. {asset_condition_post}. Operational security was maintained throughout.\n\nThe in-country network was partially compromised. An assessment of the damage to our {country} operations is being prepared.',
    ],
    failureMsgs: [
      'Extraction failed. Asset "{alias}" transferred to a high-security facility. Recovery is now assessed as unlikely.\n\nThe asset has knowledge of ongoing operations. A review of all related mission files is recommended. Assume potential compromise.',
      'Team compromised. Asset extraction aborted. "{alias}" fate unknown. Two team members are still evading pursuit.\n\nForeign Operations has activated emergency exfiltration protocols for the remaining personnel. Related operations are being suspended pending a security review.',
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
    staffRange: [4, 12],
    invDepts: ['ANALYSIS', 'COUNTER_INTEL', 'SIGINT'],
    execDepts: ['COUNTER_INTEL', 'FIELD_OPS'],
    opNarrative: 'Counter-Intelligence conducts a controlled burn — feeding known-false intelligence into the network to identify the leak point. SIGINT monitors the subject\'s communications for the telltale signal. Once the mole is confirmed with sufficient confidence, Field Operations executes a quiet arrest before the subject can alert their handler or destroy evidence.',
    initialReports: [
      'Anomalies detected in compartmented data access patterns. Possible insider threat. Details unclear.',
      'A foreign intelligence service appears to have advance knowledge of recent operations. Source of the leak is unidentified.',
      'Anonymous internal report: employee in {dept_name} displaying suspicious behavior. No corroborating evidence yet.',
    ],
    fullReports: [
      'INTELLIGENCE BRIEF — OP {codename}\n\nInternal investigation indicates {suspect_count} individuals with access to the compromised intelligence streams.\n\nPrimary suspect: {suspect_profile}. Access level: {access_level}.\n\nForeign beneficiary: {foreign_service}.\n\nRecommendation: Controlled surveillance and arrest operation once sufficient evidence is accumulated.',
      'INTELLIGENCE BRIEF — OP {codename}\n\nMole identified with high confidence: {suspect_profile}. Has been passing {leaked_material} to {foreign_service} for an estimated {duration}.\n\nProfile note: {suspect_profile_detail}.\n\nRecommend immediate apprehension before further damage occurs.',
    ],
    successMsgs: [
      '{suspect_profile} arrested. A partial confession has been obtained. {foreign_service} network partially rolled up. Damage assessment is underway.\n\nThe controlled burn worked cleanly. The subject did not suspect the trap until the arrest. Preliminary interrogation suggests the compromise was limited to one compartment.',
      'Internal threat neutralized. {suspect_profile} is in custody. Leaked material accounted for. Network damage: assessed as limited.\n\nFull debrief of the subject will take weeks. Counter-Intelligence has recommended a security review of all personnel with similar access levels.',
    ],
    failureMsgs: [
      'Surveillance operation blown. Suspect alerted — fled the country. {foreign_service} agent network remains intact. Damage unknown.\n\nThe subject had a pre-arranged exfiltration plan, suggesting a level of preparation we did not anticipate. A full damage assessment has been ordered.',
      'Wrong suspect apprehended. Actual mole is still active. {foreign_service} has now changed protocols.\n\nThe operational security review identified a flaw in the investigation methodology. Counter-Intelligence is restarting the investigation from scratch. The mole knows we are looking.',
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
    staffRange: [8, 22],
    invDepts: ['ANALYSIS', 'HUMINT', 'FOREIGN_OPS'],
    execDepts: ['FOREIGN_OPS', 'SPECIAL_OPS', 'FIELD_OPS'],
    opNarrative: 'A snatch team deploys under civilian cover. Foreign Operations identifies the optimal window; Special Operations executes the capture. The target is to be taken alive and moved through a covert exfiltration chain — safe house to safe house — until they can be transported to a secure interrogation facility. Legal cover must be airtight throughout.',
    initialReports: [
      'Target of interest — {rendition_role} — believed to be in {city}, {country}. Confirmation needed.',
      'Tip from allied service: individual connected to {rendition_link} operating in {country}. Capture may be possible.',
      'HUMINT reports target "{alias}" residing in {city}, {country}. Access situation unknown.',
    ],
    fullReports: [
      'INTELLIGENCE BRIEF — OP {codename}\n\nTarget: "{alias}", {rendition_role}.\n\nBackground: {rendition_link_detail}. Assessed as high interrogation value.\n\nLocation confirmed: {city}, {country}. Security: {security}.\n\nExtraction plan: {exfil_plan}. Window: {urgency_days} days.\n\nLegal cover: {legal_cover}. Recommend capture-and-render operation.',
      'INTELLIGENCE BRIEF — OP {codename}\n\nHigh-value rendition target "{alias}" confirmed in {city}.\n\n{rendition_link_detail}\n\nTarget is {security}. Intelligence value: CRITICAL.\n\nRecommend immediate snatch-and-grab operation before target relocates to safer territory.',
    ],
    successMsgs: [
      'Target "{alias}" successfully rendered. Currently in transit to a secure interrogation facility. Legal cover is holding.\n\nInitial assessment of interrogation value: SIGNIFICANT. The target has been cooperative. Early intelligence indicates active plans we were previously unaware of.',
      'Rendition complete. "{alias}" in custody. {rendition_intel_value}.\n\nThe operation was conducted cleanly. No foreign media coverage. Allied service has been informed through appropriate channels.',
    ],
    failureMsgs: [
      'Rendition operation failed. Target fled. Team engaged by {security} — extracted with casualties.\n\nThe target was more security-conscious than our assessment indicated. Foreign Operations is reviewing the intelligence that led to this evaluation.',
      'Target "{alias}" proved to be a decoy. Real target alerted and went to ground. Allied service relationship is strained.\n\nA review of the source chain for this intelligence has been initiated. We were played.',
    ],
    confSuccess: [10, 18], confFail: [-12, -22],
    vars: {
      rendition_role: ['a bomb-maker', 'a terror cell commander', 'a weapons smuggler', 'a financier of hostile operations', 'a former intelligence officer gone rogue'],
      rendition_link: ['multiple domestic attacks', 'a regional terror network', 'weapons proliferation to non-state actors'],
      rendition_link_detail: ['Subject is believed to have operational knowledge of planned attacks against allied targets.', 'Subject has led multiple operations resulting in allied casualties.', 'Subject has access to chemical precursor supply chains used in recent attacks.'],
      security: ['lightly guarded', 'moderately protected (4 guards)', 'well-protected, inside a compound'],
      exfil_plan: ['commercial flight under a sterile identity', 'by sea through neutral waters', 'overland via allied territory'],
      legal_cover: ['fully prepared', 'thin but viable', 'questionable — proceed with maximum discretion'],
      rendition_intel_value: ['Confirmed upcoming operation details extracted', 'Network map partially recovered', 'Multiple associate identities obtained'],
      alias: ['SCORPION', 'TALON', 'BASILISK', 'COBRA', 'MANTIS', 'HORNET'],
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
    staffRange: [10, 30],
    invDepts: ['ANALYSIS', 'SIGINT', 'FOREIGN_OPS'],
    execDepts: ['SPECIAL_OPS', 'FOREIGN_OPS'],
    opNarrative: 'Special Operations leads a direct-action assault on the confirmed hold site. Multiple breach points are hit simultaneously to prevent executions. Foreign Operations secures the exfiltration corridor. The team has one window — if the timing slips, the hostages are at risk. There are no second chances on a rescue operation.',
    initialReports: [
      '{hostages} taken hostage by {group} in {city}, {country}. Official channels are unresponsive.',
      'FLASH: {group} has seized {hostages} at a location in {country}. Military is requesting covert options.',
      'Embassy in {country} reports {hostages} missing — now believed held by armed {group} in the {city} region.',
    ],
    fullReports: [
      'INTELLIGENCE BRIEF — OP {codename}\n\nHostages: {hostages}. Held by {group} at confirmed location: {hold_site} outside {city}.\n\nGuard estimate: {guard_count}. Hostage condition: {condition}.\n\nDeadline: {urgency_days} days before {deadline_consequence}.\n\nRecommendation: Rapid assault team deployment. Speed is critical.',
      'INTELLIGENCE BRIEF — OP {codename}\n\nLocation of {hostages} confirmed via SIGINT. Hold site: {hold_site}, {country}.\n\n{group} demands: {demands}. Deadline is firm.\n\nGuard count: {guard_count}. Recommend CQB team — negotiation has been ruled out at this stage.',
    ],
    successMsgs: [
      'All {hostages} recovered alive. {group} holding force neutralized. Exfiltration successful — team and hostages are en route to a secure facility.\n\nInitial medical assessments indicate the hostages are in stable condition. The {city} operation will be cited as a model for rapid-response rescue planning.',
      'Rescue operation complete. {hostages} secured. Minimal casualties. Team extracted safely.\n\nPost-operation debrief with the recovered personnel is scheduled for tomorrow. Their account of the time in captivity will provide significant intelligence on {group}.',
    ],
    failureMsgs: [
      'Assault location was incorrect. Hostages had been moved before the raid. {group} has begun executing threats — {casualty_note}.\n\nIntelligence failure. The SIGINT fix was outdated. A full timeline review has been ordered.',
      'Rescue attempt failed. The alarm was raised early — likely a surveillance sweep we missed. {hostages} status is unknown. Team is taking fire — exfiltration is in progress.\n\nThis mission has shifted to a recovery operation. {casualty_note}.',
    ],
    confSuccess: [14, 22], confFail: [-20, -35],
    vars: {
      hostages: ['3 diplomatic staff', 'a senior official', 'a journalist and 2 aid workers', '5 military advisors', '2 intelligence officers'],
      group: ['an armed militia', 'a terror cell', 'a criminal cartel', 'a separatist group', 'a political faction'],
      hold_site: ['an abandoned factory', 'a fortified farmhouse', 'an urban apartment complex', 'a remote compound'],
      guard_count: ['6 to 8 armed guards', '12 or more militants', '4 to 6 personnel'],
      condition: ['alive, unharmed', 'alive, one injured', 'status unknown — likely alive'],
      deadline_consequence: ['executions begin', 'hostages are transferred deeper into hostile territory', 'media exposure is threatened'],
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
    staffRange: [5, 15],
    invDepts: ['ANALYSIS', 'HUMINT', 'FOREIGN_OPS'],
    execDepts: ['FOREIGN_OPS', 'HUMINT'],
    opNarrative: 'Foreign Operations activates in-country assets to implement the influence campaign — financial support, media coordination, or liaison with the friendly faction. HUMINT manages the network and ensures operational security. There is no direct-action component. Plausible deniability is the operational imperative. If the operation is traced back, diplomatic consequences will be severe.',
    initialReports: [
      'Political situation in {country} presents an opportunity. A preliminary assessment has been requested.',
      'Opposition elements in {country} have made contact. They are requesting support — nature unclear.',
      'Instability in {country} is growing. A window to influence the political outcome may be opening.',
    ],
    fullReports: [
      'INTELLIGENCE BRIEF — OP {codename}\n\nTarget nation: {country}. Objective: {regime_objective}.\n\nOpportunity: {opportunity_detail}\n\nKey assets: {key_assets}.\n\nRisk of attribution: {attribution_risk}.\n\nTimeline for influence window: {urgency_days} days.\n\nRecommend covert support operation.',
      'INTELLIGENCE BRIEF — OP {codename}\n\nOperation objective: {regime_objective} in {country}.\n\n{opportunity_detail}\n\nAssets in-country: {key_assets}. Attribution risk: {attribution_risk}.\n\nRecommended approach: {method}.',
    ],
    successMsgs: [
      'Operation achieved objectives in {country}. {regime_outcome}. Attribution: none confirmed.\n\nThe operation has been one of our cleaner successes this cycle. The in-country network performed well. Our hand is not visible in the outcome.',
      'Covert influence operation successful. {regime_outcome}. Regional stability has improved.\n\nThe allied assessment of the outcome is highly positive. This operation has strengthened relationships with key regional contacts.',
    ],
    failureMsgs: [
      'Operation compromised. {country} government is publicly blaming foreign interference. Diplomatic fallout is imminent.\n\nThe attribution trail is thin but traceable. Foreign Affairs has been briefed. Expect a difficult period with {country} for the foreseeable future.',
      'Assets burned. {country} security services have rolled up our in-country network. Objectives not achieved.\n\nYears of patient asset development have been lost. A full damage assessment will take months. The setback to our {country} program is severe.',
    ],
    confSuccess: [8, 16], confFail: [-12, -22],
    vars: {
      regime_objective: ['support a pro-Western political transition', 'destabilize a hostile government\'s economic programs', 'influence upcoming elections toward a friendly candidate', 'support a dissident movement'],
      opportunity_detail: ['A pivotal election is approaching and key officials are approachable.', 'An economic crisis has weakened the government\'s grip on power.', 'Military leadership is fractured — a faction has signaled willingness to cooperate.'],
      key_assets: ['two mid-level officials', 'a media figure with national reach', 'a military contact in the inner circle'],
      attribution_risk: ['LOW — operation is well-covered', 'MODERATE — some exposure possible', 'HIGH — proceed with extreme caution'],
      method: ['financial support to opposition media', 'coordination with a friendly military faction', 'disinformation seeding through proxies'],
      regime_outcome: ['A favorable political shift has occurred', 'Opposition now controls key ministries', 'Government economic programs have been disrupted'],
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
    staffRange: [10, 30],
    invDepts: ['ANALYSIS', 'HUMINT', 'SIGINT', 'COUNTER_INTEL'],
    execDepts: ['FIELD_OPS', 'SPECIAL_OPS', 'COUNTER_INTEL'],
    opNarrative: 'Field Operations establishes rolling surveillance on the target. Counter-Intelligence runs interference against any security detail or counter-surveillance measures. When the optimal window opens — a moment of exposure, a predictable routine, a known location — the team moves. Either a quiet arrest in a controlled environment or a clean neutralization. The goal is zero public exposure.',
    initialReports: [
      'Tip indicates a foreign intelligence officer operating on domestic soil under diplomatic cover. Unverified.',
      'HUMINT suggests {hvt_role} has slipped into the country. Location: possibly {city}. Details unknown.',
      'Border surveillance has flagged an individual matching the profile of {hvt_role} "{alias}". Currently at large.',
    ],
    fullReports: [
      'INTELLIGENCE BRIEF — OP {codename}\n\nTarget "{alias}" — {hvt_role} — confirmed active in {city}.\n\nBackground: {hvt_bg}\n\nCurrent activity: {current_activity}.\n\nSecurity profile: {security}.\n\nRecommendation: Apprehend or neutralize before the target completes their objective and exits the country.',
      'INTELLIGENCE BRIEF — OP {codename}\n\n{hvt_role} "{alias}" identified in {city}. {hvt_bg}\n\nConfirmed conducting: {current_activity}.\n\nSecurity: {security}. Window: {urgency_days} days.\n\nRecommend immediate field operation.',
    ],
    successMsgs: [
      'Target "{alias}" apprehended in {city}. Found in possession of {seized_material}. A significant intelligence haul.\n\nThe subject is cooperating. Early debrief suggests the operation was part of a larger program — follow-up intelligence requests have been submitted to allied services.',
      'HVT neutralized. "{alias}" no longer poses a threat. Operation conducted with full deniability.\n\nPost-action sweep recovered {seized_material}. The target\'s handler has gone to ground — a follow-up surveillance operation has been recommended.',
    ],
    failureMsgs: [
      '"{alias}" evaded capture in {city}. Target is believed to have exited the country via {exfil}. Objective not achieved.\n\nThe operation window closed before we were in position. A request for allied border monitoring has been submitted.',
      'Operation blown. "{alias}" alerted by an unknown leak. Target escaped. Diplomatic immunity has been invoked by {country}.\n\nThis is a significant setback. The target\'s activities during their time in-country remain partially unaccounted for. A full damage assessment is in progress.',
    ],
    confSuccess: [10, 16], confFail: [-12, -20],
    vars: {
      hvt_role: ['a foreign intelligence officer', 'a known saboteur', 'a fugitive wanted for terrorism', 'a technology thief', 'a hostile state recruiter'],
      hvt_bg: ['Subject is responsible for recruiting domestic assets for a hostile foreign service.', 'Subject is conducting industrial espionage on critical defense technology.', 'Subject has active ties to domestic extremist networks.'],
      current_activity: ['talent recruitment operations', 'technical collection against defense programs', 'meeting with domestic extremist contacts', 'mapping critical infrastructure'],
      security: ['none — operating alone', 'minimal counter-surveillance measures', 'backed by an embassy security team'],
      seized_material: ['classified documents', 'a list of recruited assets', 'technical schematics', 'encryption devices'],
      exfil: ['commercial flight', 'a diplomatic vehicle', 'the northern border'],
      country: ['Russia', 'China', 'Iran', 'North Korea'],
    }
  },
};

// =============================================================================
// GAME STATE
// =============================================================================

let G = {
  country: null, cfg: null,
  day: 1, budget: 0, staffUsed: 0, staffTotal: 0, confidence: 0,
  missions: [], depts: {}, log: [],
  selected: null, opsCompleted: 0, opsSucceeded: 0,
  missionIdCounter: 0, usedCodenames: new Set(), nextSpawnDay: 1,
};

// =============================================================================
// UTILITIES
// =============================================================================

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function fmt(n) { return G.cfg ? `${G.cfg.currencySymbol}${n}M` : `$${n}M`; }
function week() { return Math.ceil(G.day / 7); }

function fillTemplate(tpl, vars) {
  return tpl.replace(/\{(\w+)\}/g, (_, key) => {
    if (key === 'city') return vars._city || '—';
    if (key === 'country') return vars._country || '—';
    if (key === 'codename') return vars._codename || '—';
    if (key === 'urgency_days') return vars._urgency || '—';
    if (vars[key]) return pick(vars[key]);
    return `[${key}]`;
  });
}

function generateCodename() {
  for (let i = 0; i < 100; i++) {
    const c = `${pick(CODENAME_ADJ)} ${pick(CODENAME_NOUN)}`;
    if (!G.usedCodenames.has(c)) { G.usedCodenames.add(c); return c; }
  }
  return `OP ${G.missionIdCounter}`;
}

// =============================================================================
// GAME INITIALIZATION
// =============================================================================

function initDepts() {
  const depts = {};
  for (const d of DEPT_CONFIG) {
    depts[d.id] = { ...d, busy: false, busyType: null, busyMissionId: null, busyDaysLeft: 0 };
  }
  return depts;
}

function startGame(countryCode) {
  const cfg = COUNTRIES[countryCode];
  if (!cfg) return;
  G = {
    country: countryCode, cfg,
    day: 1, budget: cfg.budget, staffUsed: 0, staffTotal: cfg.staff, confidence: cfg.confidence,
    missions: [], depts: initDepts(), log: [],
    selected: null, opsCompleted: 0, opsSucceeded: 0,
    missionIdCounter: 0, usedCodenames: new Set(), nextSpawnDay: 1,
  };
  showScreen('game');
  spawnMission();
  if (Math.random() < 0.7) spawnMission();
  addLog(`Agency ${cfg.acronym} operational. Day 1.`, 'log-info');
  addLog(`${cfg.leaderFormal} expects results. Good luck, Director.`, 'log-info');
  render();
}

function restartGame() { G.country = null; showScreen('select'); }

// =============================================================================
// MISSION GENERATION
// =============================================================================

function spawnMission(forcedType) {
  const inbox = G.missions.filter(m => ['INCOMING','INVESTIGATING','READY'].includes(m.status));
  if (inbox.length >= 6) return;
  const typeId = forcedType || pick(Object.keys(MISSION_TYPES));
  const tmpl = MISSION_TYPES[typeId];
  if (!tmpl) return;

  const codename = generateCodename();
  const urgency = randInt(...tmpl.urgencyRange);
  const threat = randInt(...tmpl.threatRange);
  const invDays = randInt(...tmpl.invDaysRange);
  const execDays = randInt(...tmpl.execDaysRange);
  const baseBudget = randInt(...tmpl.budgetRange);
  const baseStaff = randInt(...tmpl.staffRange);

  let cityName, countryName;
  if (tmpl.location === 'DOMESTIC') {
    cityName = pick(G.cfg.domesticCities);
    countryName = G.cfg.name;
  } else {
    const loc = pick(FOREIGN_CITIES);
    cityName = loc.city; countryName = loc.country;
  }

  const fillVars = { ...tmpl.vars, _city: cityName, _country: countryName, _codename: codename, _urgency: String(urgency) };
  const initialReport = fillTemplate(pick(tmpl.initialReports), fillVars);
  const fullReport = fillTemplate(pick(tmpl.fullReports), fillVars);

  const mission = {
    id: `M${++G.missionIdCounter}`,
    typeId, codename, threat,
    label: tmpl.label, category: tmpl.category, location: tmpl.location,
    city: cityName, country: countryName,
    urgency, urgencyLeft: urgency,
    invDays, execDays, baseBudget, baseStaff,
    invDepts: tmpl.invDepts, execDepts: tmpl.execDepts,
    opNarrative: tmpl.opNarrative || '',
    initialReport, fullReport,
    successMsgs: tmpl.successMsgs, failureMsgs: tmpl.failureMsgs,
    confSuccess: tmpl.confSuccess, confFail: tmpl.confFail,
    fillVars,
    status: 'INCOMING',
    assignedInvDept: null, invDaysLeft: 0,
    assignedBudget: 0, assignedStaff: 0, assignedExecDepts: [],
    execDaysLeft: 0, successProb: 0,
    resultMsg: '', confDelta: 0, budgetDelta: 0,
    dayReceived: G.day,
  };

  G.missions.unshift(mission);
  addLog(`New mission received: OP ${codename} [${tmpl.label}]`);
  G.nextSpawnDay = G.day + randInt(3, 8);
}

// =============================================================================
// DAY ADVANCEMENT
// =============================================================================

function advanceDay() {
  G.day++;

  for (const m of G.missions) {
    if (m.status === 'INCOMING' || m.status === 'READY') {
      m.urgencyLeft = Math.max(0, m.urgencyLeft - 1);
      if (m.urgencyLeft === 0) expireMission(m);
    }
    if (m.status === 'INVESTIGATING') {
      m.invDaysLeft = Math.max(0, m.invDaysLeft - 1);
      m.urgencyLeft = Math.max(0, m.urgencyLeft - 1);
      if (m.invDaysLeft === 0) {
        completeInvestigation(m);
      } else if (m.urgencyLeft === 0) {
        expireMission(m);
        freeDept(m.assignedInvDept, m.id);
      }
    }
    if (m.status === 'EXECUTING') {
      m.execDaysLeft = Math.max(0, m.execDaysLeft - 1);
      if (m.execDaysLeft === 0) resolveOperation(m);
    }
  }

  if (G.day % 7 === 0) {
    const drain = -2;
    G.confidence = clamp(G.confidence + drain, 0, 100);
    G.budget = Math.min(G.budget + G.cfg.weeklyBudgetRegen, G.cfg.budget);
    addLog(`Weekly briefing: Confidence ${drain}%. Budget regenerated +${fmt(G.cfg.weeklyBudgetRegen)}.`, 'log-warn');
  }

  if (G.day >= G.nextSpawnDay) {
    if (Math.random() < 0.6) spawnMission();
    G.nextSpawnDay = G.day + randInt(3, 7);
  }

  checkGameOver();
  render();

  if (G.selected && !getMission(G.selected)) G.selected = null;
}

function completeInvestigation(m) {
  m.status = 'READY';
  freeDept(m.assignedInvDept, m.id);
  addLog(`Investigation complete: OP ${m.codename} — Intel brief ready.`, 'log-info');
}

function expireMission(m) {
  m.status = 'EXPIRED';
  const confHit = -randInt(5, 12);
  G.confidence = clamp(G.confidence + confHit, 0, 100);
  addLog(`MISSION EXPIRED: OP ${m.codename}. Confidence ${confHit}%.`, 'log-fail');
}

function resolveOperation(m) {
  const roll = Math.random() * 100;
  const success = roll <= m.successProb;

  G.staffUsed = Math.max(0, G.staffUsed - m.assignedStaff);
  G.opsCompleted++;

  // Free all deployed departments
  for (const did of m.assignedExecDepts || []) {
    freeDept(did, m.id);
  }

  if (success) {
    m.status = 'SUCCESS';
    const confGain = randInt(...m.confSuccess);
    const budgetReturn = Math.floor(m.assignedBudget * 0.1);
    G.confidence = clamp(G.confidence + confGain, 0, 100);
    if (budgetReturn > 0) G.budget = Math.min(G.budget + budgetReturn, 999);
    m.confDelta = confGain; m.budgetDelta = budgetReturn;
    m.resultMsg = fillTemplate(pick(m.successMsgs), m.fillVars);
    G.opsSucceeded++;
    addLog(`SUCCESS: OP ${m.codename}. +${confGain}% confidence.`, 'log-success');
  } else {
    m.status = 'FAILURE';
    const confLoss = randInt(...m.confFail);
    G.confidence = clamp(G.confidence + confLoss, 0, 100);
    m.confDelta = confLoss; m.budgetDelta = 0;
    m.resultMsg = fillTemplate(pick(m.failureMsgs), m.fillVars);
    addLog(`FAILURE: OP ${m.codename}. ${confLoss}% confidence.`, 'log-fail');
  }
}

// =============================================================================
// DEPARTMENT MANAGEMENT
// =============================================================================

function freeDept(deptId, missionId) {
  const d = G.depts[deptId];
  if (d && d.busyMissionId === missionId) {
    d.busy = false; d.busyType = null; d.busyMissionId = null;
  }
}

function assignDeptDeployed(deptId, missionId) {
  const d = G.depts[deptId];
  if (d && !d.busy) {
    d.busy = true; d.busyType = 'DEPLOYED'; d.busyMissionId = missionId;
  }
}

// =============================================================================
// MISSION MANAGEMENT ACTIONS
// =============================================================================

function selectMission(id) { G.selected = id; render(); }

function assignInvestigation(missionId, deptId) {
  const m = getMission(missionId);
  const dept = G.depts[deptId];
  if (!m || !dept) return;
  if (dept.busy) { addLog(`${dept.name} is currently assigned. Choose another.`, 'log-warn'); render(); return; }
  if (!m.invDepts.includes(deptId)) { addLog(`${dept.name} cannot investigate this mission type.`, 'log-warn'); render(); return; }

  m.status = 'INVESTIGATING';
  m.assignedInvDept = deptId;
  m.invDaysLeft = m.invDays;
  dept.busy = true; dept.busyType = 'INVESTIGATING'; dept.busyMissionId = missionId;

  addLog(`${dept.name} assigned to investigate OP ${m.codename}. Est. ${m.invDays} days.`, 'log-info');
  render();
}

function archiveMission(missionId) {
  const m = getMission(missionId);
  if (!m) return;
  G.missions = G.missions.filter(x => x.id !== missionId);
  G.selected = null;
  render();
}

function dismissMission(missionId) {
  const m = getMission(missionId);
  if (!m) return;
  if (m.status === 'INVESTIGATING') freeDept(m.assignedInvDept, missionId);
  const confHit = m.threat >= 4 ? -randInt(5, 10) : 0;
  if (confHit < 0) {
    G.confidence = clamp(G.confidence + confHit, 0, 100);
    addLog(`OP ${m.codename} dismissed. Confidence ${confHit}%.`, 'log-warn');
  } else {
    addLog(`OP ${m.codename} dismissed.`);
  }
  G.missions = G.missions.filter(x => x.id !== missionId);
  G.selected = null;
  render();
}

function openOperationModal(missionId) {
  const m = getMission(missionId);
  if (!m) return;

  const minBudget = Math.max(1, Math.floor(m.baseBudget * 0.5));
  const maxBudget = Math.min(G.budget, m.baseBudget * 2);
  const defBudget = Math.min(G.budget, m.baseBudget);
  const minStaff = Math.max(1, Math.floor(m.baseStaff * 0.5));
  const maxStaff = Math.min(G.staffTotal - G.staffUsed, m.baseStaff * 2);
  const defStaff = Math.min(maxStaff, m.baseStaff);

  if (maxBudget < minBudget) {
    addLog(`Insufficient budget for OP ${m.codename}. Need at least ${fmt(minBudget)}.`, 'log-warn');
    render(); return;
  }
  if (maxStaff < minStaff) {
    addLog(`Insufficient available staff for OP ${m.codename}.`, 'log-warn');
    render(); return;
  }

  let selectedDepts = [];
  for (const did of m.execDepts) {
    if (!G.depts[did].busy) { selectedDepts = [did]; break; }
  }

  const calcProb = (budget, staff, depts) => {
    let p = 40;
    p += Math.round(clamp((budget - minBudget) / Math.max(1, m.baseBudget - minBudget), 0, 1) * 25);
    p += Math.round(clamp((staff - minStaff) / Math.max(1, m.baseStaff - minStaff), 0, 1) * 20);
    p += depts.filter(d => m.execDepts.includes(d)).length * 8;
    return clamp(p, 10, 92);
  };

  const deptRows = m.execDepts.map(did => {
    const dept = G.depts[did];
    const avail = !dept.busy;
    return `<div class="modal-dept-check ${selectedDepts.includes(did) ? 'selected' : ''} ${avail ? '' : 'unavail'}"
      data-dept="${did}" onclick="toggleExecDept('${did}', '${missionId}')"
      data-tip="${DEPT_CONFIG.find(d=>d.id===did)?.tip || ''}">
      <span class="modal-dept-check-name">${dept.short}</span>
      <span class="modal-dept-check-status" style="color:var(--accent);font-size:9px">REC</span>
      <span class="modal-dept-check-status" style="color:${avail ? 'var(--green)' : 'var(--red)'}">${avail ? 'AVAIL' : 'BUSY'}</span>
    </div>`;
  }).join('');

  const otherDepts = DEPT_CONFIG.filter(d => !m.execDepts.includes(d.id)).map(d => {
    const dept = G.depts[d.id];
    const avail = !dept.busy;
    return `<div class="modal-dept-check ${selectedDepts.includes(d.id) ? 'selected' : ''}"
      data-dept="${d.id}" onclick="toggleExecDept('${d.id}', '${missionId}')"
      data-tip="${d.tip}">
      <span class="modal-dept-check-name">${dept.short}</span>
      <span class="modal-dept-check-status" style="color:${avail ? 'var(--text-dim)' : 'var(--red)'}; font-size:9px;">${avail ? 'OPT' : 'BUSY'}</span>
    </div>`;
  }).join('');

  const initProb = calcProb(defBudget, defStaff, selectedDepts);

  document.getElementById('modal-title').textContent = `OP ${m.codename} — CONFIGURE OPERATION`;
  document.getElementById('modal-body').innerHTML = `
    <div class="modal-section">
      <div class="modal-section-title">OPERATION PLAN</div>
      <div class="op-narrative">${m.opNarrative}</div>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">ALLOCATED RESOURCES</div>
      <div style="font-size:11px;color:var(--text-dim);margin-bottom:10px">
        Minimum: ${fmt(minBudget)} / ${minStaff} agents. Recommended: ${fmt(m.baseBudget)} / ${m.baseStaff} agents. More resources = higher success probability.
      </div>
      <div class="modal-slider-row">
        <label>BUDGET</label>
        <input type="range" id="op-budget" min="${minBudget}" max="${maxBudget}" value="${defBudget}"
          oninput="updateModalProb('${missionId}')"
          data-tip="Set the operational budget. More funding improves success probability. Available: ${fmt(G.budget)}">
        <span class="modal-slider-val" id="op-budget-val">${fmt(defBudget)}</span>
      </div>
      <div class="modal-slider-row">
        <label>STAFF</label>
        <input type="range" id="op-staff" min="${minStaff}" max="${maxStaff}" value="${defStaff}"
          oninput="updateModalProb('${missionId}')"
          data-tip="Number of agents to deploy. More staff improves success probability. Available: ${G.staffTotal - G.staffUsed}">
        <span class="modal-slider-val" id="op-staff-val">${defStaff} agents</span>
      </div>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">RECOMMENDED DEPARTMENTS <span style="font-size:9px;color:var(--text-dim)">(each adds +8% success)</span></div>
      <div class="modal-dept-grid">${deptRows}</div>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">OPTIONAL SUPPORT</div>
      <div class="modal-dept-grid">${otherDepts}</div>
    </div>
    <div class="modal-section">
      <div class="prob-display" data-tip="Estimated probability of mission success based on resources and department assignments. Higher is better.">
        <div class="prob-label">ESTIMATED SUCCESS PROBABILITY</div>
        <div class="prob-value ${initProb >= 70 ? 'prob-high' : initProb >= 45 ? 'prob-med' : 'prob-low'}" id="op-prob-wrap">
          <span id="op-prob">${initProb}%</span>
        </div>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-primary" onclick="executeOperation('${missionId}')">EXECUTE OPERATION</button>
      <button class="btn-neutral" onclick="hideModal()">CANCEL</button>
    </div>
  `;

  window._currentOpMission = missionId;
  window._currentOpSelectedDepts = selectedDepts;
  showModal();
}

window.toggleExecDept = function(deptId, missionId) {
  const arr = window._currentOpSelectedDepts;
  const idx = arr.indexOf(deptId);
  if (idx >= 0) arr.splice(idx, 1); else arr.push(deptId);
  document.querySelectorAll('.modal-dept-check').forEach(el => {
    if (el.dataset.dept === deptId) el.classList.toggle('selected', arr.includes(deptId));
  });
  window.updateModalProb(missionId);
};

window.updateModalProb = function(missionId) {
  const m = getMission(missionId);
  if (!m) return;
  const bi = document.getElementById('op-budget');
  const si = document.getElementById('op-staff');
  if (!bi || !si) return;
  const b = parseInt(bi.value), s = parseInt(si.value);
  const bv = document.getElementById('op-budget-val');
  const sv = document.getElementById('op-staff-val');
  if (bv) bv.textContent = fmt(b);
  if (sv) sv.textContent = `${s} agents`;
  const minBudget = Math.max(1, Math.floor(m.baseBudget * 0.5));
  const minStaff = Math.max(1, Math.floor(m.baseStaff * 0.5));
  let p = 40;
  p += Math.round(clamp((b - minBudget) / Math.max(1, m.baseBudget - minBudget), 0, 1) * 25);
  p += Math.round(clamp((s - minStaff) / Math.max(1, m.baseStaff - minStaff), 0, 1) * 20);
  p += (window._currentOpSelectedDepts || []).filter(d => m.execDepts.includes(d)).length * 8;
  p = clamp(p, 10, 92);
  const probEl = document.getElementById('op-prob');
  const probWrap = document.getElementById('op-prob-wrap');
  if (probEl) probEl.textContent = `${p}%`;
  if (probWrap) probWrap.className = 'prob-value ' + (p >= 70 ? 'prob-high' : p >= 45 ? 'prob-med' : 'prob-low');
};

window.executeOperation = function(missionId) {
  const m = getMission(missionId);
  if (!m) return;
  const bi = document.getElementById('op-budget');
  const si = document.getElementById('op-staff');
  const budget = bi ? parseInt(bi.value) : m.baseBudget;
  const staff = si ? parseInt(si.value) : m.baseStaff;
  const depts = window._currentOpSelectedDepts || [];

  if (G.budget < budget) { addLog('Insufficient budget.', 'log-warn'); hideModal(); render(); return; }
  if (G.staffTotal - G.staffUsed < staff) { addLog('Insufficient available staff.', 'log-warn'); hideModal(); render(); return; }

  G.budget -= budget;
  G.staffUsed += staff;

  const minBudget = Math.max(1, Math.floor(m.baseBudget * 0.5));
  const minStaff = Math.max(1, Math.floor(m.baseStaff * 0.5));
  let p = 40;
  p += Math.round(clamp((budget - minBudget) / Math.max(1, m.baseBudget - minBudget), 0, 1) * 25);
  p += Math.round(clamp((staff - minStaff) / Math.max(1, m.baseStaff - minStaff), 0, 1) * 20);
  p += depts.filter(d => m.execDepts.includes(d)).length * 8;
  m.successProb = clamp(p, 10, 92);

  m.status = 'EXECUTING';
  m.execDaysLeft = m.execDays;
  m.assignedBudget = budget;
  m.assignedStaff = staff;
  m.assignedExecDepts = depts;

  // Mark assigned departments as DEPLOYED
  for (const did of depts) assignDeptDeployed(did, missionId);

  addLog(`OP ${m.codename} launched. ${fmt(budget)} allocated. ${staff} agents deployed. ETA ${m.execDays} days.`, 'log-info');
  hideModal();
  G.selected = m.id;
  render();
};

// =============================================================================
// GAME OVER
// =============================================================================

function checkGameOver() {
  if (G.confidence <= 0) {
    triggerGameOver('DISMISSED', `${G.cfg.leaderFormal} has lost confidence in your leadership. You have been relieved of command.`);
  } else if (G.budget <= 0 && G.day % 7 === 0) {
    triggerGameOver('DEFUNDED', 'The agency has been defunded. Without resources, operations cannot continue.');
  }
}

function triggerGameOver(title, msg) {
  document.getElementById('go-title').textContent = title;
  document.getElementById('go-message').textContent = msg;
  document.getElementById('go-stats').innerHTML = `
    <div class="go-stat"><span class="go-stat-val">${G.day}</span><span class="go-stat-lbl">DAYS</span></div>
    <div class="go-stat"><span class="go-stat-val">${G.opsSucceeded}</span><span class="go-stat-lbl">SUCCESSES</span></div>
    <div class="go-stat"><span class="go-stat-val">${G.opsCompleted}</span><span class="go-stat-lbl">OPERATIONS</span></div>
    <div class="go-stat"><span class="go-stat-val">${G.confidence}%</span><span class="go-stat-lbl">FINAL CONF.</span></div>
  `;
  showScreen('gameover');
}

// =============================================================================
// LOGGING
// =============================================================================

function addLog(text, cls = '') {
  G.log.unshift({ text: `D${G.day}: ${text}`, cls });
  if (G.log.length > 50) G.log.pop();
}

// =============================================================================
// RENDERING
// =============================================================================

function getMission(id) { return G.missions.find(m => m.id === id) || null; }

function render() {
  renderHeader();
  renderInbox();
  renderDetail();
  renderDepts();
  renderActiveOps();
  renderLog();
}

function renderHeader() {
  document.getElementById('hdr-agency').textContent = G.cfg ? `${G.cfg.acronym} — ${G.cfg.agency}` : '—';
  document.getElementById('hdr-date').textContent = `DAY ${G.day} · WEEK ${week()} · ${G.cfg ? G.cfg.leaderTitle.toUpperCase() : ''}`;

  const confPct = G.confidence;
  const bar = document.getElementById('conf-bar');
  if (bar) {
    bar.style.width = `${confPct}%`;
    bar.style.background = confPct >= 60 ? 'var(--green)' : confPct >= 35 ? 'var(--amber)' : 'var(--red)';
  }
  document.getElementById('res-conf').textContent = `${confPct}%`;
  document.getElementById('res-budget').textContent = fmt(G.budget);
  document.getElementById('res-staff').textContent = `${G.staffUsed} / ${G.staffTotal}`;

  // Attach tooltips to header resource groups
  const confGroup = document.getElementById('res-conf')?.closest('.res-group');
  if (confGroup) confGroup.dataset.tip = `Your standing with ${G.cfg?.leaderTitle || 'your leader'}. Falls 2% each week. Plummets after failures or expired high-threat missions. Hit 0% and you are dismissed.`;

  const budgetGroup = document.getElementById('res-budget')?.closest('.res-group');
  if (budgetGroup) budgetGroup.dataset.tip = `Available operational budget. Spent when launching operations. Regenerates ${fmt(G.cfg?.weeklyBudgetRegen || 0)} per week up to the starting amount. Running dry for a full week ends your tenure.`;

  const staffGroup = document.getElementById('res-staff')?.closest('.res-group');
  if (staffGroup) staffGroup.dataset.tip = `Agents currently deployed / total available. Staff is committed for the duration of active operations and returns when the operation concludes.`;

  const advBtn = document.getElementById('btn-advance');
  if (advBtn) advBtn.dataset.tip = 'Advance time by one day. Investigations and operations progress. New missions may appear.\nKeyboard shortcut: → or N';
}

function renderInbox() {
  const inbox = G.missions.filter(m => !['EXECUTING','SUCCESS','FAILURE','ARCHIVED'].includes(m.status));
  document.getElementById('inbox-count').textContent = inbox.length;
  const el = document.getElementById('mission-inbox');

  if (inbox.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:24px;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);opacity:0.5">NO PENDING MISSIONS</div>';
    return;
  }

  const statusTips = {
    INCOMING: 'Initial report received. Select and assign a department to investigate — this unlocks the full intelligence brief.',
    INVESTIGATING: 'A department is working this case. Advance days to let the investigation complete.',
    READY: 'Full intelligence brief is available. Open this mission to approve or archive the operation.',
    EXPIRED: 'Mission window has passed. No action was taken — a confidence penalty may have been applied.',
  };

  el.innerHTML = inbox.map(m => {
    const isSelected = G.selected === m.id;
    const daysLeft = m.urgencyLeft;
    const deadlineCls = daysLeft <= 2 ? 'urgent' : daysLeft <= 5 ? 'warn' : '';
    const statusLabels = {
      INCOMING: '<span class="mc-status status-incoming" data-tip="Initial intel only. Investigation needed.">INCOMING</span>',
      INVESTIGATING: '<span class="mc-status status-investigating" data-tip="Department assigned, advancing investigation.">INVESTIGATING</span>',
      READY: '<span class="mc-status status-ready" data-tip="Full brief available. Review and decide.">BRIEF READY</span>',
      EXPIRED: '<span class="mc-status status-expired" data-tip="Deadline passed. No action taken.">EXPIRED</span>',
    };
    const deadlineTip = daysLeft <= 2 ? 'CRITICAL — this mission expires very soon. Act or it is gone.' : daysLeft <= 5 ? 'Warning — deadline approaching.' : `${daysLeft} days remaining until the mission window closes.`;
    return `<div class="mission-card threat-${m.threat} ${isSelected ? 'selected' : ''}"
      onclick="selectMission('${m.id}')"
      data-tip="${statusTips[m.status] || ''}">
      <div class="mc-type">${m.category}</div>
      <div class="mc-codename">OP ${m.codename}</div>
      <div class="mc-meta">
        ${statusLabels[m.status] || ''}
        <span class="mc-deadline ${deadlineCls}" data-tip="${deadlineTip}">${daysLeft}d LEFT</span>
      </div>
    </div>`;
  }).join('');
}

function renderDetail() {
  const detailEl = document.getElementById('mission-detail');
  const titleEl = document.getElementById('detail-panel-title');
  const chipEl = document.getElementById('detail-status-chip');

  if (!G.selected) {
    titleEl.textContent = 'BRIEFING ROOM';
    chipEl.textContent = ''; chipEl.className = 'detail-status-chip';
    detailEl.innerHTML = `<div class="detail-empty">
      <div class="empty-icon">◈</div>
      <div class="empty-title">AWAITING SELECTION</div>
      <div class="empty-sub">Select a mission from the inbox to review its intelligence brief.</div>
    </div>`;
    return;
  }

  const m = getMission(G.selected);
  if (!m) { G.selected = null; renderDetail(); return; }

  titleEl.textContent = `OP ${m.codename}`;

  const statusMap = {
    INCOMING: ['INCOMING', 'status-incoming'],
    INVESTIGATING: ['INVESTIGATING', 'status-investigating'],
    READY: ['BRIEF READY', 'status-ready'],
    EXECUTING: ['EXECUTING', 'status-executing'],
    SUCCESS: ['SUCCESS', 'status-success'],
    FAILURE: ['FAILURE', 'status-failure'],
    EXPIRED: ['EXPIRED', 'status-expired'],
  };
  const [sl, sc] = statusMap[m.status] || ['—', ''];
  chipEl.textContent = sl; chipEl.className = `detail-status-chip mc-status ${sc}`;

  const threatLabel = m.threat >= 5 ? 'CRITICAL' : m.threat >= 4 ? 'HIGH' : m.threat >= 3 ? 'MODERATE' : 'LOW';
  const threatCls = m.threat >= 4 ? 'threat-high' : m.threat >= 3 ? 'threat-med' : 'threat-low';
  const locCls = m.location === 'FOREIGN' ? 'location-foreign' : 'location-domestic';
  const threatTip = `Threat level ${m.threat}/5. ${m.threat >= 4 ? 'Failure will significantly damage confidence. Dismissing this without acting also carries a penalty.' : 'Moderate consequences for failure.'}`;

  let content = `
    <div class="dc-header">
      <div class="dc-codename">OP ${m.codename}</div>
      <div class="dc-meta-row">
        <span class="dc-badge">${m.category}</span>
        <span class="dc-badge ${threatCls}" data-tip="${threatTip}">THREAT: ${threatLabel}</span>
        <span class="dc-badge ${locCls}" data-tip="${m.location === 'FOREIGN' ? 'Foreign operation — requires Foreign Operations or Special Operations.' : 'Domestic operation — Field Operations and Special Ops are the primary executors.'}">${m.location === 'FOREIGN' ? `${m.city}, ${m.country}` : `${m.city} [DOMESTIC]`}</span>
        <span class="dc-badge" data-tip="Days remaining until this mission's window expires."">DEADLINE: ${m.urgencyLeft}d</span>
      </div>
    </div>
  `;

  if (m.status === 'INCOMING') {
    content += `
      <div class="dc-section">
        <div class="dc-section-title">INITIAL INTELLIGENCE REPORT</div>
        <div class="dc-report">${m.initialReport}</div>
      </div>
      <div class="dc-section">
        <div class="dc-section-title">ASSIGN DEPARTMENT TO INVESTIGATE</div>
        <div style="font-size:12px;color:var(--text-dim);margin-bottom:8px;">
          Assign a department to conduct an in-depth investigation. Estimated duration: ${m.invDays} days. The department will be occupied until the investigation completes.
        </div>
        <div class="dc-dept-grid">
          ${m.invDepts.map(did => {
            const dept = G.depts[did];
            const avail = !dept.busy;
            const cfg = DEPT_CONFIG.find(d => d.id === did);
            return `<button class="dc-dept-btn" ${avail ? '' : 'disabled'}
              onclick="assignInvestigation('${m.id}','${did}')"
              data-tip="${cfg?.tip || ''}${avail ? '' : '\n\n[Currently occupied — unavailable]'}">
              ${dept.short}${avail ? '' : ' [BUSY]'}
            </button>`;
          }).join('')}
        </div>
      </div>
      <div class="dc-actions">
        <button class="btn-danger" onclick="dismissMission('${m.id}')"
          data-tip="${m.threat >= 4 ? 'WARNING: Dismissing a high-threat mission carries a confidence penalty.' : 'Archive this mission without taking action. Low-threat missions can be safely dismissed.'}">
          DISMISS / ARCHIVE
        </button>
      </div>
    `;
  } else if (m.status === 'INVESTIGATING') {
    const progress = Math.round(((m.invDays - m.invDaysLeft) / m.invDays) * 100);
    content += `
      <div class="dc-section">
        <div class="dc-section-title">INITIAL INTELLIGENCE REPORT</div>
        <div class="dc-report">${m.initialReport}</div>
      </div>
      <div class="dc-section">
        <div class="dc-section-title">INVESTIGATION IN PROGRESS</div>
        <div style="font-size:12px;color:var(--text-dim);margin-bottom:8px;">
          <strong>${G.depts[m.assignedInvDept]?.name || '—'}</strong> is working the case. ${m.invDaysLeft} day(s) remaining. Advance the day to progress the investigation.
        </div>
        <div class="progress-wrap">
          <div class="progress-fill" style="width:${progress}%;background:var(--accent)"></div>
        </div>
        <div style="margin-top:8px;font-size:11px;color:var(--text-dim)">
          The full intelligence brief will be unlocked when the investigation completes.
        </div>
      </div>
    `;
  } else if (m.status === 'READY') {
    content += `
      <div class="dc-section">
        <div class="dc-section-title">INTELLIGENCE BRIEF — CLASSIFIED</div>
        <div class="dc-report">${m.fullReport}</div>
      </div>
      <div class="dc-actions">
        <button class="btn-primary" onclick="openOperationModal('${m.id}')"
          data-tip="Open the operation configuration screen. Set budget, staff, and departments, then execute.">
          APPROVE OPERATION
        </button>
        <button class="btn-danger" onclick="dismissMission('${m.id}')"
          data-tip="${m.threat >= 4 ? 'WARNING: Choosing not to act on a high-threat mission carries a confidence penalty.' : 'Archive this mission. No operation will be launched.'}">
          ARCHIVE — DO NOT ACT
        </button>
      </div>
    `;
  } else if (m.status === 'EXECUTING') {
    const progress = Math.round(((m.execDays - m.execDaysLeft) / m.execDays) * 100);
    const deployedNames = (m.assignedExecDepts || []).map(did => G.depts[did]?.short || did).join(', ') || 'None';
    content += `
      <div class="dc-section">
        <div class="dc-section-title">OPERATION IN PROGRESS</div>
        <div style="font-size:13px;color:var(--purple);margin-bottom:6px;font-family:var(--font-disp);font-weight:600">
          ${m.execDaysLeft} day(s) until operation completion.
        </div>
        <div class="progress-wrap">
          <div class="progress-fill" style="width:${progress}%;background:var(--purple)"></div>
        </div>
      </div>
      <div class="dc-section">
        <div class="dc-section-title">OPERATION DETAILS</div>
        <div style="font-size:12px;line-height:1.7;color:var(--text-dim);font-style:italic">${m.opNarrative}</div>
        <div style="margin-top:12px;font-size:11px;color:var(--text-dim);line-height:1.8">
          Budget committed: <strong style="color:var(--text)">${fmt(m.assignedBudget)}</strong><br>
          Staff deployed: <strong style="color:var(--text)">${m.assignedStaff} agents</strong><br>
          Departments: <strong style="color:var(--text)">${deployedNames}</strong><br>
          Estimated success: <strong style="color:${m.successProb >= 70 ? 'var(--green)' : m.successProb >= 45 ? 'var(--amber)' : 'var(--red)'}">${m.successProb}%</strong>
        </div>
      </div>
    `;
  } else if (m.status === 'SUCCESS') {
    content += `
      <div class="result-box success">
        <div class="result-title">OPERATION SUCCESS</div>
        <div class="result-msg">${m.resultMsg}</div>
        <div class="result-deltas">
          <span class="delta-item delta-pos">CONFIDENCE +${m.confDelta}%</span>
          ${m.budgetDelta > 0 ? `<span class="delta-item delta-pos">BUDGET RECOVERY +${fmt(m.budgetDelta)}</span>` : ''}
        </div>
      </div>
      <div class="dc-actions" style="margin-top:12px">
        <button class="btn-neutral" onclick="archiveMission('${m.id}')">DEBRIEF COMPLETE — ARCHIVE</button>
      </div>
    `;
  } else if (m.status === 'FAILURE') {
    content += `
      <div class="result-box failure">
        <div class="result-title">OPERATION FAILED</div>
        <div class="result-msg">${m.resultMsg}</div>
        <div class="result-deltas">
          <span class="delta-item delta-neg">CONFIDENCE ${m.confDelta}%</span>
        </div>
      </div>
      <div class="dc-actions" style="margin-top:12px">
        <button class="btn-neutral" onclick="archiveMission('${m.id}')">DEBRIEF COMPLETE — ARCHIVE</button>
      </div>
    `;
  } else if (m.status === 'EXPIRED') {
    content += `
      <div class="result-box failure">
        <div class="result-title">MISSION WINDOW CLOSED</div>
        <div class="result-msg">The mission deadline has passed. No action was taken.</div>
      </div>
      <div class="dc-actions" style="margin-top:12px">
        <button class="btn-neutral" onclick="archiveMission('${m.id}')">ARCHIVE</button>
      </div>
    `;
  }

  detailEl.innerHTML = content;
}

function renderDepts() {
  const el = document.getElementById('dept-panel');
  el.innerHTML = DEPT_CONFIG.map(d => {
    const dept = G.depts[d.id];
    const busy = dept.busy;
    const isDeployed = dept.busyType === 'DEPLOYED';
    const busyMission = busy ? getMission(dept.busyMissionId) : null;
    let statusLabel, statusCls, daysInfo = '';

    if (!busy) {
      statusLabel = 'AVAILABLE'; statusCls = 'dept-free';
    } else if (isDeployed) {
      statusLabel = 'DEPLOYED'; statusCls = 'dept-deployed';
      daysInfo = busyMission ? `OP ${busyMission.codename} · ${busyMission.execDaysLeft}d` : '';
    } else {
      statusLabel = 'INVESTIGATING'; statusCls = 'dept-busy';
      daysInfo = busyMission ? `OP ${busyMission.codename} · ${busyMission.invDaysLeft}d` : '';
    }

    const statusTip = !busy
      ? 'Available for assignment.'
      : isDeployed
        ? `Deployed on OP ${busyMission?.codename || '?'}. Will return when the operation concludes.`
        : `Investigating OP ${busyMission?.codename || '?'}. ${busyMission?.invDaysLeft || '?'} day(s) remaining.`;

    return `<div class="dept-card" data-tip="${d.tip}">
      <div class="dept-name">${d.name}</div>
      <div class="dept-desc">${d.desc}</div>
      <div class="dept-status-row">
        <span class="dept-status ${statusCls}" data-tip="${statusTip}">${statusLabel}</span>
        ${daysInfo ? `<span class="dept-assign-days">${daysInfo}</span>` : ''}
      </div>
    </div>`;
  }).join('');
}

function renderActiveOps() {
  const ops = G.missions.filter(m => m.status === 'EXECUTING');
  document.getElementById('active-count').textContent = ops.length;
  const el = document.getElementById('active-ops-panel');
  if (ops.length === 0) {
    el.innerHTML = '<div class="no-ops-msg">No active operations.</div>';
    return;
  }
  el.innerHTML = ops.map(m => {
    const progress = Math.round(((m.execDays - m.execDaysLeft) / m.execDays) * 100);
    return `<div class="active-op-card" onclick="selectMission('${m.id}')" style="cursor:pointer"
      data-tip="Click to view operation details. ${m.execDaysLeft}d remaining. Estimated success: ${m.successProb}%.">
      <div class="aoc-name">OP ${m.codename}</div>
      <div class="aoc-days">${m.execDaysLeft}d remaining · ${m.successProb}% est.</div>
      <div class="progress-wrap" style="margin-top:4px">
        <div class="progress-fill" style="width:${progress}%;background:var(--purple)"></div>
      </div>
    </div>`;
  }).join('');
}

function renderLog() {
  const el = document.getElementById('event-log');
  el.innerHTML = G.log.slice(0, 8).map(e => `<div class="log-entry ${e.cls}">${e.text}</div>`).join('');
}

// =============================================================================
// TOOLTIP SYSTEM
// =============================================================================

function initTooltips() {
  const tip = document.createElement('div');
  tip.id = 'game-tooltip';
  tip.className = 'game-tooltip';
  document.body.appendChild(tip);

  document.addEventListener('mousemove', e => {
    const el = e.target.closest('[data-tip]');
    if (el && el.dataset.tip) {
      tip.textContent = el.dataset.tip;
      tip.classList.add('visible');
      const x = e.clientX + 16;
      const y = e.clientY - 8;
      tip.style.left = '0px'; tip.style.top = '0px'; // reset for measurement
      requestAnimationFrame(() => {
        const tw = tip.offsetWidth, th = tip.offsetHeight;
        tip.style.left = Math.min(x, window.innerWidth - tw - 10) + 'px';
        tip.style.top = Math.max(8, Math.min(y, window.innerHeight - th - 10)) + 'px';
      });
    } else {
      tip.classList.remove('visible');
    }
  });

  document.addEventListener('mouseleave', () => tip.classList.remove('visible'));
}

// =============================================================================
// HELP MODAL
// =============================================================================

function showHelp() {
  document.getElementById('modal-title').textContent = 'DIRECTOR\'S HANDBOOK';
  document.getElementById('modal-body').innerHTML = `
    <div class="help-content">

      <div class="help-section">
        <div class="help-section-title">OVERVIEW</div>
        <p>You are the Director of a covert intelligence agency answering directly to your head of state. Missions arrive as raw, unverified intelligence reports. Your job: investigate them, decide what to do, and execute operations before the window closes.</p>
        <p style="margin-top:8px">Your tenure depends on keeping <strong>Confidence</strong> above zero. Successes earn it. Failures and expired missions cost it. Resources are finite. The threats are not.</p>
      </div>

      <div class="help-section">
        <div class="help-section-title">MISSION FLOW</div>
        <div class="help-flow">
          <div class="help-flow-step"><span class="help-step-num">1</span><div><strong>INCOMING</strong> — A vague initial report lands on your desk. Assign a department to investigate and unlock the full intelligence brief.</div></div>
          <div class="help-flow-step"><span class="help-step-num">2</span><div><strong>INVESTIGATING</strong> — The assigned department works the case. Advance days to let it complete. The department is occupied and unavailable during this time.</div></div>
          <div class="help-flow-step"><span class="help-step-num">3</span><div><strong>BRIEF READY</strong> — Full classified intelligence is unlocked. Review it and decide: approve the operation, or archive and do nothing.</div></div>
          <div class="help-flow-step"><span class="help-step-num">4</span><div><strong>CONFIGURE</strong> — Set budget and staff levels, choose departments to support the operation. More resources and matching departments = higher success probability. Each recommended department adds +8%.</div></div>
          <div class="help-flow-step"><span class="help-step-num">5</span><div><strong>EXECUTING</strong> — The operation runs. Assigned departments are DEPLOYED and unavailable. Advance days until resolution.</div></div>
          <div class="help-flow-step"><span class="help-step-num">6</span><div><strong>RESULT</strong> — Success earns confidence and a small budget recovery. Failure costs confidence. Archive the mission to clear it from your desk.</div></div>
        </div>
      </div>

      <div class="help-section">
        <div class="help-section-title">DEPARTMENTS</div>
        ${DEPT_CONFIG.map(d => `<div class="help-dept-row">
          <div class="help-dept-name">${d.name}</div>
          <div class="help-dept-tip">${d.tip}</div>
        </div>`).join('')}
      </div>

      <div class="help-section">
        <div class="help-section-title">RESOURCES</div>
        <div class="help-resource-row"><strong>CONFIDENCE</strong> — Your standing with your head of state. Declines 2% per week by default. Falls sharply after failures or if high-threat missions expire. Reaches 0% and you are dismissed.</div>
        <div class="help-resource-row" style="margin-top:8px"><strong>BUDGET</strong> — Operational funds. Spent when launching operations. Regenerates partially each week. Running completely dry for a full week defunds the agency.</div>
        <div class="help-resource-row" style="margin-top:8px"><strong>STAFF</strong> — Available agents. Committed to active operations and returned to the pool when operations conclude.</div>
      </div>

      <div class="help-section">
        <div class="help-section-title">MISSION TYPES</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          ${Object.values(MISSION_TYPES).map(t => `<div style="background:var(--bg4);border:1px solid var(--border);border-radius:4px;padding:8px 10px">
            <div style="font-family:var(--font-disp);font-weight:700;font-size:11px;color:var(--text-hi);margin-bottom:2px">${t.label}</div>
            <div style="font-size:10px;color:var(--text-dim)">${t.location === 'FOREIGN' ? '🌍 Foreign' : '🏠 Domestic'} · Threat ${t.threatRange[0]}–${t.threatRange[1]}</div>
          </div>`).join('')}
        </div>
      </div>

      <div class="help-section">
        <div class="help-section-title">CONTROLS</div>
        <div class="help-resource-row"><strong>ADVANCE DAY</strong> — Advances time one day. Keyboard: <strong>→</strong> or <strong>N</strong></div>
        <div class="help-resource-row" style="margin-top:4px"><strong>ESC</strong> — Close any open modal.</div>
        <div class="help-resource-row" style="margin-top:4px"><strong>? button</strong> — Open this handbook at any time.</div>
        <div class="help-resource-row" style="margin-top:4px">Hover over most interface elements for contextual help.</div>
      </div>
    </div>
  `;
  showModal();
}

// =============================================================================
// MODAL SYSTEM
// =============================================================================

function showModal() { document.getElementById('modal-overlay').classList.remove('hidden'); }
function hideModal() { document.getElementById('modal-overlay').classList.add('hidden'); }
function closeModalBg(e) { if (e.target === document.getElementById('modal-overlay')) hideModal(); }

// =============================================================================
// SCREEN MANAGEMENT
// =============================================================================

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(`screen-${name}`);
  if (el) el.classList.add('active');
}

// =============================================================================
// COUNTRY SELECTION RENDER
// =============================================================================

function renderCountrySelect() {
  const grid = document.getElementById('country-grid');
  grid.innerHTML = Object.entries(COUNTRIES).map(([code, cfg]) => `
    <div class="country-card">
      <div class="country-flag">${cfg.flag}</div>
      <div class="country-name">${cfg.name}</div>
      <div class="country-agency">${cfg.agency}</div>
      <div class="country-reports">${cfg.reportsTo}</div>
      <div class="country-stats">
        <div class="c-stat"><span class="c-stat-lbl">BUDGET</span><span class="c-stat-val">${cfg.budgetLabel}</span></div>
        <div class="c-stat"><span class="c-stat-lbl">STAFF</span><span class="c-stat-val">${cfg.staffLabel}</span></div>
        <div class="c-stat"><span class="c-stat-lbl">CONFIDENCE</span><span class="c-stat-val">${cfg.confLabel}</span></div>
      </div>
      <div class="country-desc">${cfg.desc}</div>
      <button class="btn-assume" onclick="startGame('${code}')">ASSUME COMMAND</button>
    </div>
  `).join('');
}

// =============================================================================
// KEYBOARD SHORTCUTS
// =============================================================================

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'n') {
    if (document.getElementById('screen-game')?.classList.contains('active') &&
        !document.getElementById('modal-overlay')?.classList.contains('hidden') === false) {
      advanceDay();
    }
  }
  if (e.key === 'Escape') hideModal();
  if (e.key === '?') {
    if (document.getElementById('screen-game')?.classList.contains('active')) showHelp();
  }
});

// =============================================================================
// BOOTSTRAP
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  renderCountrySelect();
  showScreen('select');
  document.getElementById('btn-advance').addEventListener('click', advanceDay);
  document.getElementById('btn-help').addEventListener('click', showHelp);
  initTooltips();
});
