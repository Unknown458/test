// -------------------------------------------------------------------------------------------

const findObjectInArray = (
	array: any[],
	property: string,
	value: any
): any | '--' => {
	const object = array.find(
		(obj) =>
			JSON.stringify(obj[property])?.toUpperCase() ===
			JSON.stringify(value)?.toUpperCase()
	);

	if (object) {
		return object;
	}

	return '--';
};

// -------------------------------------------------------------------------------------------

export default findObjectInArray;

// -------------------------------------------------------------------------------------------
