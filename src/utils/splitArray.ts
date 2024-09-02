// -------------------------------------------------------------------------------------------

export const splitArray = <T>(array: T[]): [T[], T[]] => {
	const middleIndex = Math.ceil(array.length / 2);
	const firstHalf = array.slice(0, middleIndex);
	const secondHalf = array.slice(middleIndex);

	return [firstHalf, secondHalf];
};

// -------------------------------------------------------------------------------------------

export const divideArrayIntoChunks = <T>(
	array: T[],
	chunkSize: number
): T[][] => {
	const result: T[][] = [];
	for (let i = 0; i < array.length; i += chunkSize) {
		result.push(array.slice(i, i + chunkSize));
	}
	return result;
};

// -------------------------------------------------------------------------------------------
