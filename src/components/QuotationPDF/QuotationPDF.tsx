// -------------------------------------------------------------------------------------------

import './QuotationPDF.scss';

import { QuotationPDFInterface } from './QuotationPDF.type';

// -------------------------------------------------------------------------------------------

const QuotationPDF = ({
	htmlId,
	party,
	deliveryBranches,
	goodsTypes,
	branch,
	quotations,
	company,
}: QuotationPDFInterface) => {
	const getTodaysDate = (): string => {
		const today = new Date();
		const day = today.getDate().toString().padStart(2, '0');
		const month = (today.getMonth() + 1).toString().padStart(2, '0');
		const year = today.getFullYear().toString();

		return `${day}-${month}-${year}`;
	};

	const getBranchNameById = (branchId: number) => {
		for (const branch of deliveryBranches) {
			if (branch.branchId === branchId) {
				return branch.name;
			}
		}
		return '';
	};

	const getGoodsTypeById = (goodsTypeId: number) => {
		for (const type of goodsTypes) {
			if (type.goodsTypeId === goodsTypeId) {
				return type.goodsType;
			}
		}
		return '';
	};

	return (
		<div
			data-component='quotation'
			className='container'
		>
			<div
				data-component='quotation'
				className='page'
				id={htmlId}
			>
				<div
					data-component='quotation'
					className='top'
				>
					<div
						data-component='quotation'
						className='line'
					></div>
					<div
						data-component='quotation'
						className='title'
					>
						{company.companyName ? company.companyName : ''}
					</div>
					<div
						data-component='quotation'
						className='line'
					></div>
					<div
						data-component='quotation'
						className='address'
					>
						{company.address && <div>H.O: {company.address}</div>}
						{company.phone && <div>Phone: {company.phone}</div>}
						<br />
						{branch?.address && <div>B.O: {branch.address}</div>}
						{branch?.phone && <div>Phone: {branch.phone}</div>}
					</div>
				</div>
				<div
					data-component='quotation'
					className='middle'
				>
					<div
						data-component='quotation'
						className='title'
					>
						TRANSPORT QUOTATION
					</div>
					<div
						data-component='quotation'
						className='details-container'
					>
						<div
							data-component='quotation'
							className='detail'
						>
							Quotation No.: {party.partyId}
						</div>
						<div
							data-component='quotation'
							className='detail'
						>
							Date: {getTodaysDate()}
						</div>
					</div>
					<div
						data-component='quotation'
						className='to-container'
					>
						<div
							data-component='quotation'
							className='to-label'
						>
							To,
						</div>
						<div
							data-component='quotation'
							className='to-value'
						>
							{party.partyName && <div>{party.partyName},</div>}
							{party.address && <div>{party.address}</div>}
						</div>
					</div>
					<div
						data-component='quotation'
						className='subject'
					>
						Subject: Submission of quotation for transportation
					</div>
					<div
						data-component='quotation'
						className='line'
					></div>
					<div
						data-component='quotation'
						className='header-text'
					>
						{party.headerText ? party.headerText : ''}
					</div>
					<div
						data-component='quotation'
						className='pdf-table-container'
					>
						<table>
							<thead>
								<tr>
									<th>Sr No.</th>
									<th>Destination</th>
									<th>Description</th>
									<th>Rate/Weight</th>
									<th>Rate/Art.</th>
									<th>Door Delivery</th>
									<th>Hamali/Weight</th>
									<th>Hamali/Art.</th>
									<th>Days</th>
								</tr>
							</thead>
							<tbody>
								{quotations.map((quotation, index) => {
									return (
										<tr key={`quotation-${index}`}>
											<td>{index + 1}</td>
											<td>
												{quotation.branchId
													? getBranchNameById(
															quotation.branchId
													  )
													: ''}
											</td>
											<td>
												{quotation.goodsTypeId
													? getGoodsTypeById(
															quotation.goodsTypeId
													  )
													: ''}
											</td>
											<td>
												{quotation.rateType === 2
													? `₹${quotation.billRate}`
													: ''}
											</td>
											<td>
												{quotation.rateType === 1
													? `₹${quotation.billRate}`
													: ''}
											</td>
											<td>
												{quotation.billDoorDeliveryCharges
													? `₹${quotation.billDoorDeliveryCharges}`
													: ''}
											</td>
											<td>
												{quotation.hamaliType === 2
													? `₹${quotation.billHamali}`
													: ''}
											</td>
											<td>
												{quotation.hamaliType === 1
													? `₹${quotation.billHamali}`
													: ''}
											</td>
											<td>{quotation.deliverydays}</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
					<div
						data-component='quotation'
						className='charges-container'
					>
						<table>
							<tbody>
								<tr>
									<td>Bilty Charges</td>
									<th>
										: ₹
										{party.biltyCharge
											? party.biltyCharge
											: '00'}
									</th>
								</tr>
								<tr>
									<td>Carting Charges</td>
									<th>
										: ₹
										{party.carting ? party.carting : '00'}
									</th>
								</tr>
								<tr>
									<td>Commission Charges</td>
									<th>
										: ₹
										{party.commission
											? party.commission
											: '00'}
									</th>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
				<div
					data-component='quotation'
					className='bottom'
				>
					<div
						data-component='quotation'
						className='bottom-text'
					>
						{party.botttomText ? party.botttomText : ''}
					</div>
					<div
						data-component='quotation'
						className='line'
					></div>
					<div
						data-component='quotation'
						className='text'
					>
						Experience the pinnacle of transportation excellence
						with our unparalleled Transport solutions. We pride
						ourselves on delivering the gold standard in
						reliability, efficiency, and innovation. Seamlessly
						connecting the world through our cutting-edge
						technology, Trust in our commitment to excellence as we
						propel your transportation endeavors to new heights,
						setting the standard for excellence in the industry.
					</div>
					<div
						data-component='quotation'
						className='line'
					></div>
					<div
						data-component='quotation'
						className='for-container'
					>
						<div
							data-component='quotation'
							className='for-label'
						>
							For ARL ROADLINES
						</div>
						<div
							data-component='quotation'
							className='for-value'
						>
							Authorised Signatory
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

// -------------------------------------------------------------------------------------------

export default QuotationPDF;

// -------------------------------------------------------------------------------------------
