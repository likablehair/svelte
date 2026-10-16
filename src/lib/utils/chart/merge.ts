type Plain = Record<string, unknown>;

function isPlain(value: unknown): value is Plain {
	if (typeof value !== 'object' || value === null) return false;
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}

export function mergeOptions<T>(...sources: unknown[]): T {
	const result: Plain = {};
	for (const source of sources) {
		if (!isPlain(source)) continue;
		for (const [key, value] of Object.entries(source)) {
			if (value === undefined) continue;
			result[key] = isPlain(value) ? mergeOptions(isPlain(result[key]) ? result[key] : {}, value) : value;
		}
	}
	return result as T;
}
