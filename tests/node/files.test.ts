import { describe, expect, test } from 'vitest';
import { canPreview, fileKind, formatFileSize, matchesAccept, sameFile } from '../../src/lib/utils/files.js';

function file(name: string, type = '', size = 1, lastModified = 1) {
	return new File([new Uint8Array(size)], name, { type, lastModified });
}

describe('files utilities', () => {
	test('matchesAccept reads extensions, MIME wildcards and exact types, ignoring case and spaces', () => {
		expect(matchesAccept(file('a.exe'), undefined)).toBe(true);
		expect(matchesAccept(file('a.exe'), '')).toBe(true);
		expect(matchesAccept(file('Report.PDF'), '.pdf')).toBe(true);
		expect(matchesAccept(file('photo', 'image/png'), 'image/*')).toBe(true);
		expect(matchesAccept(file('photo', 'video/mp4'), 'image/*')).toBe(false);
		expect(matchesAccept(file('a.docx', 'application/pdf'), ' .docx , application/pdf ')).toBe(true);
		expect(matchesAccept(file('a.txt', 'text/plain'), 'application/pdf, .csv')).toBe(false);
		expect(matchesAccept(file('archive.tar.gz'), '.gz')).toBe(true);
	});

	test('fileKind looks at the MIME type, then at the extension', () => {
		expect(fileKind(file('x', 'application/pdf'))).toBe('pdf');
		expect(fileKind(file('x', 'image/heic'))).toBe('image');
		expect(fileKind(file('x', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'))).toBe(
			'spreadsheet'
		);
		expect(fileKind(file('x', 'text/csv'))).toBe('spreadsheet');
		expect(fileKind(file('x', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'))).toBe(
			'document'
		);
		expect(fileKind(file('x', 'application/vnd.ms-powerpoint'))).toBe('presentation');
		expect(fileKind(file('x', 'application/x-zip-compressed'))).toBe('archive');
		expect(fileKind(file('x', 'video/mp4'))).toBe('video');
		expect(fileKind(file('x', 'audio/mpeg'))).toBe('audio');
		expect(fileKind(file('CONTRACT.DOCX'))).toBe('document');
		expect(fileKind(file('photo.JPG'))).toBe('image');
		expect(fileKind(file('backup.7z'))).toBe('archive');
		expect(fileKind(file('README'))).toBe('other');
		expect(fileKind(file('.env'))).toBe('other');
	});

	test('canPreview is true only for image types a browser can show', () => {
		expect(canPreview(file('a', 'image/png'))).toBe(true);
		expect(canPreview(file('a', 'image/svg+xml'))).toBe(true);
		expect(canPreview(file('a', 'image/heic'))).toBe(false);
		expect(canPreview(file('a.jpg'))).toBe(false);
	});

	test('sameFile compares name, size and date', () => {
		const a = file('a.pdf', '', 10, 5);
		expect(sameFile(a, a)).toBe(true);
		expect(sameFile(a, file('a.pdf', '', 10, 5))).toBe(true);
		expect(sameFile(a, file('a.pdf', '', 11, 5))).toBe(false);
		expect(sameFile(a, file('a.pdf', '', 10, 6))).toBe(false);
		expect(sameFile(a, file('b.pdf', '', 10, 5))).toBe(false);
	});

	test('formatFileSize uses decimal units and the locale', () => {
		expect(formatFileSize(0)).toBe('0 bytes');
		expect(formatFileSize(1)).toBe('1 byte');
		expect(formatFileSize(999)).toBe('999 bytes');
		expect(formatFileSize(1000)).toBe('1 kB');
		expect(formatFileSize(284_000)).toBe('284 kB');
		expect(formatFileSize(1_250_000)).toBe('1.3 MB');
		expect(formatFileSize(10_000_000)).toBe('10 MB');
		expect(formatFileSize(3_200_000_000)).toBe('3.2 GB');
		expect(formatFileSize(1_250_000, 'it')).toBe('1,3 MB');
		expect(formatFileSize(-5)).toBe('0 bytes');
	});
});
