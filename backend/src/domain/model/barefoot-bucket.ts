// Barefoot Investor buckets: Blow sub-buckets plus Mojo (safety) and Grow (wealth)
export const barefootBuckets = [
	'Daily Expenses',
	'Splurge',
	'Smile',
	'Fire Extinguisher',
	'Mojo',
	'Grow',
] as const;

export type BarefootBucket = (typeof barefootBuckets)[number];