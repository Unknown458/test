// -------------------------------------------------------------------------------------------

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// -------------------------------------------------------------------------------------------

const generatePDF = async (content: HTMLElement, fileName: string) => {
	html2canvas(content, {
		scale: 2,
	}).then((canvas) => {
		const imgData = canvas.toDataURL('image/png');
		const pdf = new jsPDF();
		const pdfWidth = pdf.internal.pageSize.getWidth();
		const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

		pdf.addImage(
			imgData,
			'SVG',
			0,
			0,
			pdfWidth,
			pdfHeight,
			undefined,
			'FAST'
		);

		pdf.save(`${fileName}.pdf`);
	});
};

// -------------------------------------------------------------------------------------------

export default generatePDF;

// -------------------------------------------------------------------------------------------
