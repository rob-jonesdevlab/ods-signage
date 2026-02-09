'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function useExport() {
    /**
     * Export data to CSV format
     */
    const exportToCSV = (data: any[], filename: string) => {
        if (data.length === 0) {
            alert('No data to export');
            return;
        }

        // Get headers from first object
        const headers = Object.keys(data[0]);

        // Create CSV content
        const csvContent = [
            headers.join(','), // Header row
            ...data.map(row =>
                headers.map(header => {
                    const value = row[header];
                    // Escape quotes and wrap in quotes if contains comma
                    const stringValue = String(value ?? '');
                    return stringValue.includes(',') || stringValue.includes('"')
                        ? `"${stringValue.replace(/"/g, '""')}"`
                        : stringValue;
                }).join(',')
            )
        ].join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${getTimestamp()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    /**
     * Export data to PDF format with table
     */
    const exportToPDF = (data: any[], filename: string, title: string) => {
        if (data.length === 0) {
            alert('No data to export');
            return;
        }

        const doc = new jsPDF();

        // Add title
        doc.setFontSize(18);
        doc.text(title, 14, 20);

        // Add timestamp
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

        // Get headers and rows
        const headers = Object.keys(data[0]);
        const rows = data.map(row => headers.map(header => String(row[header] ?? '')));

        // Add table
        autoTable(doc, {
            head: [headers],
            body: rows,
            startY: 35,
            theme: 'grid',
            styles: {
                fontSize: 9,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [59, 130, 246], // Blue
                textColor: 255,
                fontStyle: 'bold',
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250],
            },
        });

        // Save PDF
        doc.save(`${filename}_${getTimestamp()}.pdf`);
    };

    /**
     * Export data to JSON format
     */
    const exportToJSON = (data: any[], filename: string) => {
        if (data.length === 0) {
            alert('No data to export');
            return;
        }

        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${getTimestamp()}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    /**
     * Get timestamp for filename
     */
    const getTimestamp = () => {
        const now = new Date();
        return now.toISOString().split('T')[0]; // YYYY-MM-DD
    };

    return {
        exportToCSV,
        exportToPDF,
        exportToJSON,
    };
}
