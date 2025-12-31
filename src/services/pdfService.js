/**
 * ChangeFlow AI - PDF Export Service
 * Generates professional PDF packages for change orders
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate a Change Order PDF package
 * @param {Object} changeOrder - The change order data
 * @param {Array} tickets - Array of linked tickets
 * @param {Object} project - Project details
 * @param {Array} attachments - Optional attachments per ticket
 * @returns {jsPDF} - The PDF document
 */
export async function generateChangeOrderPDF(changeOrder, tickets, project, attachments = {}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Colors
  const primaryColor = [16, 185, 129]; // emerald-500
  const darkText = [30, 41, 59]; // slate-800
  const lightText = [100, 116, 139]; // slate-500

  // Helper: Add page header
  const addHeader = () => {
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('CHANGE ORDER', margin, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(changeOrder.co_number || 'DRAFT', pageWidth - margin, 25, { align: 'right' });
  };

  // Helper: Add section title
  const addSectionTitle = (title, yPos) => {
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, yPos, pageWidth - (margin * 2), 8, 'F');
    doc.setTextColor(...darkText);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 3, yPos + 5.5);
    return yPos + 12;
  };

  // Helper: Add key-value row
  const addRow = (label, value, yPos) => {
    doc.setTextColor(...lightText);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(label + ':', margin, yPos);
    
    doc.setTextColor(...darkText);
    doc.setFont('helvetica', 'bold');
    doc.text(String(value || '—'), margin + 45, yPos);
    return yPos + 6;
  };

  // Helper: Check for new page
  const checkNewPage = (requiredSpace) => {
    if (y + requiredSpace > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      y = 20;
      return true;
    }
    return false;
  };

  // ===== PAGE 1: COVER / SUMMARY =====
  addHeader();
  y = 50;

  // Project Info Section
  y = addSectionTitle('PROJECT INFORMATION', y);
  y = addRow('Project', project?.name || 'N/A', y);
  y = addRow('Project Code', project?.project_code || 'N/A', y);
  y = addRow('Date', new Date().toLocaleDateString(), y);
  y += 5;

  // Change Order Info
  y = addSectionTitle('CHANGE ORDER DETAILS', y);
  y = addRow('CO Number', changeOrder.co_number || 'DRAFT', y);
  y = addRow('Title', changeOrder.title || 'Untitled', y);
  y = addRow('Status', (changeOrder.status || 'draft').toUpperCase(), y);
  y = addRow('Created', new Date(changeOrder.created_at).toLocaleDateString(), y);
  if (changeOrder.submitted_at) {
    y = addRow('Submitted', new Date(changeOrder.submitted_at).toLocaleDateString(), y);
  }
  if (changeOrder.approved_at) {
    y = addRow('Approved', new Date(changeOrder.approved_at).toLocaleDateString(), y);
  }
  y += 5;

  // Financial Summary
  y = addSectionTitle('FINANCIAL SUMMARY', y);
  
  const originalAmount = parseFloat(changeOrder.original_amount || 0);
  const currentAmount = parseFloat(changeOrder.current_amount || 0);
  const variance = currentAmount - originalAmount;
  const variancePercent = originalAmount > 0 ? ((variance / originalAmount) * 100).toFixed(1) : 0;

  y = addRow('Original Amount', '$' + originalAmount.toLocaleString(), y);
  y = addRow('Current Amount', '$' + currentAmount.toLocaleString(), y);
  y = addRow('Variance', (variance >= 0 ? '+$' : '-$') + Math.abs(variance).toLocaleString() + ' (' + variancePercent + '%)', y);
  y = addRow('Tickets Included', tickets.length.toString(), y);
  y += 5;

  // Notes
  if (changeOrder.notes) {
    y = addSectionTitle('NOTES', y);
    doc.setTextColor(...darkText);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(changeOrder.notes, pageWidth - (margin * 2));
    doc.text(splitNotes, margin, y);
    y += splitNotes.length * 5 + 5;
  }

  // ===== PAGE 2+: TICKETS TABLE =====
  if (tickets.length > 0) {
    doc.addPage();
    y = 20;

    doc.setTextColor(...darkText);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TICKET DETAILS', margin, y);
    y += 10;

    // Tickets table
    const ticketRows = tickets.map((ticket, idx) => [
      (idx + 1).toString(),
      ticket.description?.substring(0, 40) || 'No description',
      ticket.location || '—',
      new Date(ticket.created_at).toLocaleDateString(),
      '$' + parseFloat(ticket.labor_total || 0).toLocaleString(),
      '$' + parseFloat(ticket.materials_total || 0).toLocaleString(),
      '$' + parseFloat(ticket.total_amount || 0).toLocaleString()
    ]);

    autoTable(doc, {
      startY: y,
      head: [['#', 'Description', 'Location', 'Date', 'Labor', 'Materials', 'Total']],
      body: ticketRows,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      bodyStyles: {
        fontSize: 8,
        textColor: darkText
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 50 },
        2: { cellWidth: 30 },
        3: { cellWidth: 22 },
        4: { cellWidth: 22, halign: 'right' },
        5: { cellWidth: 22, halign: 'right' },
        6: { cellWidth: 22, halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });

    y = doc.lastAutoTable.finalY + 10;

    // Totals row
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, pageWidth - (margin * 2), 10, 'F');
    doc.setTextColor(...darkText);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', margin + 3, y + 7);
    doc.text('$' + currentAmount.toLocaleString(), pageWidth - margin - 3, y + 7, { align: 'right' });
  }

  // ===== DETAILED TICKET BREAKDOWNS =====
  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    doc.addPage();
    y = 20;

    // Ticket header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TICKET ' + (i + 1) + ' OF ' + tickets.length, margin, 16);
    y = 35;

    // Ticket info
    y = addSectionTitle('TICKET INFORMATION', y);
    y = addRow('Description', ticket.description || 'No description', y);
    y = addRow('Location', ticket.location || '—', y);
    y = addRow('Date', new Date(ticket.created_at).toLocaleDateString(), y);
    y = addRow('Status', (ticket.status || 'draft').toUpperCase(), y);
    y += 5;

    // Labor breakdown
    if (ticket.labor && ticket.labor.length > 0) {
      y = addSectionTitle('LABOR BREAKDOWN', y);
      
      const laborRows = ticket.labor.map(item => [
        item.trade || item.workers || '—',
        (item.workers || 1).toString(),
        (item.hours || item.hours_total || 0).toString(),
        '$' + parseFloat(item.rate || 0).toLocaleString(),
        '$' + parseFloat(item.total || (item.hours * item.rate) || 0).toLocaleString()
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Trade', 'Workers', 'Hours', 'Rate', 'Total']],
        body: laborRows,
        theme: 'grid',
        headStyles: { fillColor: [71, 85, 105], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        margin: { left: margin, right: margin }
      });
      y = doc.lastAutoTable.finalY + 5;
    }

    // Materials breakdown
    if (ticket.materials && ticket.materials.length > 0) {
      checkNewPage(50);
      y = addSectionTitle('MATERIALS BREAKDOWN', y);
      
      const materialRows = ticket.materials.map(item => [
        item.item || '—',
        (item.quantity || 0).toString(),
        item.unit || 'ea',
        '$' + parseFloat(item.unit_cost || 0).toLocaleString(),
        '$' + parseFloat(item.total || (item.quantity * item.unit_cost) || 0).toLocaleString()
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Item', 'Quantity', 'Unit', 'Unit Cost', 'Total']],
        body: materialRows,
        theme: 'grid',
        headStyles: { fillColor: [71, 85, 105], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        margin: { left: margin, right: margin }
      });
      y = doc.lastAutoTable.finalY + 5;
    }

    // Ticket totals
    checkNewPage(30);
    doc.setFillColor(16, 185, 129, 0.1);
    doc.rect(margin, y, pageWidth - (margin * 2), 25, 'F');
    
    doc.setTextColor(...darkText);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const col1 = margin + 5;
    const col2 = margin + 60;
    const col3 = margin + 115;
    
    doc.text('Labor Total:', col1, y + 10);
    doc.setFont('helvetica', 'bold');
    doc.text('$' + parseFloat(ticket.labor_total || 0).toLocaleString(), col1, y + 18);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Materials Total:', col2, y + 10);
    doc.setFont('helvetica', 'bold');
    doc.text('$' + parseFloat(ticket.materials_total || 0).toLocaleString(), col2, y + 18);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Ticket Total:', col3, y + 10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('$' + parseFloat(ticket.total_amount || 0).toLocaleString(), col3, y + 18);
  }

  // ===== SIGNATURE PAGE =====
  doc.addPage();
  y = 20;

  doc.setTextColor(...darkText);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('APPROVAL SIGNATURES', margin, y);
  y += 15;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...lightText);
  doc.text('By signing below, the parties acknowledge and approve this change order.', margin, y);
  y += 20;

  // Signature boxes
  const signatureBoxes = [
    { label: 'Contractor Representative', title: 'Name / Title' },
    { label: 'Owner Representative', title: 'Name / Title' },
    { label: 'Architect (if required)', title: 'Name / Title' }
  ];

  signatureBoxes.forEach((box, idx) => {
    checkNewPage(50);
    
    doc.setTextColor(...darkText);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(box.label, margin, y);
    y += 8;

    // Signature line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y + 20, margin + 80, y + 20);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...lightText);
    doc.text('Signature', margin, y + 25);

    // Date line
    doc.line(margin + 100, y + 20, margin + 150, y + 20);
    doc.text('Date', margin + 100, y + 25);

    y += 40;
  });

  // Footer on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...lightText);
    doc.text(
      'Generated by ChangeFlow AI | ' + new Date().toLocaleString() + ' | Page ' + i + ' of ' + totalPages,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  return doc;
}

/**
 * Download the PDF
 */
export function downloadPDF(doc, filename) {
  doc.save(filename);
}

/**
 * Generate and download in one call
 */
export async function exportChangeOrderPDF(changeOrder, tickets, project) {
  const doc = await generateChangeOrderPDF(changeOrder, tickets, project);
  const filename = `${changeOrder.co_number || 'CO-DRAFT'}_${project?.project_code || 'PROJECT'}_${new Date().toISOString().split('T')[0]}.pdf`;
  downloadPDF(doc, filename);
  return filename;
}
