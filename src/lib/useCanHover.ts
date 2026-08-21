'use client';

import { useEffect, useState } from 'react';

/**
 * True only on devices with a real hover-capable pointer.
 *
 * Touch devices fire pointerenter on tap, which would pop a card over the
 * thing the user just tried to press — so hover affordances stay gated on this.
 */
export function useCanHover() {
	const [canHover, setCanHover] = useState(false);

	useEffect(() => {
		const query = window.matchMedia('(hover: hover) and (pointer: fine)');
		const sync = () => setCanHover(query.matches);

		sync();
		query.addEventListener('change', sync);
		return () => query.removeEventListener('change', sync);
	}, []);

	return canHover;
}
