// -------------------------------------------------------------------------------------------

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// -------------------------------------------------------------------------------------------

const printPDF = async (content: HTMLElement, format?: 'letter' | 'a4') => {
	const canvas = await html2canvas(content, { scale: 2 });
	const imgData = canvas.toDataURL('image/png');

	let contentWidth = 0;
	let contentHeight = 0;

	if (format === 'letter') {
		contentWidth = 216;
		contentHeight = 356;
	} else if (format === 'a4') {
		contentWidth = 210;
		contentHeight = 297;
	} else {
		contentWidth = canvas.width;
		contentHeight = canvas.height;
	}

	const pdf = new jsPDF({
		orientation: contentWidth > contentHeight ? 'landscape' : 'portrait',
		unit: 'mm',
		format: [contentWidth, contentHeight],
	});

	pdf.addImage(
		imgData,
		'PNG',
		0,
		0,
		contentWidth,
		contentHeight,
		undefined,
		'FAST'
	);

	pdf.autoPrint();
	pdf.output('dataurlnewwindow');
};

// -------------------------------------------------------------------------------------------

export const printMultiplePDF = async (
	contents: HTMLElement[],
	format?: 'letter' | 'a4'
) => {
	const getPdfDimensions = (canvas: HTMLCanvasElement) => {
		let contentWidth = 0;
		let contentHeight = 0;

		if (format === 'letter') {
			contentWidth = 216;
			contentHeight = 356;
		} else if (format === 'a4') {
			contentWidth = 210;
			contentHeight = 297;
		} else {
			contentWidth = canvas.width;
			contentHeight = canvas.height;
		}

		return { contentWidth, contentHeight };
	};

	const firstCanvas = await html2canvas(contents[0], { scale: 2 });
	const { contentWidth, contentHeight } = getPdfDimensions(firstCanvas);

	const pdf = new jsPDF({
		orientation: contentWidth > contentHeight ? 'landscape' : 'portrait',
		unit: 'mm',
		format: [contentWidth, contentHeight],
	});

	for (let i = 0; i < contents.length; i++) {
		const content = contents[i];

		const canvas = await html2canvas(content, { scale: 2 });
		const imgData = canvas.toDataURL('image/png');

		if (i !== 0) {
			const { contentWidth, contentHeight } = getPdfDimensions(canvas);
			pdf.addPage([contentWidth, contentHeight]);
		}

		const pdfWidth = pdf.internal.pageSize.getWidth();
		const pdfHeight = pdf.internal.pageSize.getHeight();
		const ratio = Math.min(
			pdfWidth / canvas.width,
			pdfHeight / canvas.height
		);

		const imgWidth = canvas.width * ratio;
		const imgHeight = canvas.height * ratio;

		pdf.addImage(
			imgData,
			'PNG',
			0,
			0,
			imgWidth,
			imgHeight,
			undefined,
			'FAST'
		);
	}

	pdf.autoPrint();
	pdf.output('dataurlnewwindow');
};

// -------------------------------------------------------------------------------------------

export default printPDF;

// -------------------------------------------------------------------------------------------
