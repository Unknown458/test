// -------------------------------------------------------------------------------------------

import { BranchInterface } from '../services/branch/branch.types';
import addIndex from './addIndex';

// -------------------------------------------------------------------------------------------
export const arrangeBranches = (
	branches: BranchInterface[]
  ): BranchInterface[] => {
	const branchMap: { [key: number]: BranchInterface } = {};
  
	branches.forEach((branch) => {
	  if (!branch.subBranches) {
		branch.subBranches = [];
	  }
	  branchMap[branch.branchId!] = branch;
	});
  
	const mainBranches: BranchInterface[] = [];
  
	branches.forEach((branch) => {
	  if (branch.parentBranchId === null || branch.parentBranchId === 0) {
		mainBranches.push(branch);
	  } else {
		const parentBranch = branchMap[branch.parentBranchId];
		if (parentBranch) {
		  if (
			!parentBranch.subBranches!.some(
			  (subBranch) => subBranch.branchId === branch.branchId
			)
		  ) {
			parentBranch.subBranches!.push(branch);
		  }
		}
	  }
	});
  
	const addReverseIndex = (branches: BranchInterface[]) => {
	  const totalBranches = branches.length;
	  return branches.map((branch, index) => ({
		...branch,
		reverseIndex: totalBranches - index,
	  }));
	};
  
	const arrangeSubBranches = (branches: BranchInterface[]) => {
	  branches.forEach((branch) => {
		if (branch.subBranches && branch.subBranches.length > 0) {
		  branch.subBranches = addReverseIndex(addIndex.addIndex2(branch.subBranches));
		  arrangeSubBranches(branch.subBranches);
		}
	  });
	};
  
	const indexedMainBranches = addReverseIndex(addIndex.addIndex2(mainBranches));
	arrangeSubBranches(indexedMainBranches);
  
	return indexedMainBranches;
  };
// -------------------------------------------------------------------------------------------

export const removeBranchById = (
	branches: BranchInterface[],
	branchId: number
): BranchInterface[] => {
	const removeBranch = (branches: BranchInterface[]): BranchInterface[] => {
		return branches
			.filter((branch) => branch.branchId !== branchId)
			.map((branch) => ({
				...branch,
				subBranches: branch.subBranches
					? removeBranch(branch.subBranches)
					: [],
			}));
	};

	return arrangeBranches(removeBranch(branches));
};

// -------------------------------------------------------------------------------------------
