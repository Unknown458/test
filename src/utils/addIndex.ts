

export const addIndex = {
	
		addIndex1: (array: any[]) => {
		return array.map((value, index) => ({
			...value,
			index: index + 1,
		}));
	},


	 addIndex2: (array: any[]) => {
		const total = array.length;
		return array.map((value, index) => ({
		  ...value,
		  index: total - index,
		}));
	  },


  };
  
  export default addIndex;