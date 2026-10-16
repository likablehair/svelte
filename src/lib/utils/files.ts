/** A file that FileInput or FileInputList did not add, and why. */
export interface FileRejection {
	/** The refused file. */
	file: File;
	/** `type`: not matched by `accept`; `size`: larger than `maxSize`; `count`: over `maxFiles`; `duplicate`: the same file (name, size and date) is already in the list. */
	reason: 'type' | 'size' | 'count' | 'duplicate';
}

/** Upload state of one file of a FileInputList, returned by its `fileStatus` function. */
export interface FileStatus {
	/** `uploading` shows a progress bar, `done` a check, `error` an alert icon and the message in the error color. */
	state?: 'uploading' | 'done' | 'error';
	/** Upload progress from 0 to 100, shown while `state` is `uploading`. Leave it out for a bar of unknown length. */
	progress?: number;
	/** Text after the file size, such as "Uploaded" or the reason of an error. Defaults to a text for `done` and `error`. */
	message?: string;
}

/** Family of a file, from its MIME type or extension: it picks the icon and color of its row in FileInputList. */
export type FileKind =
	| 'pdf'
	| 'image'
	| 'spreadsheet'
	| 'document'
	| 'presentation'
	| 'archive'
	| 'video'
	| 'audio'
	| 'other';

const EXTENSIONS: Record<Exclude<FileKind, 'other'>, string[]> = {
	pdf: ['pdf'],
	image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'bmp', 'heic', 'heif', 'tif', 'tiff', 'ico'],
	spreadsheet: ['xls', 'xlsx', 'xlsm', 'ods', 'csv', 'tsv', 'numbers'],
	document: ['doc', 'docx', 'odt', 'rtf', 'txt', 'md', 'pages'],
	presentation: ['ppt', 'pptx', 'odp', 'key'],
	archive: ['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz'],
	video: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'],
	audio: ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac']
};

function extensionOf(name: string): string {
	const dot = name.lastIndexOf('.');
	return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
}

export function fileKind(file: File): FileKind {
	const type = file.type.toLowerCase();
	if (type === 'application/pdf') return 'pdf';
	if (type.startsWith('image/')) return 'image';
	if (type.startsWith('video/')) return 'video';
	if (type.startsWith('audio/')) return 'audio';
	if (/spreadsheet|excel|csv/.test(type)) return 'spreadsheet';
	if (/presentation|powerpoint/.test(type)) return 'presentation';
	if (/wordprocessing|msword|opendocument\.text|rtf|^text\/plain/.test(type)) return 'document';
	if (/zip|compressed|x-tar|gzip|x-7z|x-rar/.test(type)) return 'archive';
	const extension = extensionOf(file.name);
	for (const [kind, list] of Object.entries(EXTENSIONS)) {
		if (list.includes(extension)) return kind as FileKind;
	}
	return 'other';
}

const PREVIEWABLE = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml', 'image/bmp'];

export function canPreview(file: File): boolean {
	return PREVIEWABLE.includes(file.type.toLowerCase());
}

export function matchesAccept(file: File, accept: string | undefined): boolean {
	const tokens = (accept ?? '')
		.split(',')
		.map((token) => token.trim().toLowerCase())
		.filter(Boolean);
	if (tokens.length === 0) return true;
	const name = file.name.toLowerCase();
	const type = file.type.toLowerCase();
	return tokens.some((token) => {
		if (token.startsWith('.')) return name.endsWith(token);
		if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
		return type === token;
	});
}

export function sameFile(a: File, b: File): boolean {
	return a === b || (a.name === b.name && a.size === b.size && a.lastModified === b.lastModified);
}

const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte'] as const;

/**
 * Formats a size in bytes for people, in decimal units (1 kB = 1000 bytes) and in the language of `locale`:
 * `formatFileSize(284000, 'it')` gives "284 kB". FileInput and FileInputList use it for sizes and limits.
 */
export function formatFileSize(bytes: number, locale = 'en'): string {
	let value = Math.max(0, bytes);
	let unit = 0;
	while (value >= 1000 && unit < UNITS.length - 1) {
		value /= 1000;
		unit++;
	}
	return new Intl.NumberFormat(locale, {
		style: 'unit',
		unit: UNITS[unit],
		unitDisplay: unit === 0 ? 'long' : 'short',
		maximumFractionDigits: unit === 0 || value >= 100 ? 0 : 1
	}).format(value);
}

export function objectUrl(file: File) {
	return (node: HTMLImageElement) => {
		const url = URL.createObjectURL(file);
		node.src = url;
		return () => URL.revokeObjectURL(url);
	};
}
