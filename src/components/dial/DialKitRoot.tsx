'use client';

import { DialRoot } from 'dialkit';
import 'dialkit/styles.css';

/* Floating tuning panel. Hidden in production builds by default; pass
 * `productionEnabled` to DialRoot to expose it there too. */
export function DialKitRoot() {
	return <DialRoot position="top-right" />;
}
