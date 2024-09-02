// -------------------------------------------------------------------------------------------

const ones = [
	'',
	'one',
	'two',
	'three',
	'four',
	'five',
	'six',
	'seven',
	'eight',
	'nine',
];
const teens = [
	'',
	'eleven',
	'twelve',
	'thirteen',
	'fourteen',
	'fifteen',
	'sixteen',
	'seventeen',
	'eighteen',
	'nineteen',
];
const tens = [
	'',
	'ten',
	'twenty',
	'thirty',
	'forty',
	'fifty',
	'sixty',
	'seventy',
	'eighty',
	'ninety',
];

// -------------------------------------------------------------------------------------------

const convertToWords = (num: number): string => {
	const numToWords = (n: number): string => {
		if (n === 0) return '';
		if (n < 10) return ones[n];
		if (n < 20) return teens[n - 10];
		if (n < 100)
			return (
				tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
			);
		if (n < 1000)
			return (
				ones[Math.floor(n / 100)] +
				' hundred' +
				(n % 100 ? ' and ' + numToWords(n % 100) : '')
			);
		return '';
	};

	const splitNum = (n: number): number[] => {
		const result = [];
		result.push(n % 1000);
		n = Math.floor(n / 1000);
		result.push(n % 100);
		n = Math.floor(n / 100);
		result.push(n % 100);
		n = Math.floor(n / 100);
		result.push(n);
		return result;
	};

	const parts = splitNum(num);
	let words = '';
	if (parts[3]) words += numToWords(parts[3]) + ' crore ';
	if (parts[2]) words += numToWords(parts[2]) + ' lakh ';
	if (parts[1]) words += numToWords(parts[1]) + ' thousand ';
	if (parts[0]) words += numToWords(parts[0]);

	return words.trim() + ' rupees only';
};

// -------------------------------------------------------------------------------------------

export default convertToWords;

// -------------------------------------------------------------------------------------------
