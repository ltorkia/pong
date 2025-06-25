/**
 * Alterne entre deux classes CSS sur un élément, avec une classe optionnelle.
 * Si l'élément a la classe classA, elle est remplacée par classB (et classC ajoutée si fournie).
 * Sinon, classB (et classC) sont retirées, et classA ajoutée.
 */
export function toggleClass(el: Element | null, classA: string, classB: string, classC?: string): void {
	if (!el) return;
	if (el.classList.contains(classA)) {
		el.classList.remove(classA);
		el.classList.add(classB);
		if (classC) {
			el.classList.add(classC);
		}
	} else {
		if (classC) {
			el.classList.remove(classC);
		}
		el.classList.remove(classB);
		el.classList.add(classA);
	}
}