

export const addIndex = {

	addIndex1: (array: any[]) => {
	
		const sortedArray = array.sort((a, b) => {
		  return a.branchId - b.branchId;
		});
	
		const indexedArray = sortedArray.map((value, index) => ({
		  ...value,
		  index: index + 1, 
		}));
	
		return indexedArray;
	  },
		addIndex2: (array: any[]) => {
		return array.map((value, index) => ({
			...value,
			index: index + 1,
		}));
	},


	 addIndex3: (array: any[]) => {
		const total = array.length;
		return array.map((value, index) => ({
		  ...value,
		  index: total - index,
		}));
	  },

	  addIndex4: (array: any[]) => {
		return array
		  .sort((a, b) => {
			if (a.name < b.name) return -1;
			if (a.name > b.name) return 1;
			return 0;
		  })
		  .map((value, index) => ({
			...value,
			index: index + 1,
		  }));
	  },

	  addIndex5: (array: any[]) => {
		return array.map((value, index) => ({
		  ...value,
		  index: index === 0 ? array.length : index,
		}));
	},

  };
  
  export default addIndex;