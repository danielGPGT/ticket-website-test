// Comprehensive ISO 3166-1 alpha-3 to alpha-2 country code mapping
const ISO3_TO_ISO2: Record<string, string> = {
	// Europe
	GBR: "GB", ESP: "ES", ITA: "IT", DEU: "DE", FRA: "FR", NLD: "NL",
	PRT: "PT", AUT: "AT", BEL: "BE", DNK: "DK", SWE: "SE", NOR: "NO",
	IRL: "IE", POL: "PL", TUR: "TR", CHE: "CH", GRC: "GR", CZE: "CZ",
	HUN: "HU", ROU: "RO", FIN: "FI", RUS: "RU", UKR: "UA", HRV: "HR",
	SRB: "RS", BGR: "BG", SVK: "SK", SVN: "SI", LVA: "LV", LTU: "LT",
	EST: "EE", ISL: "IS", LUX: "LU", MNE: "ME", MKD: "MK", ALB: "AL",
	BIH: "BA", MLT: "MT", CYP: "CY", MCO: "MC", AND: "AD",
	// Americas
	USA: "US", CAN: "CA", MEX: "MX", BRA: "BR", ARG: "AR", CHL: "CL",
	COL: "CO", PER: "PE", VEN: "VE", ECU: "EC", URY: "UY", PRY: "PY",
	BOL: "BO", PAN: "PA", CRI: "CR", DOM: "DO", HND: "HN", GTM: "GT",
	NIC: "NI", SLV: "SV", CUB: "CU", JAM: "JM", HTI: "HT", TTO: "TT",
	// Asia Pacific
	AUS: "AU", NZL: "NZ", JPN: "JP", CHN: "CN", IND: "IN", KOR: "KR",
	SGP: "SG", MYS: "MY", THA: "TH", IDN: "ID", VNM: "VN", PHL: "PH",
	HKG: "HK", TWN: "TW", ARE: "AE", SAU: "SA", QAT: "QA", BHR: "BH",
	KWT: "KW", OMN: "OM", ISR: "IL", PAK: "PK", BGD: "BD", LKA: "LK",
	AZE: "AZ",
	// Africa
	ZAF: "ZA", EGY: "EG", MAR: "MA", NGA: "NG", KEN: "KE", TUN: "TN",
	ALG: "DZ", GHA: "GH", UGA: "UG", TZA: "TZ", ETH: "ET", SDN: "SD",
};

/**
 * Converts ISO 3166-1 alpha-3 country code to alpha-2
 */
export function iso3ToIso2(iso3?: string | null): string | null {
	if (!iso3) return null;
	return ISO3_TO_ISO2[iso3.toUpperCase()] ?? null;
}

/**
 * Reverse mapping: ISO 3166-1 alpha-2 to alpha-3
 */
const ISO2_TO_ISO3: Record<string, string> = Object.fromEntries(
	Object.entries(ISO3_TO_ISO2).map(([iso3, iso2]) => [iso2, iso3])
);

/**
 * Converts ISO 3166-1 alpha-2 country code to alpha-3
 */
export function iso2ToIso3(iso2?: string | null): string | null {
	if (!iso2) return null;
	return ISO2_TO_ISO3[iso2.toUpperCase()] ?? null;
}

/**
 * Normalizes a country code to ISO 3 format (as required by XS2 API)
 * Accepts either ISO 2 or ISO 3, returns ISO 3
 */
export function normalizeToIso3(code?: string | null): string | null {
	if (!code) return null;
	const upper = code.toUpperCase();
	// If it's already ISO 3 (3 characters), return as-is
	if (upper.length === 3) return upper;
	// If it's ISO 2 (2 characters), convert to ISO 3
	if (upper.length === 2) return iso2ToIso3(upper);
	return null;
}

/**
 * Gets the SVG flag path for a country code
 * Returns the path to the flag SVG file in public/images/country-flags/
 */
export function getFlagPath(iso2?: string | null): string | null {
	if (!iso2) return null;
	const code = iso2.toUpperCase();
	if (code.length !== 2) return null;
	return `/images/country-flags/${code.toLowerCase()}.svg`;
}

/**
 * Gets the SVG flag path from ISO 3166-1 alpha-3 country code
 */
export function getFlagPathFromIso3(iso3?: string | null): string | null {
	const iso2 = iso3ToIso2(iso3);
	return getFlagPath(iso2);
}

/**
 * Generates a flag emoji from ISO 3166-1 alpha-2 country code
 * DEPRECATED: Use CountryFlag component with SVG flags instead
 * Returns empty string if code is invalid
 */
export function flagEmoji(iso2?: string | null): string {
	if (!iso2) return "";
	const code = iso2.toUpperCase();
	if (code.length !== 2) return "";
	try {
		// Convert country code to flag emoji (regional indicator symbols)
		return String.fromCodePoint(...[...code].map(c => 0x1f1e6 + (c.charCodeAt(0) - 65)));
	} catch {
		return "";
	}
}

/**
 * Gets flag emoji from ISO 3166-1 alpha-3 country code
 * DEPRECATED: Use CountryFlag component with SVG flags instead
 */
export function getFlagFromIso3(iso3?: string | null): string {
	const iso2 = iso3ToIso2(iso3);
	return flagEmoji(iso2);
}

/**
 * Country names mapping (ISO 3166-1 alpha-3 to readable name)
 */
const COUNTRY_NAMES: Record<string, string> = {
	GBR: "United Kingdom",
	ESP: "Spain",
	ITA: "Italy",
	DEU: "Germany",
	FRA: "France",
	NLD: "Netherlands",
	PRT: "Portugal",
	AUT: "Austria",
	BEL: "Belgium",
	DNK: "Denmark",
	SWE: "Sweden",
	NOR: "Norway",
	IRL: "Ireland",
	POL: "Poland",
	TUR: "Turkey",
	CHE: "Switzerland",
	GRC: "Greece",
	CZE: "Czech Republic",
	HUN: "Hungary",
	ROU: "Romania",
	FIN: "Finland",
	RUS: "Russia",
	UKR: "Ukraine",
	HRV: "Croatia",
	SRB: "Serbia",
	BGR: "Bulgaria",
	SVK: "Slovakia",
	SVN: "Slovenia",
	LVA: "Latvia",
	LTU: "Lithuania",
	EST: "Estonia",
	ISL: "Iceland",
	LUX: "Luxembourg",
	MNE: "Montenegro",
	MKD: "North Macedonia",
	ALB: "Albania",
	BIH: "Bosnia and Herzegovina",
	MLT: "Malta",
	CYP: "Cyprus",
	MCO: "Monaco",
	AND: "Andorra",
	USA: "United States",
	CAN: "Canada",
	MEX: "Mexico",
	BRA: "Brazil",
	ARG: "Argentina",
	CHL: "Chile",
	COL: "Colombia",
	PER: "Peru",
	VEN: "Venezuela",
	ECU: "Ecuador",
	URY: "Uruguay",
	PRY: "Paraguay",
	BOL: "Bolivia",
	PAN: "Panama",
	CRI: "Costa Rica",
	DOM: "Dominican Republic",
	HND: "Honduras",
	GTM: "Guatemala",
	NIC: "Nicaragua",
	SLV: "El Salvador",
	CUB: "Cuba",
	JAM: "Jamaica",
	HTI: "Haiti",
	TTO: "Trinidad and Tobago",
	AUS: "Australia",
	NZL: "New Zealand",
	JPN: "Japan",
	CHN: "China",
	IND: "India",
	KOR: "South Korea",
	SGP: "Singapore",
	MYS: "Malaysia",
	THA: "Thailand",
	IDN: "Indonesia",
	VNM: "Vietnam",
	PHL: "Philippines",
	HKG: "Hong Kong",
	TWN: "Taiwan",
	ARE: "United Arab Emirates",
	SAU: "Saudi Arabia",
	QAT: "Qatar",
	BHR: "Bahrain",
	KWT: "Kuwait",
	OMN: "Oman",
	ISR: "Israel",
	PAK: "Pakistan",
	BGD: "Bangladesh",
	LKA: "Sri Lanka",
	AZE: "Azerbaijan",
	ZAF: "South Africa",
	EGY: "Egypt",
	MAR: "Morocco",
	NGA: "Nigeria",
	KEN: "Kenya",
	TUN: "Tunisia",
	ALG: "Algeria",
	GHA: "Ghana",
	UGA: "Uganda",
	TZA: "Tanzania",
	ETH: "Ethiopia",
	SDN: "Sudan",
};

/**
 * Gets a readable country name from a country code (ISO 2 or ISO 3)
 */
export function getCountryName(code?: string | null): string {
	if (!code) return "";
	
	const upper = code.toUpperCase();
	
	// If it's already a country name (3+ chars), return as-is if found
	if (upper.length >= 3 && COUNTRY_NAMES[upper]) {
		return COUNTRY_NAMES[upper];
	}
	
	// If it's ISO 2, convert to ISO 3 first
	if (upper.length === 2) {
		const iso3 = iso2ToIso3(upper);
		if (iso3 && COUNTRY_NAMES[iso3]) {
			return COUNTRY_NAMES[iso3];
		}
	}
	
	// Fallback: return the code as-is
	return code;
}

