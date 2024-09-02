// -------------------------------------------------------------------------------------------

const trimWords = (text: string, maxLength: number): string => {
	const words = text.split('');

	if (words.length <= maxLength) {
		return text;
	}

	const trimmedText = words.slice(0, maxLength).join('');
	return trimmedText;
};

// -------------------------------------------------------------------------------------------

export default trimWords;

// -------------------------------------------------------------------------------------------
